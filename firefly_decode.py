from dataclasses import dataclass
from functools import partial
from math import prod
from typing import Callable, Optional, Union

import numpy as np
import soundfile as sf
import torch
import torch.nn as nn
import torch.nn.functional as F
from einops import rearrange
from torch.nn import Conv1d
from torch.nn.utils import weight_norm
from torch.nn.utils.parametrizations import weight_norm
from torch.nn.utils.parametrize import remove_parametrizations


def init_weights(m, mean=0.0, std=0.01):
    classname = m.__class__.__name__
    if classname.find("Conv") != -1:
        m.weight.data.normal_(mean, std)


def get_padding(kernel_size, dilation=1):
    return (kernel_size * dilation - dilation) // 2


class ResBlock(torch.nn.Module):
    def __init__(self, channels, kernel_size=3, dilation=(1, 3, 5)):
        super().__init__()

        self.convs1 = nn.ModuleList(
            [
                weight_norm(
                    Conv1d(
                        channels,
                        channels,
                        kernel_size,
                        1,
                        dilation=dilation[0],
                        padding=get_padding(kernel_size, dilation[0]),
                    )
                ),
                weight_norm(
                    Conv1d(
                        channels,
                        channels,
                        kernel_size,
                        1,
                        dilation=dilation[1],
                        padding=get_padding(kernel_size, dilation[1]),
                    )
                ),
                weight_norm(
                    Conv1d(
                        channels,
                        channels,
                        kernel_size,
                        1,
                        dilation=dilation[2],
                        padding=get_padding(kernel_size, dilation[2]),
                    )
                ),
            ]
        )
        self.convs1.apply(init_weights)

        self.convs2 = nn.ModuleList(
            [
                weight_norm(
                    Conv1d(
                        channels,
                        channels,
                        kernel_size,
                        1,
                        dilation=1,
                        padding=get_padding(kernel_size, 1),
                    )
                ),
                weight_norm(
                    Conv1d(
                        channels,
                        channels,
                        kernel_size,
                        1,
                        dilation=1,
                        padding=get_padding(kernel_size, 1),
                    )
                ),
                weight_norm(
                    Conv1d(
                        channels,
                        channels,
                        kernel_size,
                        1,
                        dilation=1,
                        padding=get_padding(kernel_size, 1),
                    )
                ),
            ]
        )
        self.convs2.apply(init_weights)

    def forward(self, x):
        for c1, c2 in zip(self.convs1, self.convs2):
            xt = F.silu(x)
            xt = c1(xt)
            xt = F.silu(xt)
            xt = c2(xt)
            x = xt + x
        return x

    def remove_parametrizations(self):
        for conv in self.convs1:
            remove_parametrizations(conv)
        for conv in self.convs2:
            remove_parametrizations(conv)


class ParralelBlock(nn.Module):
    def __init__(
        self,
        channels: int,
        kernel_sizes: tuple[int] = (3, 7, 11),
        dilation_sizes: tuple[tuple[int]] = ((1, 3, 5), (1, 3, 5), (1, 3, 5)),
    ):
        super().__init__()

        assert len(kernel_sizes) == len(dilation_sizes)

        self.blocks = nn.ModuleList()
        for k, d in zip(kernel_sizes, dilation_sizes):
            self.blocks.append(ResBlock(channels, k, d))

    def forward(self, x):
        xs = [block(x) for block in self.blocks]

        return torch.stack(xs, dim=0).mean(dim=0)


