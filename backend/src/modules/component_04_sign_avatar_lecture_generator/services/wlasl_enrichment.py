"""WLASL BiLSTM model enrichment helpers for Sub-System 1 (Primary Sign Avatar).

When a keyword in the avatar animation sequence matches one of the trained model's
known classes, the avatar item is enriched with metadata indicating it has real WLASL
landmark data available. The frontend fetches those frames via
GET /api/signs/landmark-sequence/{keyword} (already implemented).

The model itself is NOT called for inference here — Sub-System 1 is text-driven,
not video-driven. This module only uses the model's label map and metrics to:
  1. Flag which keywords have real WLASL training coverage
  2. Attach confidence metadata (val_accuracy from training) to each matched item
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

LOGGER = logging.getLogger(__name__)

_MODULE_DIR = Path(__file__).resolve().parents[1]
_LABEL_MAP_PATH = _MODULE_DIR / "datasets" / "WLASL" / "models" / "label_map.json"
_MODEL_INFO_PATH = _MODULE_DIR / "datasets" / "WLASL" / "models" / "model_info.json"
_METRICS_PATH = _MODULE_DIR / "datasets" / "WLASL" / "models" / "metrics.json"

# ---------------------------------------------------------------------------
# Internal cache — label map is tiny, no need to read disk on every request
# ---------------------------------------------------------------------------
_KNOWN_CLASSES_CACHE: set[str] | None = None
_MODEL_META_CACHE: dict[str, Any] | None = None


def _load_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        LOGGER.debug("wlasl_enrichment: could not read %s — %s", path, exc)
        return {}


def get_wlasl_known_classes() -> set[str]:
    """Return lowercase set of sign labels the trained WLASL LSTM model knows.

    Returns an empty set when the model has not been trained yet (model files absent).
    """
    global _KNOWN_CLASSES_CACHE  # noqa: PLW0603
    if _KNOWN_CLASSES_CACHE is not None:
        return _KNOWN_CLASSES_CACHE

    if not _LABEL_MAP_PATH.exists():
        _KNOWN_CLASSES_CACHE = set()
        return _KNOWN_CLASSES_CACHE

    data = _load_json(_LABEL_MAP_PATH)
    labels: list[str] = data.get("labels", [])
    _KNOWN_CLASSES_CACHE = {label.strip().lower() for label in labels if label.strip()}
    LOGGER.info(
        "wlasl_enrichment: loaded %d known WLASL classes: %s",
        len(_KNOWN_CLASSES_CACHE),
        sorted(_KNOWN_CLASSES_CACHE),
    )
    return _KNOWN_CLASSES_CACHE


def get_wlasl_model_meta() -> dict[str, Any]:
    """Return training metadata for display in the UI.

    Returns a dict with keys: architecture, classCount, valAccuracy, trainAccuracy,
    sequenceLength, featureDimension, epochs, lastTrainedAt, modelReady.
    """
    global _MODEL_META_CACHE  # noqa: PLW0603
    if _MODEL_META_CACHE is not None:
        return _MODEL_META_CACHE

    model_info = _load_json(_MODEL_INFO_PATH)
    metrics = _load_json(_METRICS_PATH)
    model_ready = _LABEL_MAP_PATH.exists() and _MODEL_INFO_PATH.exists()

    _MODEL_META_CACHE = {
        "modelReady": model_ready,
        "architecture": model_info.get("architecture", "BiLSTM"),
        "classCount": model_info.get("classCount", 0),
        "valAccuracy": metrics.get("val_accuracy", model_info.get("valAccuracy", 0.0)),
        "trainAccuracy": metrics.get("train_accuracy", 0.0),
        "sequenceLength": model_info.get("sequenceLength", 60),
        "featureDimension": model_info.get("featureDimension", 279),
        "epochs": metrics.get("epochs", 0),
        "lastTrainedAt": model_info.get("lastTrainedAt"),
        "normalisation": model_info.get("normalisation", "wrist_relative"),
    }
    return _MODEL_META_CACHE


def enrich_sequence_with_wlasl(
    sequence: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Tag each avatar animation sequence item that has WLASL model coverage.

    For each item whose ``keyword`` appears in the trained model's label set,
    the following fields are added:
      - ``wlaslModelClass`` (bool): True → this keyword is in the trained model.
      - ``wlaslValAccuracy`` (float): model's val_accuracy from training metrics.
      - ``wlaslArchitecture`` (str): e.g. "BiLSTM".
      - ``wlaslLandmarkEndpoint`` (str): frontend API path to fetch real frames.

    Items NOT in the model are returned unchanged.
    """
    known_classes = get_wlasl_known_classes()
    if not known_classes:
        # Model not trained yet — return sequence unmodified
        return sequence

    meta = get_wlasl_model_meta()
    val_acc = meta.get("valAccuracy", 0.0)
    architecture = meta.get("architecture", "BiLSTM")

    enriched = []
    for item in sequence:
        keyword_lower = str(item.get("keyword", "")).strip().lower()
        if keyword_lower in known_classes:
            enriched.append(
                {
                    **item,
                    "wlaslModelClass": True,
                    "wlaslValAccuracy": round(float(val_acc), 4),
                    "wlaslArchitecture": architecture,
                    "wlaslLandmarkEndpoint": f"/api/signs/landmark-sequence/{keyword_lower}",
                }
            )
        else:
            enriched.append({**item, "wlaslModelClass": False})

    return enriched


def invalidate_cache() -> None:
    """Force a fresh read on the next call (call after retraining)."""
    global _KNOWN_CLASSES_CACHE, _MODEL_META_CACHE  # noqa: PLW0603
    _KNOWN_CLASSES_CACHE = None
    _MODEL_META_CACHE = None
