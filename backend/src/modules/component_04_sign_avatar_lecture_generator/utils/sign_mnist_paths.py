"""Shared paths and status helpers for the Sign MNIST pipeline."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


MODULE_DIR = Path(__file__).resolve().parents[1]
ARCHIVE_DATASET_DIR = MODULE_DIR / "datasets" / "archive"
TRAIN_CSV_PATH = ARCHIVE_DATASET_DIR / "sign_mnist_train.csv"
TEST_CSV_PATH = ARCHIVE_DATASET_DIR / "sign_mnist_test.csv"
MODELS_DIR = ARCHIVE_DATASET_DIR / "models"
LOGS_DIR = ARCHIVE_DATASET_DIR / "logs"
MODEL_PATH = MODELS_DIR / "sign_mnist_mlp.joblib"
LABEL_MAP_PATH = MODELS_DIR / "label_map.json"
METRICS_PATH = MODELS_DIR / "metrics.json"
CONFUSION_MATRIX_PATH = MODELS_DIR / "confusion_matrix.csv"
MODEL_INFO_PATH = MODELS_DIR / "model_info.json"
STATUS_JSON_PATH = LOGS_DIR / "pipeline_status.json"
TRAIN_LOG_PATH = LOGS_DIR / "training.log"

DATASET_DIRS = [
    ARCHIVE_DATASET_DIR,
    MODELS_DIR,
    LOGS_DIR,
]


def ensure_sign_mnist_structure() -> None:
    """Create every required Sign MNIST folder if missing."""
    for directory in DATASET_DIRS:
        directory.mkdir(parents=True, exist_ok=True)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_json_file(path: Path, default: Any = None) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def save_json_file(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def write_status(stage: str, status: str, details: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = {
        "stage": stage,
        "status": status,
        "updatedAt": utc_now_iso(),
        "details": details or {},
    }
    save_json_file(STATUS_JSON_PATH, payload)
    return payload


def read_status() -> dict[str, Any]:
    ensure_sign_mnist_structure()
    return load_json_file(
        STATUS_JSON_PATH,
        {
            "stage": "idle",
            "status": "not_started",
            "updatedAt": None,
            "details": {},
        },
    )


ensure_sign_mnist_structure()
