import math
from dataclasses import dataclass
from typing import Optional

import torch
import torch.nn as nn
from einops import rearrange
from torch import Tensor
from torch.nn import functional as F
from transformers import LlamaModel, LlamaConfig


def find_multiple(n: int, k: int) -> int:
    if n % k == 0:
        return n
    return n + k - (n % k)


@dataclass
class ModelArgs:
    vocab_size: int = 32000
    n_layer: int = 32
    n_head: int = 32
    dim: int = 4096
    intermediate_size: int = None
    n_local_heads: int = -1
    head_dim: int = 64
    rope_base: float = 10000
    norm_eps: float = 1e-5
    max_seq_len: int = 2048
    dropout: float = 0.0

    # Additional decoding heads
    codebook_size: int = 160
    num_codebooks: int = 4
    num_in_codebooks: Optional[int] = None
    codebook_padding_idx: int = 0

    # Gradient checkpointing
    use_gradient_checkpointing: bool = True

    # NEFT
    neft_alpha: float = 0

    def __post_init__(self):
        if self.n_local_heads == -1:
            self.n_local_heads = self.n_head
        if self.intermediate_size is None:
            hidden_dim = 4 * self.dim
            n_hidden = int(2 * hidden_dim / 3)
            self.intermediate_size = find_multiple(n_hidden, 256)
        if self.num_in_codebooks is None:
            self.num_in_codebooks = self.num_codebooks
        self.head_dim = self.dim // self.n_head


class KVCache(nn.Module):
    def __init__(
        self, max_batch_size, max_seq_len, n_heads, head_dim, dtype=torch.bfloat16
    ):
        super().__init__()
        cache_shape = (max_batch_size, n_heads, max_seq_len, head_dim)
        self.register_buffer("k_cache", torch.zeros(cache_shape, dtype=dtype))
        self.register_buffer("v_cache", torch.zeros(cache_shape, dtype=dtype))

    def update(self, input_pos, k_val, v_val):
        # input_pos: [S], k_val: [B, H, S, D]
        assert input_pos.shape[0] == k_val.shape[2]

        k_out = self.k_cache
        v_out = self.v_cache
        k_out[:, :, input_pos] = k_val
        v_out[:, :, input_pos] = v_val

        return k_out, v_out


@dataclass
class TransformerForwardResult:
    token_logits: Tensor
    codebook_logits: Tensor

# class Transformer(LlamaModel):
#     def __init__(self, config: ModelArgs) -> None:
#         config = LlamaConfig(
#             { "bos_token_id": 1,
#               "eos_token_id": 2,
#               "hidden_act": "silu",
#               "hidden_size": 4096,
#               "initializer_range": 0.02,
#               "intermediate_size": 11008,
#               "max_position_embeddings": 4096,
#               "model_type": "llama",
#               "num_attention_heads": 32,
#               "num_hidden_layers": 32,
#               "num_key_value_heads": 32,
#               "pretraining_tp": 1,
#               "rms_norm_eps": 1e-05,
#               "rope_scaling": null,
#               "tie_word_embeddings": false,
#               "vocab_size": config['vocab_size']
#             })
#         super().__init__(config)
        
#         self.padding_idx = config.pad_token_id
#         self.vocab_size = config.vocab_size

#         self.embed_tokens = nn.Embedding(config.vocab_size, config.hidden_size, self.padding_idx)
#         self.layers = nn.ModuleList(
#             [LlamaDecoderLayer(config, layer_idx) for layer_idx in range(config.num_hidden_layers)]
#         )
#         self.norm = LlamaRMSNorm(config.hidden_size, eps=config.rms_norm_eps)
#         self.gradient_checkpointing = False

#         self.post_init()
    
