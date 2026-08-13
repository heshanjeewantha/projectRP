"""Training and prediction helpers for the Sign MNIST archive dataset."""
from __future__ import annotations

import asyncio
import csv
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np

from src.modules.component_04_sign_avatar_lecture_generator.utils.sign_mnist_paths import (
    ARCHIVE_DATASET_DIR,
    CONFUSION_MATRIX_PATH,
    LABEL_MAP_PATH,
    LOGS_DIR,
    METRICS_PATH,
    MODEL_INFO_PATH,
    MODEL_PATH,
    MODELS_DIR,
    STATUS_JSON_PATH,
    TEST_CSV_PATH,
    TRAIN_CSV_PATH,
    TRAIN_LOG_PATH,
    ensure_sign_mnist_structure,
    load_json_file,
    read_status,
    save_json_file,
    utc_now_iso,
    write_status,
)

try:
    import joblib
    import pandas as pd
    from sklearn.metrics import accuracy_score, confusion_matrix
    from sklearn.neural_network import MLPClassifier
except Exception:  # pragma: no cover - optional runtime import
    joblib = None
    pd = None
    accuracy_score = None
    confusion_matrix = None
    MLPClassifier = None


MODULE_DIR = Path(__file__).resolve().parents[1]
SCRIPT_DIR = MODULE_DIR / "datasets"
BACKEND_DIR = Path(__file__).resolve().parents[4]
PYTHON_EXECUTABLE = BACKEND_DIR / "venv" / "Scripts" / "python.exe"
UNSUPPORTED_MOTION_LETTERS = ["J", "Z"]
SIGN_MNIST_LABEL_TO_LETTER = {
    0: "A",
    1: "B",
    2: "C",
    3: "D",
    4: "E",
    5: "F",
    6: "G",
    7: "H",
    8: "I",
    10: "K",
    11: "L",
    12: "M",
    13: "N",
    14: "O",
    15: "P",
    16: "Q",
    17: "R",
    18: "S",
    19: "T",
    20: "U",
    21: "V",
    22: "W",
    23: "X",
    24: "Y",
}


def _get_python_executable() -> str:
    return str(PYTHON_EXECUTABLE if PYTHON_EXECUTABLE.exists() else Path(sys.executable))


def _count_samples_and_labels(csv_path: Path) -> tuple[int, list[int]]:
    if not csv_path.exists():
        return 0, []

    count = 0
    labels: set[int] = set()
    with csv_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            count += 1
            label = row.get("label")
            if label is not None and label != "":
                labels.add(int(label))
    return count, sorted(labels)


def _labels_to_letters(labels: list[int]) -> list[str]:
    return [SIGN_MNIST_LABEL_TO_LETTER[label] for label in labels if label in SIGN_MNIST_LABEL_TO_LETTER]


def _load_dataset_frame(csv_path: Path):
    if pd is None:
        raise RuntimeError("pandas and scikit-learn are required for Sign MNIST training.")
    if not csv_path.exists():
        raise FileNotFoundError(f"Dataset file not found: {csv_path}")
    return pd.read_csv(csv_path)


def _prepare_features(frame):
    labels = frame["label"].astype(int).to_numpy()
    pixels = frame.drop(columns=["label"]).astype("float32").to_numpy() / 255.0
    return pixels, labels


def _save_confusion_matrix(matrix: np.ndarray, labels: list[int]) -> None:
    header = ["label"] + [SIGN_MNIST_LABEL_TO_LETTER.get(label, str(label)) for label in labels]
    with CONFUSION_MATRIX_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(header)
        for index, label in enumerate(labels):
            writer.writerow([SIGN_MNIST_LABEL_TO_LETTER.get(label, str(label))] + matrix[index].tolist())


def _build_avatar_payload(letter: str) -> dict[str, Any]:
    normalized = (letter or "UNKNOWN").upper()
    return {
        "predicted_sign": normalized,
        "animation_sequence": [normalized],
        "avatar_motion_data": {
            "source": "sign-mnist-classifier",
            "mode": "fingerspelling",
            "clipName": f"fingerspell_{normalized.lower()}",
            "notes": "Sign MNIST predicts one static alphabet handshape, so the avatar should render this as a single-letter fingerspelling pose.",
        },
    }


