"""Run WLASL model prediction from a landmark JSON or a prepared sequence file."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

from src.modules.component_04_sign_avatar_lecture_generator.services.wlasl_pipeline_service import (
    predict_from_landmarks,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Predict a sign from WLASL landmarks.")
    parser.add_argument("--landmark-path", type=str, default=None)
    parser.add_argument("--sequence-path", type=str, default=None)
    parser.add_argument("--top-k", type=int, default=3)
    args = parser.parse_args()

    sequence = None
    if args.sequence_path:
        sequence = np.load(Path(args.sequence_path)).tolist()

    result = predict_from_landmarks(
        landmark_path=args.landmark_path,
        sequence=sequence,
        top_k=args.top_k,
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