class HiFiGANGenerator(nn.Module):
    def __init__(
        self,
        *,
        hop_length: int = 512,
        upsample_rates: tuple[int] = (8, 8, 2, 2, 2),
        upsample_kernel_sizes: tuple[int] = (16, 16, 4, 4, 4),
        resblock_kernel_sizes: tuple[int] = (3, 7, 11),
        resblock_dilation_sizes: tuple[tuple[int]] = ((1, 3, 5), (1, 3, 5), (1, 3, 5)),
        num_mels: int = 160,
        upsample_initial_channel: int = 512,
        use_template: bool = True,
        pre_conv_kernel_size: int = 7,
        post_conv_kernel_size: int = 7,
        post_activation: Callable = partial(nn.SiLU, inplace=True),
        checkpointing: bool = False,
        condition_dim: Optional[int] = None,
    ):
        super().__init__()

        assert (
            prod(upsample_rates) == hop_length
        ), f"hop_length must be {prod(upsample_rates)}"

        self.conv_pre = weight_norm(
            nn.Conv1d(
                num_mels,
                upsample_initial_channel,
                pre_conv_kernel_size,
                1,
                padding=get_padding(pre_conv_kernel_size),
            )
        )

        self.hop_length = hop_length
        self.num_upsamples = len(upsample_rates)
        self.num_kernels = len(resblock_kernel_sizes)

        self.noise_convs = nn.ModuleList()
        self.use_template = use_template
        self.ups = nn.ModuleList()
        self.condition_dim = condition_dim

        for i, (u, k) in enumerate(zip(upsample_rates, upsample_kernel_sizes)):
            c_cur = upsample_initial_channel // (2 ** (i + 1))
            self.ups.append(
                weight_norm(
                    nn.ConvTranspose1d(
                        upsample_initial_channel // (2**i),
                        upsample_initial_channel // (2 ** (i + 1)),
                        k,
                        u,
                        padding=(k - u) // 2,
                    )
                )
            )

            if not use_template:
                continue

            if i + 1 < len(upsample_rates):
                stride_f0 = np.prod(upsample_rates[i + 1 :])
                self.noise_convs.append(
                    Conv1d(
                        1,
                        c_cur,
                        kernel_size=stride_f0 * 2,
                        stride=stride_f0,
                        padding=stride_f0 // 2,
                    )
                )
            else:
                self.noise_convs.append(Conv1d(1, c_cur, kernel_size=1))

        self.resblocks = nn.ModuleList()
        for i in range(len(self.ups)):
            ch = upsample_initial_channel // (2 ** (i + 1))
            self.resblocks.append(
                ParralelBlock(ch, resblock_kernel_sizes, resblock_dilation_sizes)
            )

        self.activation_post = post_activation()
        self.conv_post = weight_norm(
            nn.Conv1d(
                ch,
                1,
                post_conv_kernel_size,
                1,
                padding=get_padding(post_conv_kernel_size),
            )
        )
        self.ups.apply(init_weights)
        self.conv_post.apply(init_weights)

        if condition_dim is not None:
            self.condition = nn.Conv1d(condition_dim, upsample_initial_channel, 1)

        # Gradient checkpointing
        self.checkpointing = checkpointing

    def forward(self, x, template=None, condition=None):
        if self.use_template and template is None:
            length = x.shape[-1] * self.hop_length
            template = (
                torch.randn(x.shape[0], 1, length, device=x.device, dtype=x.dtype)
                * 0.003
            )

        if self.condition_dim is not None:
            x = x + self.condition(condition)

        x = self.conv_pre(x)

        for i in range(self.num_upsamples):
            x = F.silu(x, inplace=True)
            x = self.ups[i](x)

            if self.use_template:
                x = x + self.noise_convs[i](template)

            if self.training and self.checkpointing:
                x = torch.utils.checkpoint.checkpoint(
                    self.resblocks[i],
                    x,
                    use_reentrant=False,
                )
            else:
                x = self.resblocks[i](x)

        x = self.activation_post(x)
        x = self.conv_post(x)
        x = torch.tanh(x)

        return x

    def remove_parametrizations(self):
        for up in self.ups:
            remove_parametrizations(up)
        for block in self.resblocks:
            block.remove_parametrizations()
        remove_parametrizations(self.conv_pre)
        remove_parametrizations(self.conv_post)


