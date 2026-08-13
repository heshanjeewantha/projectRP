"""Shared paths and status helpers for the WLASL dataset pipeline."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


MODULE_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = Path(__file__).resolve().parents[4]
DATASET_ROOT = MODULE_DIR / "datasets" / "WLASL"
RAW_VIDEOS_DIR = DATASET_ROOT / "raw_videos"
RAW_VIDEOS_MP4_DIR = DATASET_ROOT / "raw_videos_mp4"
VIDEOS_DIR = DATASET_ROOT / "videos"
PROCESSED_DIR = DATASET_ROOT / "processed"
LANDMARKS_DIR = PROCESSED_DIR / "landmarks"
LABELS_DIR = PROCESSED_DIR / "labels"
SEQUENCES_DIR = PROCESSED_DIR / "sequences"
MODELS_DIR = DATASET_ROOT / "models"
LOGS_DIR = DATASET_ROOT / "logs"
WLASL_REPO_DIR = DATASET_ROOT / "WLASL_repo"
WLASL_JSON_PATH = WLASL_REPO_DIR / "WLASL_v0.3.json"

SUCCESS_LOG_PATH = LOGS_DIR / "success.txt"
FAILED_LOG_PATH = LOGS_DIR / "failed.txt"
PREPROCESS_LOG_PATH = LOGS_DIR / "preprocess.log"
LANDMARK_LOG_PATH = LOGS_DIR / "landmark_extraction.log"
TRAIN_LOG_PATH = LOGS_DIR / "training.log"
STATUS_JSON_PATH = LOGS_DIR / "pipeline_status.json"
LABELS_CSV_PATH = LABELS_DIR / "labels.csv"
MODEL_PATH = MODELS_DIR / "wlasl_lstm.keras"
LABEL_MAP_PATH = MODELS_DIR / "label_map.json"
METRICS_PATH = MODELS_DIR / "metrics.json"
CONFUSION_MATRIX_PATH = MODELS_DIR / "confusion_matrix.csv"
MODEL_INFO_PATH = MODELS_DIR / "model_info.json"

DATASET_DIRS = [
    DATASET_ROOT,
    RAW_VIDEOS_DIR,
    RAW_VIDEOS_MP4_DIR,
    VIDEOS_DIR,
    PROCESSED_DIR,
    LANDMARKS_DIR,
    LABELS_DIR,
    SEQUENCES_DIR,
    MODELS_DIR,
    LOGS_DIR,
]


def ensure_wlasl_structure() -> None:
    """Create every required dataset folder if missing."""
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


def append_log_line(path: Path, message: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(f"{message}\n")


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
    ensure_wlasl_structure()
    return load_json_file(
        STATUS_JSON_PATH,
        {
            "stage": "idle",
            "status": "not_started",
            "updatedAt": None,
            "details": {},
        },
    )


ensure_wlasl_structure()
