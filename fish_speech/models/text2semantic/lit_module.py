from dataclasses import dataclass
from typing import Any, Optional

import lightning as L
import loralib as lora
import torch
import torch.nn.functional as F
from lightning.pytorch.utilities.types import OptimizerLRScheduler

import fish_speech.utils as utils
import torch.nn as nn
import math
from fish_speech.models.text2semantic.llama import NaiveTransformer

log = utils.RankedLogger(__name__, rank_zero_only=True)

@dataclass
class LoraConfig:
    r: int
    lora_alpha: float
    lora_dropout: float = 0.0


class TextToSemantic(L.LightningModule):
    def __init__(
        self,
        model: NaiveTransformer,
        optimizer: Any,
        lr_scheduler: Any,
        lora_config: Optional[LoraConfig] = None,
        save_lora_only: bool = False,
        use_dpo: bool = False,
        dpo_beta: float = 0.2,
    ):
        super().__init__()

        self.model = model
        self.optimizer_builder = optimizer
        self.lr_scheduler_builder = lr_scheduler
        self.lora_config = lora_config
        self.save_lora_only = save_lora_only
        self.use_dpo = use_dpo  # We don't support reference model yet
        self.dpo_beta = dpo_beta
        
        if self.lora_config is not None:
            self.setup_lora()

    def setup_lora(self):
        # Replace the embedding layer with a LoRA layer
        self.model.tok_embeddings = lora.Embedding(
            num_embeddings=self.model.tok_embeddings.num_embeddings,
            embedding_dim=self.model.tok_embeddings.embedding_dim,
            padding_idx=self.model.tok_embeddings.padding_idx,
            r=self.lora_config.r,
            lora_alpha=self.lora_config.lora_alpha,
        )

        # Replace output layer with a LoRA layer
        linears = [(self.model, "output")]

        # Replace all linear layers with LoRA layers
        for layer in self.model.layers:
            linears.extend([(layer.attention, "wqkv"), (layer.attention, "wo")])
            linears.extend(
                [
                    (layer.feed_forward, "w1"),
                    (layer.feed_forward, "w2"),
                    (layer.feed_forward, "w3"),
                ]
            )

        for module, layer in linears:
            updated_linear = lora.Linear(
                in_features=getattr(module, layer).in_features,
                out_features=getattr(module, layer).out_features,
                bias=getattr(module, layer).bias,
                r=self.lora_config.r,
                lora_alpha=self.lora_config.lora_alpha,
                lora_dropout=self.lora_config.lora_dropout,
            )
            setattr(module, layer, updated_linear)

        # Mark only the LoRA layers as trainable
        lora.mark_only_lora_as_trainable(self.model, bias="lora_only")
        for n, p in self.model.added_embeddings.named_parameters():
            p.requires_grad = True
        for n, p in self.model.added_output.named_parameters():
            p.requires_grad = True
        self.alpha_scheduler = 0
        self.lora_steps = 0
   
    def count_lora_linears(self):
        if not getattr(self, 'lora_linears', None):
            linears = [(self.model, "output")]
            for layer in self.model.layers:
                linears.extend([(layer.attention, "wqkv"), (layer.attention, "wo")])
                linears.extend(
                    [
                        (layer.feed_forward, "w1"),
                        (layer.feed_forward, "w2"),
                        (layer.feed_forward, "w3"),
                    ]
                )
            lora_linears = []
            for module, layer in linears:
                linear_layer = getattr(module, layer)
                if isinstance(linear_layer, lora.Linear):
                    lora_linears.append(linear_layer)
            self.lora_linears = lora_linears

    def merge_and_reset_lora(self):
        if isinstance(self.model.tok_embeddings, lora.Embedding):
            with torch.no_grad():
                self.model.tok_embeddings.weight.data += (self.model.tok_embeddings.lora_B @ self.model.tok_embeddings.lora_A).transpose(0, 1) * self.model.tok_embeddings.scaling
            nn.init.zeros_(self.model.tok_embeddings.lora_A)
            nn.init.normal_(self.model.tok_embeddings.lora_B)

        if not getattr(self, 'lora_linears', None):
            self.count_lora_linears()

        for linear_layer in self.lora_linears:
            def T(w):
                return w.transpose(0, 1) if linear_layer.fan_in_fan_out else w
            with torch.no_grad():
                linear_layer.weight.data += T(linear_layer.lora_B @ linear_layer.lora_A) * linear_layer.scaling
            nn.init.kaiming_uniform_(linear_layer.lora_A, a=math.sqrt(5))
            nn.init.zeros_(linear_layer.lora_B)

    def set_lora_alpha(self, alpha):
        if isinstance(self.model.tok_embeddings, lora.Embedding):
            self.model.tok_embeddings.lora_alpha = alpha
            self.model.tok_embeddings.scaling = self.model.tok_embeddings.lora_alpha / self.model.tok_embeddings.r
        
        if not getattr(self, 'lora_linears', None):
            self.count_lora_linears()

        for linear_layer in self.lora_linears:
            linear_layer.lora_alpha = alpha
            linear_layer.scaling = linear_layer.lora_alpha / linear_layer.r
    
    def forward(self, x):
        return self.model(x)

    def on_save_checkpoint(self, checkpoint):
        if self.lora_config is None or self.save_lora_only is False:
            return

        # Save only LoRA parameters
        state_dict = checkpoint["state_dict"]
        for name in list(state_dict.keys()):
            if "lora" not in name:
                state_dict.pop(name)

    def configure_optimizers(self) -> OptimizerLRScheduler:
        # Get weight decay parameters
        weight_decay_parameters, other_parameters = [], []
        for name, param in self.named_parameters():
            if ".bias" in name or "norm.weight" in name or "embeddings" in name:
                other_parameters.append(param)
            else:
                weight_decay_parameters.append(param)

        optimizer = self.optimizer_builder(
            [
                {"params": weight_decay_parameters},
                {"params": other_parameters, "weight_decay": 0.0},
            ]
        )

        # Print the parameters and their weight decay
        for i in optimizer.param_groups:
            log.info(
                f"Set weight decay: {i['weight_decay']} for {len(i['params'])} parameters"
            )

        lr_scheduler = self.lr_scheduler_builder(optimizer)

        return {
            "optimizer": optimizer,
            "lr_scheduler": {
                "scheduler": lr_scheduler,
                "interval": "step",
            },
        }

    # Copied from https://github.com/eric-mitchell/direct-preference-optimization/blob/main/trainers.py#L90
    def get_batch_logps(
        self,
        logits: torch.FloatTensor,
        labels: torch.LongTensor,
        average_log_prob: bool = False,
    ) -> torch.FloatTensor:
        """Compute the log probabilities of the given labels under the given logits.

        Args:
            logits: Logits of the model (unnormalized). Shape: (batch_size, sequence_length, codebook_size, vocab_size)
            labels: Labels for which to compute the log probabilities. Label tokens with a value of -100 are ignored. Shape: (batch_size, sequence_length, codebook_size)
            average_log_prob: If True, return the average log probability per (non-masked) token. Otherwise, return the sum of the log probabilities of the (non-masked) tokens.

        Returns:
            A tensor of shape (batch_size,) containing the average/sum log probabilities of the given labels under the given logits.
        """
        assert logits.shape[:-1] == labels.shape

        labels = labels.clone()
        loss_mask = labels != -100

        # dummy token; we'll ignore the losses on these tokens later
        labels[labels == -100] = 0

        per_token_logps = torch.gather(
            logits.log_softmax(-1), dim=-1, index=labels.unsqueeze(-1)
        ).squeeze(-1)

        if average_log_prob:
            return (per_token_logps * loss_mask).sum(-1) / loss_mask.sum(-1)
        else:
            return (per_token_logps * loss_mask).sum(-1)

    def _step(self, batch, batch_idx, stage: str):
        # Do positive and negative samples in the same batch to speed up training
        labels = batch["labels"]
        outputs = self.model(
            inp=batch["inputs"],
            key_padding_mask=batch["attention_masks"],
        )
        token_logits = outputs.token_logits
        codebook_logits = outputs.codebook_logits

        if self.use_dpo:
            # Firtst half is positive, second half is negative
            token_logits, negative_token_logits = token_logits.chunk(2)
            codebook_logits, negative_codebook_logits = codebook_logits.chunk(2)
            labels, negative_labels = labels.chunk(2)

        # Generate labels
        base_loss = F.cross_entropy(
            token_logits.reshape(-1, token_logits.size(-1)),
            labels[:, 0].reshape(-1),
            ignore_index=-100,
        )

        codebook_labels = labels[:, 1 : 1 + self.model.config.num_codebooks].mT
        semantic_loss = F.cross_entropy(
            codebook_logits.reshape(-1, codebook_logits.size(-1)),
            codebook_labels.reshape(-1),
            ignore_index=-100,
        )

        loss = base_loss + semantic_loss

        # If we use dpo
        if self.use_dpo:
            negative_codebook_labels = negative_labels[
                :, 1 : 1 + self.model.config.num_codebooks
            ].mT

            positive_codebook_logps = self.get_batch_logps(
                codebook_logits, codebook_labels
            )
            negative_codebook_logps = self.get_batch_logps(
                negative_codebook_logits, negative_codebook_labels
            )

            # TODO: implement the reference model, avoid screwing up the gradients
            dpo_loss = -F.logsigmoid(
                (positive_codebook_logps - negative_codebook_logps) * self.dpo_beta
            ).mean()

            chosen_rewards = self.dpo_beta * positive_codebook_logps.detach()
            rejected_rewards = self.dpo_beta * negative_codebook_logps.detach()
            reward_accuracy = (chosen_rewards > rejected_rewards).float().mean()
            chosen_rewards, rejected_rewards = (
                chosen_rewards.mean(),
                rejected_rewards.mean(),
            )

            loss = loss + dpo_loss

            self.log(
                f"{stage}/dpo_loss",
                dpo_loss,
                on_step=True,
                on_epoch=False,
                prog_bar=False,
                logger=True,
            )

            self.log(
                f"{stage}/chosen_rewards",
                chosen_rewards,
                on_step=True,
                on_epoch=False,
                prog_bar=False,
                logger=True,
            )

            self.log(
                f"{stage}/rejected_rewards",
                rejected_rewards,
                on_step=True,
                on_epoch=False,
                prog_bar=False,
                logger=True,
            )

            self.log(
                f"{stage}/reward_accuracy",
                reward_accuracy,
                on_step=True,
                on_epoch=False,
                prog_bar=False,
                logger=True,
            )

        self.log(
            f"{stage}/loss",
            loss,
            on_step=True,
            on_epoch=False,
            prog_bar=True,
            logger=True,
        )

        self.log(
            f"{stage}/base_loss",
            base_loss,
            on_step=True,
            on_epoch=False,
            prog_bar=False,
            logger=True,
        )

        self.log(
            f"{stage}/semantic_loss",
            semantic_loss,
            on_step=True,
            on_epoch=False,
            prog_bar=False,
            logger=True,
        )

        # Top-5 accuracy
        accuracy = self.get_accuracy(codebook_logits, codebook_labels)
        self.log(
            f"{stage}/top_5_accuracy",
            accuracy,
            on_step=True,
            on_epoch=False,
            prog_bar=True,
            logger=True,
        )

        if self.model.config.num_codebooks != self.model.config.num_in_codebooks:
            accuracy = self.get_accuracy(
                codebook_logits[:, :, : self.model.config.num_in_codebooks],
                codebook_labels[:, :, : self.model.config.num_in_codebooks],
            )

            self.log(
                f"{stage}/top_5_accuracy_in",
                accuracy,
                on_step=True,
                on_epoch=False,
                prog_bar=True,
                logger=True,
            )

        return loss

    def get_accuracy(self, logits, labels):
        _, indices = logits.topk(5, dim=-1)
        correct = indices.eq(labels.unsqueeze(-1))
        correct[labels == -100] = 0
        correct = correct.sum()
        accuracy = correct / (labels != -100).sum()

        return accuracy

    def training_step(self, batch, batch_idx):
        if self.lora_config is not None:
            if self.alpha_scheduler < self.lora_config.lora_alpha:
                self.alpha_scheduler += 0.1
                self.set_lora_alpha(self.alpha_scheduler)
            elif self.alpha_scheduler != self.lora_config.lora_alpha:
                self.alpha_scheduler = self.lora_config.lora_alpha
                self.set_lora_alpha(self.alpha_scheduler)
            self.lora_steps += 1
            if self.lora_steps > 2500 and self.lora_steps % 1000 == 0:
                self.merge_and_reset_lora()
        return self._step(batch, batch_idx, "train")

    def validation_step(self, batch, batch_idx):
        return self._step(batch, batch_idx, "val")
