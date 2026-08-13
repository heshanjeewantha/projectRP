"""
Evaluate component 01 ML pieces from the backend terminal.

This currently provides:
- a synthetic benchmark for the rule-based sign classifier
- a clear status message when no labeled attention dataset exists
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from src.modules.component_01_attention_monitoring.ml.sign_classifier import (
    SIGN_LABELS,
    SignClassifier,
)

try:
    from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
except Exception:  # pragma: no cover - optional runtime import
    accuracy_score = None
    classification_report = None
    confusion_matrix = None


MODULE_DIR = Path(__file__).resolve().parents[1]
BENCHMARK_PATH = MODULE_DIR / "datasets" / "sign_classifier_benchmark.json"
REAL_ATTENTION_EVAL_DIR = MODULE_DIR / "datasets" / "attention_eval"

WRIST_INDEX = 0
THUMB_TIP_INDEX = 4
THUMB_PIP_INDEX = 3
INDEX_PIP_INDEX = 6
INDEX_TIP_INDEX = 8
MIDDLE_PIP_INDEX = 10
MIDDLE_TIP_INDEX = 12
RING_PIP_INDEX = 14
RING_TIP_INDEX = 16
PINKY_PIP_INDEX = 18
PINKY_TIP_INDEX = 20


def _set_finger(landmarks: np.ndarray, pip_index: int, tip_index: int, extended: bool, x_offset: float) -> None:
    pip_distance = 0.35 if extended else 0.65
    tip_distance = 0.95 if extended else 0.45
    landmarks[pip_index] = np.array([x_offset, -pip_distance, 0.0], dtype=np.float32)
    landmarks[tip_index] = np.array([x_offset, -tip_distance, 0.0], dtype=np.float32)


def _build_landmark_vector(case: dict) -> np.ndarray:
    landmarks = np.zeros((21, 3), dtype=np.float32)
    landmarks[WRIST_INDEX] = np.array([0.0, 0.0, 0.0], dtype=np.float32)

    thumb_angle = np.radians(float(case.get("thumbAngle", 45)))
    thumb_tip_radius = 1.0 if case.get("thumbExtended") else 0.35
    thumb_pip_radius = 0.45 if case.get("thumbExtended") else 0.55
    landmarks[THUMB_PIP_INDEX] = np.array(
        [
            np.cos(thumb_angle) * thumb_pip_radius,
            np.sin(thumb_angle) * thumb_pip_radius,
            0.0,
        ],
        dtype=np.float32,
    )
    landmarks[THUMB_TIP_INDEX] = np.array(
        [
            np.cos(thumb_angle) * thumb_tip_radius,
            np.sin(thumb_angle) * thumb_tip_radius,
            0.0,
        ],
        dtype=np.float32,
    )

    _set_finger(landmarks, INDEX_PIP_INDEX, INDEX_TIP_INDEX, bool(case.get("indexExtended")), 0.15)
    _set_finger(landmarks, MIDDLE_PIP_INDEX, MIDDLE_TIP_INDEX, bool(case.get("middleExtended")), 0.3)
    _set_finger(landmarks, RING_PIP_INDEX, RING_TIP_INDEX, bool(case.get("ringExtended")), 0.45)
    _set_finger(landmarks, PINKY_PIP_INDEX, PINKY_TIP_INDEX, bool(case.get("pinkyExtended")), 0.6)
    return landmarks.flatten()


def evaluate_sign_classifier() -> None:
    if not BENCHMARK_PATH.exists():
        print(f"Sign benchmark file not found: {BENCHMARK_PATH}")
        return

    payload = json.loads(BENCHMARK_PATH.read_text(encoding="utf-8"))
    cases = payload.get("cases", [])
    if not cases:
        print("Sign benchmark file exists but contains no cases.")
        return

    classifier = SignClassifier()
    y_true: list[str] = []
    y_pred: list[str] = []
    mismatches: list[tuple[str, str, str]] = []

    for case in cases:
        expected = case["label"]
        predicted = classifier.predict(_build_landmark_vector(case))["label"]
        y_true.append(expected)
        y_pred.append(predicted)
        if expected != predicted:
            mismatches.append((case.get("description", expected), expected, predicted))

    print("COMPONENT 01 SIGN CLASSIFIER BENCHMARK")
    print("Note: this is a synthetic logic benchmark, not real-world webcam accuracy.")
    print(f"Dataset file: {BENCHMARK_PATH}")
    print(f"Case count: {len(cases)}")

    if accuracy_score is not None:
        accuracy = accuracy_score(y_true, y_pred)
        print(f"Accuracy: {accuracy:.2%}")
    else:
        correct = sum(1 for expected, predicted in zip(y_true, y_pred) if expected == predicted)
        print(f"Accuracy: {correct / len(cases):.2%}")

    print("")
    print("Per-label support:")
    for label in SIGN_LABELS:
        support = sum(1 for item in y_true if item == label)
        if support:
            print(f"- {label}: {support}")

    if classification_report is not None:
        print("")
        print("Classification report:")
        print(classification_report(y_true, y_pred, labels=[label for label in SIGN_LABELS if label in y_true], zero_division=0))

    if confusion_matrix is not None:
        labels = [label for label in SIGN_LABELS if label in y_true]
        matrix = confusion_matrix(y_true, y_pred, labels=labels)
        print("Confusion matrix:")
        header = "expected\\pred".ljust(16) + " ".join(label[:10].ljust(10) for label in labels)
        print(header)
        for index, label in enumerate(labels):
            row = label[:15].ljust(16) + " ".join(str(value).ljust(10) for value in matrix[index].tolist())
            print(row)

    if mismatches:
        print("")
        print("Mismatches:")
        for description, expected, predicted in mismatches:
            print(f"- {description}: expected {expected}, predicted {predicted}")


def evaluate_attention_detector() -> None:
    print("")
    print("COMPONENT 01 ATTENTION DETECTOR STATUS")
    if REAL_ATTENTION_EVAL_DIR.exists():
        files = list(REAL_ATTENTION_EVAL_DIR.rglob("*"))
        print(f"Evaluation dataset directory found: {REAL_ATTENTION_EVAL_DIR}")
        print(f"File count: {len([path for path in files if path.is_file()])}")
        print("No automatic scorer is implemented yet for this real attention dataset.")
        return

    print("No labeled attention evaluation dataset was found.")
    print(f"Expected directory for future evaluation data: {REAL_ATTENTION_EVAL_DIR}")


def main() -> None:
    evaluate_sign_classifier()
    evaluate_attention_detector()


if __name__ == "__main__":
    main()