class VectorQuantize(nn.Module):
    """
    Implementation of VQ similar to Karpathy's repo:
    https://github.com/karpathy/deep-vector-quantization
    Additionally uses following tricks from Improved VQGAN
    (https://arxiv.org/pdf/2110.04627.pdf):
        1. Factorized codes: Perform nearest neighbor lookup in low-dimensional space
            for improved codebook usage
        2. l2-normalized codes: Converts euclidean distance to cosine similarity which
            improves training stability
    """

    def __init__(self, input_dim: int, codebook_size: int, codebook_dim: int):
        super().__init__()
        self.codebook_size = codebook_size
        self.codebook_dim = codebook_dim

        self.in_proj = weight_norm(nn.Conv1d(input_dim, codebook_dim, kernel_size=1))
        self.out_proj = weight_norm(nn.Conv1d(codebook_dim, input_dim, kernel_size=1))
        self.codebook = nn.Embedding(codebook_size, codebook_dim)

    def forward(self, z):
        """Quantized the input tensor using a fixed codebook and returns
        the corresponding codebook vectors

        Parameters
        ----------
        z : Tensor[B x D x T]

        Returns
        -------
        Tensor[B x D x T]
            Quantized continuous representation of input
        Tensor[1]
            Commitment loss to train encoder to predict vectors closer to codebook
            entries
        Tensor[1]
            Codebook loss to update the codebook
        Tensor[B x T]
            Codebook indices (quantized discrete representation of input)
        Tensor[B x D x T]
            Projected latents (continuous representation of input before quantization)
        """

        # Factorized codes (ViT-VQGAN) Project input into low-dimensional space
        z_e = self.in_proj(z)  # z_e : (B x D x T)
        z_q, indices = self.decode_latents(z_e)

        commitment_loss = F.mse_loss(z_e, z_q.detach(), reduction="none").mean([1, 2])
        codebook_loss = F.mse_loss(z_q, z_e.detach(), reduction="none").mean([1, 2])

        z_q = (
            z_e + (z_q - z_e).detach()
        )  # noop in forward pass, straight-through gradient estimator in backward pass

        z_q = self.out_proj(z_q)

        return z_q, commitment_loss, codebook_loss, indices, z_e

    def embed_code(self, embed_id):
        return F.embedding(embed_id, self.codebook.weight)

    def decode_code(self, embed_id):
        return self.embed_code(embed_id).transpose(1, 2)

    def decode_latents(self, latents):
        encodings = rearrange(latents, "b d t -> (b t) d")
        codebook = self.codebook.weight  # codebook: (N x D)

        # L2 normalize encodings and codebook (ViT-VQGAN)
        encodings = F.normalize(encodings)
        codebook = F.normalize(codebook)

        # Compute euclidean distance with codebook
        dist = (
            encodings.pow(2).sum(1, keepdim=True)
            - 2 * encodings @ codebook.t()
            + codebook.pow(2).sum(1, keepdim=True).t()
        )
        indices = rearrange((-dist).max(1)[1], "(b t) -> b t", b=latents.size(0))
        z_q = self.decode_code(indices)
        return z_q, indices


@dataclass
class VQResult:
    z: torch.Tensor
    codes: torch.Tensor
    latents: torch.Tensor
    commitment_loss: torch.Tensor
    codebook_loss: torch.Tensor