def train_sign_mnist_model(
    epochs: int = 20,
    batch_size: int = 128,
    hidden_layer_sizes: list[int] | tuple[int, ...] = (256, 128),
    learning_rate: float = 0.001,
    force_retrain: bool = False,
) -> dict[str, Any]:
    ensure_sign_mnist_structure()
    if joblib is None or MLPClassifier is None or accuracy_score is None or confusion_matrix is None:
        raise RuntimeError("pandas, joblib, and scikit-learn are required for Sign MNIST training.")
    if MODEL_PATH.exists() and not force_retrain:
        existing = load_json_file(METRICS_PATH, {})
        return {
            "status": "skipped",
            "message": "A Sign MNIST model already exists. Use forceRetrain=true to train again.",
            "metrics": existing,
        }

    write_status(
        "train_sign_mnist_model",
        "running",
        {
            "epochs": epochs,
            "batchSize": batch_size,
            "hiddenLayerSizes": list(hidden_layer_sizes),
            "learningRate": learning_rate,
        },
    )

    train_frame = _load_dataset_frame(TRAIN_CSV_PATH)
    test_frame = _load_dataset_frame(TEST_CSV_PATH)
    X_train, y_train = _prepare_features(train_frame)
    X_test, y_test = _prepare_features(test_frame)

    model = MLPClassifier(
        hidden_layer_sizes=tuple(hidden_layer_sizes),
        activation="relu",
        solver="adam",
        learning_rate_init=learning_rate,
        batch_size=batch_size,
        max_iter=epochs,
        early_stopping=True,
        n_iter_no_change=10,
        random_state=42,
        verbose=False,
    )
    model.fit(X_train, y_train)

    train_predictions = model.predict(X_train)
    test_predictions = model.predict(X_test)
    ordered_labels = sorted(int(label) for label in model.classes_)
    matrix = confusion_matrix(y_test, test_predictions, labels=ordered_labels)

    joblib.dump(model, MODEL_PATH)
    save_json_file(LABEL_MAP_PATH, {str(label): SIGN_MNIST_LABEL_TO_LETTER.get(int(label), str(label)) for label in ordered_labels})
    _save_confusion_matrix(matrix, ordered_labels)

    metrics_payload = {
        "trainAccuracy": float(accuracy_score(y_train, train_predictions)),
        "testAccuracy": float(accuracy_score(y_test, test_predictions)),
        "trainSampleCount": int(len(y_train)),
        "testSampleCount": int(len(y_test)),
        "classCount": int(len(ordered_labels)),
        "supportedLetters": _labels_to_letters(ordered_labels),
        "unsupportedLetters": UNSUPPORTED_MOTION_LETTERS,
        "epochs": int(getattr(model, "n_iter_", epochs)),
        "batchSize": batch_size,
        "hiddenLayerSizes": list(hidden_layer_sizes),
        "learningRate": learning_rate,
        "lastTrainedAt": utc_now_iso(),
    }
    save_json_file(METRICS_PATH, metrics_payload)
    save_json_file(
        MODEL_INFO_PATH,
        {
            "modelPath": str(MODEL_PATH),
            "labelMapPath": str(LABEL_MAP_PATH),
            "metricsPath": str(METRICS_PATH),
            "confusionMatrixPath": str(CONFUSION_MATRIX_PATH),
            "classCount": len(ordered_labels),
            "inputSize": 784,
            "supportedLetters": _labels_to_letters(ordered_labels),
            "unsupportedLetters": UNSUPPORTED_MOTION_LETTERS,
            "lastTrainedAt": metrics_payload["lastTrainedAt"],
            "trainingStatus": "completed",
        },
    )
    write_status("train_sign_mnist_model", "completed", metrics_payload)
    return {
        "status": "completed",
        "message": "Sign MNIST model trained successfully.",
        "metrics": metrics_payload,
    }


def predict_sign_mnist(pixels: list[float], top_k: int = 3) -> dict[str, Any]:
    ensure_sign_mnist_structure()
    if joblib is None:
        raise RuntimeError("joblib and scikit-learn are required for Sign MNIST prediction.")
    if not MODEL_PATH.exists():
        raise FileNotFoundError("No trained Sign MNIST model was found. Train the model first.")
    if len(pixels) != 784:
        raise ValueError("Sign MNIST prediction expects exactly 784 pixel values.")

    model = joblib.load(MODEL_PATH)
    sample = np.asarray(pixels, dtype="float32").reshape(1, -1)
    if sample.max() > 1:
        sample = sample / 255.0

    probabilities = model.predict_proba(sample)[0]
    classes = [int(label) for label in model.classes_]
    top_indexes = np.argsort(probabilities)[::-1][:top_k]
    candidates = [
        {
            "sign": SIGN_MNIST_LABEL_TO_LETTER.get(classes[index], str(classes[index])),
            "confidence": float(probabilities[index]),
        }
        for index in top_indexes
    ]
    best = candidates[0]
    avatar_payload = _build_avatar_payload(best["sign"])
    return {
        "predictedSign": best["sign"],
        "confidence": best["confidence"],
        "candidates": candidates,
        "avatarMotionData": avatar_payload,
    }


