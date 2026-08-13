"""Train an LSTM model on processed WLASL landmark sequences."""
from __future__ import annotations

import argparse
import json

from src.modules.component_04_sign_avatar_lecture_generator.services.wlasl_pipeline_service import (
    train_lstm_model,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the WLASL LSTM model.")
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--sequence-length", type=int, default=48)
    parser.add_argument("--validation-split", type=float, default=0.2)
    parser.add_argument("--force-retrain", action="store_true")
    args = parser.parse_args()

    result = train_lstm_model(
        epochs=args.epochs,
        batch_size=args.batch_size,
        sequence_length=args.sequence_length,
        validation_split=args.validation_split,
        force_retrain=args.force_retrain,
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