class ResidualVectorQuantize(nn.Module):
    """
    Introduced in SoundStream: An end2end neural audio codec
    https://arxiv.org/abs/2107.03312
    """

    def __init__(
        self,
        input_dim: int = 512,
        n_codebooks: int = 9,
        codebook_size: int = 1024,
        codebook_dim: Union[int, list] = 8,
        quantizer_dropout: float = 0.0,
        min_quantizers: int = 4,
    ):
        super().__init__()
        if isinstance(codebook_dim, int):
            codebook_dim = [codebook_dim for _ in range(n_codebooks)]

        self.n_codebooks = n_codebooks
        self.codebook_dim = codebook_dim
        self.codebook_size = codebook_size

        self.quantizers = nn.ModuleList(
            [
                VectorQuantize(input_dim, codebook_size, codebook_dim[i])
                for i in range(n_codebooks)
            ]
        )
        self.quantizer_dropout = quantizer_dropout
        self.min_quantizers = min_quantizers

    def forward(self, z, n_quantizers: int = None) -> VQResult:
        """Quantized the input tensor using a fixed set of `n` codebooks and returns
        the corresponding codebook vectors
        Parameters
        ----------
        z : Tensor[B x D x T]
        n_quantizers : int, optional
            No. of quantizers to use
            (n_quantizers < self.n_codebooks ex: for quantizer dropout)
            Note: if `self.quantizer_dropout` is True, this argument is ignored
                when in training mode, and a random number of quantizers is used.
        Returns
        -------
        """
        z_q = 0
        residual = z
        commitment_loss = 0
        codebook_loss = 0

        codebook_indices = []
        latents = []

        if n_quantizers is None:
            n_quantizers = self.n_codebooks

        if self.training:
            n_quantizers = torch.ones((z.shape[0],)) * self.n_codebooks + 1
            dropout = torch.randint(
                self.min_quantizers, self.n_codebooks + 1, (z.shape[0],)
            )
            n_dropout = int(z.shape[0] * self.quantizer_dropout)
            n_quantizers[:n_dropout] = dropout[:n_dropout]
            n_quantizers = n_quantizers.to(z.device)

        for i, quantizer in enumerate(self.quantizers):
            if self.training is False and i >= n_quantizers:
                break

            z_q_i, commitment_loss_i, codebook_loss_i, indices_i, z_e_i = quantizer(
                residual
            )

            # Create mask to apply quantizer dropout
            mask = (
                torch.full((z.shape[0],), fill_value=i, device=z.device) < n_quantizers
            )
            z_q = z_q + z_q_i * mask[:, None, None]
            residual = residual - z_q_i

            # Sum losses
            commitment_loss += (commitment_loss_i * mask).mean()
            codebook_loss += (codebook_loss_i * mask).mean()

            codebook_indices.append(indices_i)
            latents.append(z_e_i)

        codes = torch.stack(codebook_indices, dim=1)
        latents = torch.cat(latents, dim=1)

        return VQResult(z_q, codes, latents, commitment_loss, codebook_loss)

    def from_codes(self, codes: torch.Tensor):
        """Given the quantized codes, reconstruct the continuous representation
        Parameters
        ----------
        codes : Tensor[B x N x T]
            Quantized discrete representation of input
        Returns
        -------
        Tensor[B x D x T]
            Quantized continuous representation of input
        """
        z_q = 0.0
        z_p = []
        n_codebooks = codes.shape[1]
        for i in range(n_codebooks):
            z_p_i = self.quantizers[i].decode_code(codes[:, i, :])
            z_p.append(z_p_i)

            z_q_i = self.quantizers[i].out_proj(z_p_i)
            z_q = z_q + z_q_i
        return z_q, torch.cat(z_p, dim=1), codes

    def from_latents(self, latents: torch.Tensor):
        """Given the unquantized latents, reconstruct the
        continuous representation after quantization.

        Parameters
        ----------
        latents : Tensor[B x N x T]
            Continuous representation of input after projection

        Returns
        -------
        Tensor[B x D x T]
            Quantized representation of full-projected space
        Tensor[B x D x T]
            Quantized representation of latent space
        """
        z_q = 0
        z_p = []
        codes = []
        dims = np.cumsum([0] + [q.codebook_dim for q in self.quantizers])

        n_codebooks = np.where(dims <= latents.shape[1])[0].max(axis=0, keepdims=True)[
            0
        ]
        for i in range(n_codebooks):
            j, k = dims[i], dims[i + 1]
            z_p_i, codes_i = self.quantizers[i].decode_latents(latents[:, j:k, :])
            z_p.append(z_p_i)
            codes.append(codes_i)

            z_q_i = self.quantizers[i].out_proj(z_p_i)
            z_q = z_q + z_q_i

        return z_q, torch.cat(z_p, dim=1), torch.stack(codes, dim=1)