class Transformer(nn.Module):
    def __init__(self, config: ModelArgs) -> None:
        super().__init__()
        self.config = config

        self.tok_embeddings = nn.Embedding(32000, config.dim)
        self.added_embeddings = nn.Embedding(config.vocab_size + config.codebook_size * config.num_in_codebooks - 32000, config.dim)
        
        self.layers = nn.ModuleList(
            TransformerBlock(config) for _ in range(config.n_layer)
        )
        self.norm = RMSNorm(config.dim, eps=config.norm_eps)
        self.output = nn.Linear(config.dim, 32000, bias=False)
        self.added_output = nn.Linear(config.dim, config.vocab_size + config.codebook_size * config.num_codebooks - 32000, bias=False)

        self.register_buffer(
            "freqs_cis",
            precompute_freqs_cis(
                config.max_seq_len,
                config.dim // config.n_head,
                config.rope_base,
            ),
        )
        self.register_buffer(
            "causal_mask",
            torch.tril(
                torch.ones(
                    config.max_seq_len,
                    config.max_seq_len,
                    dtype=torch.bool,
                )
            ),
        )

        # For kv cache
        self.max_batch_size = -1
        self.max_seq_len = -1

    def embeddings(self, x):
        embeddings = torch.cat([self.tok_embeddings.weight, self.added_embeddings.weight], dim=0)
        return F.embedding(x, embeddings)

    def combined_output(self, hidden):
        original_output = self.output(hidden)
        new_output = self.added_output(hidden)
        return torch.cat([original_output, new_output], -1)

    def setup_caches(
        self, max_batch_size: int, max_seq_len: int, dtype: torch.dtype = torch.bfloat16
    ):
        if self.max_seq_len >= max_seq_len and self.max_batch_size >= max_batch_size:
            return

        head_dim = self.config.dim // self.config.n_head
        max_seq_len = find_multiple(max_seq_len, 8)
        self.max_seq_len = max_seq_len
        self.max_batch_size = max_batch_size

        for b in self.layers:
            b.attention.kv_cache = KVCache(
                max_batch_size,
                max_seq_len,
                self.config.n_local_heads,
                head_dim,
                dtype=dtype,
            )

    def embed(self, x: Tensor) -> Tensor:
        # Here we want to merge the embeddings of the codebooks
        if self.config.num_in_codebooks == 0:
            return self.embeddings(x[:, 0])

        vocab_embeds = [self.embeddings(x[:, 0])]
        for i in range(self.config.num_in_codebooks):
            emb = self.embeddings(
                x[:, i + 1] + i * self.config.codebook_size + self.config.vocab_size
            )
            emb[x[:, i + 1] == self.config.codebook_padding_idx] = 0
            vocab_embeds.append(emb)

        x = torch.stack(vocab_embeds, dim=3)
        x = x.sum(dim=3)

        if self.config.neft_alpha > 0 and self.training:
            # alpha / sqrt(L * D)
            scaled_alpha = self.config.neft_alpha / math.sqrt(
                self.config.dim * x.shape[2]
            )
            x += torch.rand_like(x) * scaled_alpha

            print("NEFT alpha:", scaled_alpha)

        return x

    def compute(
        self,
        x: Tensor,
        freqs_cis: Tensor,
        mask: Tensor,
        input_pos: Optional[Tensor] = None,
    ) -> TransformerForwardResult:
        for layer in self.layers:
            if self.config.use_gradient_checkpointing and self.training:
                x = torch.utils.checkpoint.checkpoint(
                    layer, x, freqs_cis, mask, input_pos, use_reentrant=True
                )
            else:
                x = layer(x, freqs_cis, mask, input_pos=input_pos)

        x = self.norm(x)
        logits = self.combined_output(x)
        token_logits = logits[:, :, : self.config.vocab_size]

        if self.config.num_codebooks == 0:
            return TransformerForwardResult(
                token_logits=token_logits,
                codebook_logits=None,
            )

        codebook_logits = logits[:, :, self.config.vocab_size :]
        codebook_logits = rearrange(
            codebook_logits, "b n (c d) -> b n c d", c=self.config.num_codebooks
        )

        return TransformerForwardResult(
            token_logits=token_logits,
            codebook_logits=codebook_logits,
        )

    def forward(
        self, x: Tensor, key_padding_mask: Optional[Tensor] = None
    ) -> TransformerForwardResult:
        # x: (batch, num_codebooks + 1, seq_len)
        seq_len = x.size(2)

        # Here we want to merge the embeddings of the codebooks
        x = self.embed(x)

        mask = self.causal_mask[None, None, :seq_len, :seq_len]  # (B, N, Q, K)
        freqs_cis = self.freqs_cis[:seq_len]

        # Not that the causal mask here follows the definition of scaled_dot_product_attention
        # That is, FALSE means masked out
        # To maintain consistency, key_padding_mask use TRUE to mask out
        if key_padding_mask is not None:
            mask = mask & key_padding_mask[:, None, None, :].logical_not()

        return self.compute(x, freqs_cis, mask)

    def forward_generate(self, x: Tensor, input_pos: Optional[Tensor] = None) -> Tensor:
        # x: (batch, num_codebooks + 1, 1)

        assert (
            self.max_seq_len != -1 and self.max_batch_size != -1
        ), "Please call setup_caches before forward_generate"

        x = self.embed(x)

        mask = self.causal_mask[
            None, None, input_pos, : self.max_seq_len
        ]  # (B, N, Q, K)
        freqs_cis = self.freqs_cis[input_pos]

        # TODO: support key padding mask for generation

        return self.compute(x, freqs_cis, mask, input_pos=input_pos)



class TransformerBlock(nn.Module):
    def __init__(self, config: ModelArgs) -> None:
        super().__init__()
        self.attention = Attention(config)
        self.feed_forward = FeedForward(config)
        self.ffn_norm = RMSNorm(config.dim, config.norm_eps)
        self.attention_norm = RMSNorm(config.dim, config.norm_eps)

    def forward(
        self, x: Tensor, freqs_cis: Tensor, mask: Tensor, input_pos: Tensor = None
    ) -> Tensor:
        h = x + self.attention(self.attention_norm(x), freqs_cis, mask, input_pos)
        out = h + self.feed_forward(self.ffn_norm(h))
        return out