def get_status_summary() -> dict[str, Any]:
    ensure_sign_mnist_structure()
    train_count, train_labels = _count_samples_and_labels(TRAIN_CSV_PATH)
    test_count, test_labels = _count_samples_and_labels(TEST_CSV_PATH)
    labels = sorted(set(train_labels) | set(test_labels))
    return {
        "datasetReady": TRAIN_CSV_PATH.exists() and TEST_CSV_PATH.exists(),
        "trainCsvReady": TRAIN_CSV_PATH.exists(),
        "testCsvReady": TEST_CSV_PATH.exists(),
        "trainSampleCount": train_count,
        "testSampleCount": test_count,
        "classCount": len(labels),
        "supportedLetters": _labels_to_letters(labels),
        "unsupportedLetters": UNSUPPORTED_MOTION_LETTERS,
        "modelReady": MODEL_PATH.exists(),
        "latestStatus": read_status(),
        "directories": {
            "archiveRoot": str(ARCHIVE_DATASET_DIR),
            "trainCsv": str(TRAIN_CSV_PATH),
            "testCsv": str(TEST_CSV_PATH),
            "models": str(MODELS_DIR),
            "logs": str(LOGS_DIR),
            "status": str(STATUS_JSON_PATH),
        },
    }


def get_model_info() -> dict[str, Any]:
    ensure_sign_mnist_structure()
    info = load_json_file(MODEL_INFO_PATH, {})
    return {
        "modelPath": str(MODEL_PATH) if MODEL_PATH.exists() else None,
        "labelMapPath": str(LABEL_MAP_PATH) if LABEL_MAP_PATH.exists() else None,
        "metricsPath": str(METRICS_PATH) if METRICS_PATH.exists() else None,
        "confusionMatrixPath": str(CONFUSION_MATRIX_PATH) if CONFUSION_MATRIX_PATH.exists() else None,
        "classCount": int(info.get("classCount", 0)),
        "inputSize": info.get("inputSize"),
        "supportedLetters": info.get("supportedLetters", []),
        "unsupportedLetters": info.get("unsupportedLetters", UNSUPPORTED_MOTION_LETTERS),
        "lastTrainedAt": info.get("lastTrainedAt"),
        "trainingStatus": info.get("trainingStatus") or read_status().get("status"),
    }


def launch_training_job(config: dict[str, Any]) -> dict[str, Any]:
    ensure_sign_mnist_structure()
    started_at = datetime.now(timezone.utc)
    command = [
        _get_python_executable(),
        str(SCRIPT_DIR / "train_sign_mnist_model.py"),
        "--epochs",
        str(config.get("epochs", 20)),
        "--batch-size",
        str(config.get("batchSize", 128)),
        "--learning-rate",
        str(config.get("learningRate", 0.001)),
        "--hidden-layer-sizes",
        ",".join(str(value) for value in config.get("hiddenLayerSizes", [256, 128])),
    ]
    if config.get("forceRetrain"):
        command.append("--force-retrain")

    log_handle = TRAIN_LOG_PATH.open("a", encoding="utf-8")
    subprocess.Popen(
        command,
        cwd=str(BACKEND_DIR),
        stdout=log_handle,
        stderr=log_handle,
        shell=False,
    )
    write_status(
        "train_sign_mnist_model",
        "queued",
        {
            "command": " ".join(command),
            "startedAt": started_at.isoformat(),
        },
    )
    return {
        "status": "queued",
        "message": "Sign MNIST training job started in the background.",
        "command": " ".join(command),
        "startedAt": started_at,
    }


async def get_status_summary_async() -> dict[str, Any]:
    return await asyncio.to_thread(get_status_summary)


async def get_model_info_async() -> dict[str, Any]:
    return await asyncio.to_thread(get_model_info)


async def predict_sign_mnist_async(payload: dict[str, Any]) -> dict[str, Any]:
    return await asyncio.to_thread(
        predict_sign_mnist,
        payload.get("pixels") or [],
        int(payload.get("topK", 3)),
    )


async def launch_training_job_async(config: dict[str, Any]) -> dict[str, Any]:
    return await asyncio.to_thread(launch_training_job, config)