class DownsampleResidualVectorQuantize(ResidualVectorQuantize):
    """
    Downsampled version of ResidualVectorQuantize
    """

    def __init__(
        self,
        input_dim: int = 512,
        n_codebooks: int = 9,
        codebook_size: int = 1024,
        codebook_dim: Union[int, list] = 8,
        quantizer_dropout: float = 0.0,
        min_quantizers: int = 4,
        downsample_factor: tuple[int] = (2, 2),
        downsample_dims: tuple[int] | None = None,
    ):
        if downsample_dims is None:
            downsample_dims = [input_dim for _ in range(len(downsample_factor))]

        all_dims = (input_dim,) + tuple(downsample_dims)

        super().__init__(
            all_dims[-1],
            n_codebooks,
            codebook_size,
            codebook_dim,
            quantizer_dropout,
            min_quantizers,
        )

        self.downsample_factor = downsample_factor
        self.downsample_dims = downsample_dims

        self.downsample = nn.Sequential(
            *[
                nn.Conv1d(
                    all_dims[idx],
                    all_dims[idx + 1],
                    kernel_size=factor,
                    stride=factor,
                )
                for idx, factor in enumerate(downsample_factor)
            ]
        )

        self.upsample = nn.Sequential(
            *[
                nn.ConvTranspose1d(
                    all_dims[idx + 1],
                    all_dims[idx],
                    kernel_size=factor,
                    stride=factor,
                )
                for idx, factor in reversed(list(enumerate(downsample_factor)))
            ]
        )

    def forward(self, z, n_quantizers: int = None) -> VQResult:
        original_shape = z.shape
        z = self.downsample(z)
        result = super().forward(z, n_quantizers)
        result.z = self.upsample(result.z)

        # Pad or crop z to match original shape
        diff = original_shape[-1] - result.z.shape[-1]
        left = diff // 2
        right = diff - left

        if diff > 0:
            result.z = F.pad(result.z, (left, right))
        elif diff < 0:
            result.z = result.z[..., left:-right]

        return result

    def from_codes(self, codes: torch.Tensor):
        z_q, z_p, codes = super().from_codes(codes)
        z_q = self.upsample(z_q)
        return z_q, z_p, codes

    def from_latents(self, latents: torch.Tensor):
        z_q, z_p, codes = super().from_latents(latents)
        z_q = self.upsample(z_q)
        return z_q, z_p, codes


class FireflyVQ(nn.Module):
    def __init__(self):
        super().__init__()

        self.vq = DownsampleResidualVectorQuantize(
            input_dim=512,
            n_codebooks=8,
            codebook_size=256,
        )

        self.head = HiFiGANGenerator(
            hop_length=512,
            upsample_rates=[8, 8, 2, 2, 2],
            upsample_kernel_sizes=[16, 16, 4, 4, 4],
            resblock_kernel_sizes=[3, 7, 11],
            resblock_dilation_sizes=[[1, 3, 5], [1, 3, 5], [1, 3, 5]],
            num_mels=512,
            upsample_initial_channel=512,
            use_template=True,
            pre_conv_kernel_size=13,
            post_conv_kernel_size=13,
        )

    def forward(self, codes: torch.Tensor) -> torch.Tensor:
        x = self.vq.from_codes(codes)[0]
        x = self.head(x)

        if x.ndim == 2:
            x = x[:, None, :]

        return x


if __name__ == "__main__":
    model = FireflyVQ()
    model.load_state_dict(torch.load("checkpoints/firefly-vq-8x256-base.pth"), strict=True)
    model.eval()
    model.cuda()

    feature = np.load("test/4e7dbe3ef49ad53d.npy")
    print(feature, feature.shape)
    feature = torch.from_numpy(feature).cuda()[None]
    feature = model(feature)
    audio = feature[0, 0].detach().cpu().numpy()
    audio = audio / np.max(np.abs(audio))
    sf.write("test.wav", audio, 44100)

    print("Done")