class Attention(nn.Module):
    def __init__(self, config: ModelArgs):
        super().__init__()
        assert config.dim % config.n_head == 0

        total_head_dim = (config.n_head + 2 * config.n_local_heads) * config.head_dim
        # key, query, value projections for all heads, but in a batch
        self.wqkv = nn.Linear(config.dim, total_head_dim, bias=False)
        self.wo = nn.Linear(config.dim, config.dim, bias=False)
        self.kv_cache = None

        self.dropout = config.dropout
        self.n_head = config.n_head
        self.head_dim = config.head_dim
        self.n_local_heads = config.n_local_heads
        self.dim = config.dim
        self._register_load_state_dict_pre_hook(self.load_hook)

    def load_hook(self, state_dict, prefix, *args):
        if prefix + "wq.weight" in state_dict:
            wq = state_dict.pop(prefix + "wq.weight")
            wk = state_dict.pop(prefix + "wk.weight")
            wv = state_dict.pop(prefix + "wv.weight")
            state_dict[prefix + "wqkv.weight"] = torch.cat([wq, wk, wv])

    def forward(
        self,
        x: Tensor,
        freqs_cis: Tensor,
        mask: Tensor,
        input_pos: Optional[Tensor] = None,
    ) -> Tensor:
        bsz, seqlen, _ = x.shape

        kv_size = self.n_local_heads * self.head_dim
        q, k, v = self.wqkv(x).split([self.dim, kv_size, kv_size], dim=-1)

        q = q.view(bsz, seqlen, self.n_head, self.head_dim)
        k = k.view(bsz, seqlen, self.n_local_heads, self.head_dim)
        v = v.view(bsz, seqlen, self.n_local_heads, self.head_dim)

        q = apply_rotary_emb(q, freqs_cis)
        k = apply_rotary_emb(k, freqs_cis)

        q, k, v = map(lambda x: x.transpose(1, 2), (q, k, v))

        if self.kv_cache is not None:
            k, v = self.kv_cache.update(input_pos, k, v)

        k = k.repeat_interleave(self.n_head // self.n_local_heads, dim=1)
        v = v.repeat_interleave(self.n_head // self.n_local_heads, dim=1)
        y = F.scaled_dot_product_attention(
            q,
            k,
            v,
            attn_mask=mask,
            dropout_p=self.dropout if self.training else 0.0,
        )

        y = y.transpose(1, 2).contiguous().view(bsz, seqlen, self.dim)

        return self.wo(y)


class FeedForward(nn.Module):
    def __init__(self, config: ModelArgs) -> None:
        super().__init__()
        self.w1 = nn.Linear(config.dim, config.intermediate_size, bias=False)
        self.w3 = nn.Linear(config.dim, config.intermediate_size, bias=False)
        self.w2 = nn.Linear(config.intermediate_size, config.dim, bias=False)

    def forward(self, x: Tensor) -> Tensor:
        return self.w2(F.silu(self.w1(x)) * self.w3(x))


class RMSNorm(nn.Module):
    def __init__(self, dim: int, eps: float = 1e-5):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))

    def _norm(self, x):
        return x * torch.rsqrt(torch.mean(x * x, dim=-1, keepdim=True) + self.eps)

    def forward(self, x: Tensor) -> Tensor:
        output = self._norm(x.float()).type_as(x)
        return output * self.weight


def precompute_freqs_cis(seq_len: int, n_elem: int, base: int = 10000) -> Tensor:
    freqs = 1.0 / (
        base ** (torch.arange(0, n_elem, 2)[: (n_elem // 2)].float() / n_elem)
    )
    t = torch.arange(seq_len, device=freqs.device)
    freqs = torch.outer(t, freqs)
    freqs_cis = torch.polar(torch.ones_like(freqs), freqs)
    cache = torch.stack([freqs_cis.real, freqs_cis.imag], dim=-1)
    return cache.to(dtype=torch.bfloat16)


def apply_rotary_emb(x: Tensor, freqs_cis: Tensor) -> Tensor:
    xshaped = x.float().reshape(*x.shape[:-1], -1, 2)
    freqs_cis = freqs_cis.view(1, xshaped.size(1), 1, xshaped.size(3), 2)
    x_out2 = torch.stack(
        [
            xshaped[..., 0] * freqs_cis[..., 0] - xshaped[..., 1] * freqs_cis[..., 1],
            xshaped[..., 1] * freqs_cis[..., 0] + xshaped[..., 0] * freqs_cis[..., 1],
        ],
        -1,
    )

    x_out2 = x_out2.flatten(3)
    return x_out2.type_as(x)


if __name__ == "__main__":
    args = ModelArgs(
        max_seq_len=4096,
        vocab_size=32312,
        n_layer=12,
        n_head=12,
        dim=768,
        rope_base=10000,
        norm_eps=1e-5,
        codebook_size=0,
        num_codebooks=0,
    )

    model = Transformer(args)
    model = model.cuda().bfloat16()
    print("Total params:", sum(i.numel() for i in model.parameters()) / 1024 / 1024)

    inputs = torch.randint(0, 100, (2, 5, 128)).cuda()
    key_padding_mask = torch.zeros(2, 128).bool().cuda()
    key_padding_mask[0, 2:] = True
    x1 = model(inputs, key_padding_mask=key_padding_mask)
    print(x1.token_logits.shape)
    # print(x1.codebook_logits.shape)
