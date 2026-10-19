"""Unit tests for Module 2: the lightweight CNN."""

import os
import sys

import torch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from data_pipeline.config import EPOCH_SAMPLES
from model_training.model import SleepCNN, count_macs, count_parameters


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------
def test_model_output_shape_and_is_lightweight():
    model = SleepCNN(n_classes=5).eval()
    with torch.no_grad():
        out = model(torch.randn(3, 1, EPOCH_SAMPLES))
    assert out.shape == (3, 5)
    assert count_parameters(model) < 200_000
    assert count_macs(model) < 10_000_000


