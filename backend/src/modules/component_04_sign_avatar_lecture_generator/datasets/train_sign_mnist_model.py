"""Train an MLP classifier on the Sign MNIST archive dataset."""
from __future__ import annotations

import argparse

from src.modules.component_04_sign_avatar_lecture_generator.services.sign_mnist_service import (
    train_sign_mnist_model,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the Sign MNIST alphabet model.")
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch-size", type=int, default=128)
    parser.add_argument("--learning-rate", type=float, default=0.001)
    parser.add_argument("--hidden-layer-sizes", default="256,128")
    parser.add_argument("--force-retrain", action="store_true")
    args = parser.parse_args()

    hidden_layer_sizes = tuple(
        int(value.strip())
        for value in args.hidden_layer_sizes.split(",")
        if value.strip()
    )
    result = train_sign_mnist_model(
        epochs=args.epochs,
        batch_size=args.batch_size,
        hidden_layer_sizes=hidden_layer_sizes,
        learning_rate=args.learning_rate,
        force_retrain=args.force_retrain,
    )
    print(result)


if __name__ == "__main__":
    main()
