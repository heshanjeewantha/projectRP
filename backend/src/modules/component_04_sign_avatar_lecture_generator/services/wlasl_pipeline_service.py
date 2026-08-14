"""Automation helpers for WLASL dataset setup, preprocessing, training, and prediction."""
from __future__ import annotations

import asyncio
import csv
import json
import os
import subprocess
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np

from src.modules.component_04_sign_avatar_lecture_generator.gloss.avatar_mapper import (
    map_predicted_sign_to_avatar,
)
from src.modules.component_04_sign_avatar_lecture_generator.utils.wlasl_paths import (
    CONFUSION_MATRIX_PATH,
    FAILED_LOG_PATH,
    LABEL_MAP_PATH,
    LABELS_CSV_PATH,
    LANDMARKS_DIR,
    LANDMARK_LOG_PATH,
    LOGS_DIR,
    METRICS_PATH,
    MODEL_INFO_PATH,
    MODEL_PATH,
    MODELS_DIR,
    PREPROCESS_LOG_PATH,
    PROCESSED_DIR,
    RAW_VIDEOS_DIR,
    RAW_VIDEOS_MP4_DIR,
    SEQUENCES_DIR,
    STATUS_JSON_PATH,
    SUCCESS_LOG_PATH,
    TRAIN_LOG_PATH,
    VIDEOS_DIR,
    WLASL_JSON_PATH,
    WLASL_REPO_DIR,
    append_log_line,
    ensure_wlasl_structure,
    load_json_file,
    read_status,
    save_json_file,
    utc_now_iso,
    write_status,
)

try:
    import cv2
except Exception:  # pragma: no cover - optional import at runtime
    cv2 = None

try:
    import mediapipe as mp
except Exception:  # pragma: no cover - optional import at runtime
    mp = None


WLASL_REPO_URL = "https://github.com/dxli94/WLASL"
MODULE_DIR = Path(__file__).resolve().parents[1]
SCRIPT_DIR = MODULE_DIR / "datasets"
BACKEND_DIR = Path(__file__).resolve().parents[4]
PYTHON_EXECUTABLE = BACKEND_DIR / "venv" / "Scripts" / "python.exe"
SELECTED_FACE_INDEXES = [1, 33, 61, 152, 199, 263, 291]


def _get_python_executable() -> str:
    return str(PYTHON_EXECUTABLE if PYTHON_EXECUTABLE.exists() else Path(sys.executable))


def _safe_rel_path(path: Path) -> str:
    try:
        return str(path.relative_to(BACKEND_DIR))
    except ValueError:
        return str(path)


def _count_files(path: Path, suffixes: tuple[str, ...]) -> int:
    if not path.exists():
        return 0
    return sum(1 for item in path.iterdir() if item.is_file() and item.suffix.lower() in suffixes)


def _load_wlasl_metadata() -> list[dict[str, Any]]:
    if not WLASL_JSON_PATH.exists():
        raise FileNotFoundError(
            f"WLASL metadata not found at {WLASL_JSON_PATH}. Run the download script after cloning the repo."
        )
    payload = load_json_file(WLASL_JSON_PATH, [])
    return payload or []


def _iter_wlasl_instances() -> list[dict[str, Any]]:
    records = _load_wlasl_metadata()
    flattened: list[dict[str, Any]] = []
    for entry in records:
        gloss = entry.get("gloss", "UNKNOWN")
        for instance in entry.get("instances", []):
            flattened.append(
                {
                    "gloss": gloss,
                    "gloss_id": entry.get("gloss_id"),
                    "video_id": instance.get("video_id") or instance.get("url", "").split("=")[-1] or "unknown_video",
                    "url": instance.get("url"),
                    "split": instance.get("split", "train"),
                    "signer_id": instance.get("signer_id"),
                    "frame_start": instance.get("frame_start"),
                    "frame_end": instance.get("frame_end"),
                }
            )
    return flattened


def _normalize_text_tokens(text: str) -> list[str]:
    return [token.strip() for token in text.replace("_", " ").split() if token.strip()]


def ensure_wlasl_repo() -> dict[str, Any]:
    ensure_wlasl_structure()
    if WLASL_REPO_DIR.exists() and WLASL_JSON_PATH.exists():
        return {
            "status": "ready",
            "repoPath": str(WLASL_REPO_DIR),
            "metadataPath": str(WLASL_JSON_PATH),
        }

    write_status(
        "clone_repo",
        "pending",
        {
            "message": "WLASL repository is missing. Run backend/scripts/download_wlasl.py to clone automatically.",
            "repoUrl": WLASL_REPO_URL,
        },
    )
    return {
        "status": "missing",
        "repoPath": str(WLASL_REPO_DIR),
        "metadataPath": str(WLASL_JSON_PATH),
        "repoUrl": WLASL_REPO_URL,
    }


def clone_wlasl_repo(force: bool = False) -> dict[str, Any]:
    ensure_wlasl_structure()
    if WLASL_REPO_DIR.exists() and not force:
        return {
            "status": "skipped",
            "message": "WLASL repository already exists.",
            "repoPath": str(WLASL_REPO_DIR),
        }

    if force and WLASL_REPO_DIR.exists():
        subprocess.run(["cmd", "/c", "rmdir", "/s", "/q", str(WLASL_REPO_DIR)], check=False)

    write_status("clone_repo", "running", {"repoUrl": WLASL_REPO_URL})
    result = subprocess.run(
        ["git", "clone", WLASL_REPO_URL, str(WLASL_REPO_DIR)],
        cwd=str(DATASET_ROOT := WLASL_REPO_DIR.parent),
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        write_status("clone_repo", "failed", {"stderr": result.stderr[-1000:]})
        raise RuntimeError(result.stderr or "Failed to clone WLASL repository.")

    write_status("clone_repo", "completed", {"repoPath": str(WLASL_REPO_DIR)})
    return {
        "status": "completed",
        "repoPath": str(WLASL_REPO_DIR),
        "metadataPath": str(WLASL_JSON_PATH),
    }


def download_wlasl_videos(limit: int | None = None, skip_existing: bool = True) -> dict[str, Any]:
    ensure_wlasl_structure()
    if not WLASL_JSON_PATH.exists():
        clone_status = ensure_wlasl_repo()
        if clone_status["status"] != "ready":
            raise FileNotFoundError("WLASL metadata is missing. Clone the repository before downloading.")

    try:
        from yt_dlp import YoutubeDL
    except Exception as error:  # pragma: no cover - runtime dependency
        raise RuntimeError("yt-dlp is required to download WLASL videos.") from error

    instances = _iter_wlasl_instances()
    if limit:
        instances = instances[:limit]

    success_count = 0
    failed_count = 0
    append_log_line(SUCCESS_LOG_PATH, f"\n[{utc_now_iso()}] download session started")
    append_log_line(FAILED_LOG_PATH, f"\n[{utc_now_iso()}] download session started")
    write_status("download_videos", "running", {"total": len(instances)})

    for index, item in enumerate(instances, start=1):
        video_id = item["video_id"]
        url = item.get("url")
        if not url:
            failed_count += 1
            append_log_line(FAILED_LOG_PATH, f"{video_id}\tmissing_url")
            continue

        existing = list(RAW_VIDEOS_DIR.glob(f"{video_id}.*"))
        if skip_existing and existing:
            success_count += 1
            append_log_line(SUCCESS_LOG_PATH, f"{video_id}\tskipped_existing")
            continue

        output_template = str(RAW_VIDEOS_DIR / f"{video_id}.%(ext)s")
        ydl_opts = {
            "outtmpl": output_template,
            "quiet": True,
            "no_warnings": True,
            "ignoreerrors": True,
        }
        try:
            with YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
            downloaded = list(RAW_VIDEOS_DIR.glob(f"{video_id}.*"))
            if not downloaded:
                raise RuntimeError("No file created")
            success_count += 1
            append_log_line(SUCCESS_LOG_PATH, f"{video_id}\t{url}")
        except Exception as error:  # pragma: no cover - depends on remote URLs
            failed_count += 1
            append_log_line(FAILED_LOG_PATH, f"{video_id}\t{url}\t{error}")

        if index % 25 == 0:
            write_status(
                "download_videos",
                "running",
                {"processed": index, "success": success_count, "failed": failed_count, "total": len(instances)},
            )

    payload = {
        "processed": len(instances),
        "success": success_count,
        "failed": failed_count,
        "rawVideoCount": _count_files(RAW_VIDEOS_DIR, (".mp4", ".mkv", ".webm", ".mov", ".avi")),
    }
    write_status("download_videos", "completed", payload)
    return payload


def preprocess_wlasl_videos(frame_size: tuple[int, int] = (224, 224)) -> dict[str, Any]:
    ensure_wlasl_structure()
    if cv2 is None:
        raise RuntimeError("opencv-python or opencv-python-headless is required for preprocessing.")

    processed = 0
    removed = 0
    append_log_line(PREPROCESS_LOG_PATH, f"\n[{utc_now_iso()}] preprocessing session started")
    write_status("preprocess_videos", "running", {"frameSize": list(frame_size)})

    for source_path in RAW_VIDEOS_DIR.iterdir():
        if not source_path.is_file():
            continue

        capture = cv2.VideoCapture(str(source_path))
        if not capture.isOpened():
            removed += 1
            append_log_line(PREPROCESS_LOG_PATH, f"{source_path.name}\tcorrupted_or_unreadable")
            continue

        fps = capture.get(cv2.CAP_PROP_FPS) or 25
        width, height = frame_size
        raw_mp4_path = RAW_VIDEOS_MP4_DIR / f"{source_path.stem}.mp4"
        processed_path = VIDEOS_DIR / f"{source_path.stem}.mp4"
        raw_writer = cv2.VideoWriter(
            str(raw_mp4_path),
            cv2.VideoWriter_fourcc(*"mp4v"),
            fps,
            (width, height),
        )
        processed_writer = cv2.VideoWriter(
            str(processed_path),
            cv2.VideoWriter_fourcc(*"mp4v"),
            fps,
            (width, height),
        )

        frame_count = 0
        while True:
            ok, frame = capture.read()
            if not ok:
                break
            resized = cv2.resize(frame, frame_size)
            raw_writer.write(resized)
            processed_writer.write(resized)
            frame_count += 1

        capture.release()
        raw_writer.release()
        processed_writer.release()

        if frame_count == 0:
            removed += 1
            if raw_mp4_path.exists():
                raw_mp4_path.unlink()
            if processed_path.exists():
                processed_path.unlink()
            append_log_line(PREPROCESS_LOG_PATH, f"{source_path.name}\tempty_video_removed")
            continue

        processed += 1
        append_log_line(PREPROCESS_LOG_PATH, f"{source_path.name}\tframes={frame_count}")

    payload = {
        "processedVideos": processed,
        "removedVideos": removed,
        "videosDirectory": str(VIDEOS_DIR),
        "rawMp4Directory": str(RAW_VIDEOS_MP4_DIR),
    }
    write_status("preprocess_videos", "completed", payload)
    return payload


def _extract_landmark_points(result_landmarks, include_visibility: bool = False) -> list[dict[str, float]]:
    if not result_landmarks:
        return []
    payload: list[dict[str, float]] = []
    for landmark in result_landmarks.landmark:
        item = {
            "x": float(landmark.x),
            "y": float(landmark.y),
            "z": float(landmark.z),
        }
        if include_visibility:
            item["visibility"] = float(getattr(landmark, "visibility", 0.0))
        payload.append(item)
    return payload


def extract_landmarks_dataset() -> dict[str, Any]:
    ensure_wlasl_structure()
    if cv2 is None or mp is None:
        raise RuntimeError("OpenCV and MediaPipe are required for landmark extraction.")

    append_log_line(LANDMARK_LOG_PATH, f"\n[{utc_now_iso()}] landmark extraction session started")
    write_status("extract_landmarks", "running", {})
    holistic = mp.solutions.holistic.Holistic(
        static_image_mode=False,
        model_complexity=1,
        smooth_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    processed_count = 0
    for video_path in VIDEOS_DIR.glob("*.mp4"):
        capture = cv2.VideoCapture(str(video_path))
        if not capture.isOpened():
            append_log_line(LANDMARK_LOG_PATH, f"{video_path.name}\tunable_to_open")
            continue

        frame_payloads: list[dict[str, Any]] = []
        sequence_frames: list[list[float]] = []
        frame_number = 0

        while True:
            ok, frame = capture.read()
            if not ok:
                break

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = holistic.process(rgb_frame)

            left_hand = _extract_landmark_points(results.left_hand_landmarks)
            right_hand = _extract_landmark_points(results.right_hand_landmarks)
            pose = _extract_landmark_points(results.pose_landmarks, include_visibility=True)
            face = _extract_landmark_points(results.face_landmarks)

            frame_payloads.append(
                {
                    "frame_number": frame_number,
                    "left_hand_landmarks": left_hand,
                    "right_hand_landmarks": right_hand,
                    "pose_landmarks": pose,
                    "face_landmarks": face,
                }
            )
            sequence_frames.append(_flatten_landmark_frame(frame_payloads[-1]))
            frame_number += 1

        capture.release()

        landmark_path = LANDMARKS_DIR / f"{video_path.stem}.json"
        landmark_path.write_text(json.dumps(frame_payloads, indent=2), encoding="utf-8")
        np.save(SEQUENCES_DIR / f"{video_path.stem}.npy", np.array(sequence_frames, dtype=np.float32))

        processed_count += 1
        append_log_line(LANDMARK_LOG_PATH, f"{video_path.name}\tframes={frame_number}")

    holistic.close()
    payload = {
        "processedVideos": processed_count,
        "landmarkFiles": _count_files(LANDMARKS_DIR, (".json",)),
        "sequenceFiles": _count_files(SEQUENCES_DIR, (".npy",)),
    }
    write_status("extract_landmarks", "completed", payload)
    return payload


def _flatten_landmark_frame(frame_payload: dict[str, Any]) -> list[float]:
    values: list[float] = []

    def extend_points(points: list[dict[str, float]], count: int, include_visibility: bool = False) -> None:
        padded = points[:count]
        while len(padded) < count:
            padded.append({"x": 0.0, "y": 0.0, "z": 0.0, "visibility": 0.0})
        for item in padded:
            values.extend([float(item.get("x", 0.0)), float(item.get("y", 0.0)), float(item.get("z", 0.0))])
            if include_visibility:
                values.append(float(item.get("visibility", 0.0)))

    extend_points(frame_payload.get("left_hand_landmarks", []), 21)
    extend_points(frame_payload.get("right_hand_landmarks", []), 21)
    extend_points(frame_payload.get("pose_landmarks", []), 33, include_visibility=True)

    face_points = frame_payload.get("face_landmarks", [])
    selected_face = [face_points[index] for index in SELECTED_FACE_INDEXES if index < len(face_points)]
    extend_points(selected_face, len(SELECTED_FACE_INDEXES))
    return values


def generate_labels_csv() -> dict[str, Any]:
    ensure_wlasl_structure()
    records = _iter_wlasl_instances()
    rows: list[dict[str, Any]] = []

    for item in records:
        video_id = item["video_id"]
        video_path = VIDEOS_DIR / f"{video_id}.mp4"
        landmark_path = LANDMARKS_DIR / f"{video_id}.json"
        if not video_path.exists() or not landmark_path.exists():
            continue
        rows.append(
            {
                "video_id": video_id,
                "gloss": item["gloss"],
                "video_path": _safe_rel_path(video_path),
                "landmark_path": _safe_rel_path(landmark_path),
                "split": item.get("split", "train"),
                "signer_id": item.get("signer_id", ""),
            }
        )

    LABELS_CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LABELS_CSV_PATH.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["video_id", "gloss", "video_path", "landmark_path", "split", "signer_id"],
        )
        writer.writeheader()
        writer.writerows(rows)

    payload = {"labelsPath": str(LABELS_CSV_PATH), "rowCount": len(rows)}
    write_status("generate_labels", "completed", payload)
    return payload


def _read_labels_rows() -> list[dict[str, str]]:
    if not LABELS_CSV_PATH.exists():
        return []
    with LABELS_CSV_PATH.open("r", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def _load_sequence_for_row(row: dict[str, str]) -> np.ndarray:
    npy_path = SEQUENCES_DIR / f"{row['video_id']}.npy"
    if npy_path.exists():
        return np.load(npy_path)

    landmark_json_path = BACKEND_DIR / row["landmark_path"]
    frames = load_json_file(landmark_json_path, [])
    sequence = [_flatten_landmark_frame(frame) for frame in frames]
    array = np.array(sequence, dtype=np.float32)
    np.save(npy_path, array)
    return array


def _pad_or_trim_sequence(sequence: np.ndarray, sequence_length: int) -> np.ndarray:
    if len(sequence) >= sequence_length:
        return sequence[:sequence_length]
    feature_dim = sequence.shape[1] if sequence.ndim == 2 and sequence.shape[0] else 0
    padded = np.zeros((sequence_length, feature_dim), dtype=np.float32)
    if len(sequence):
        padded[: len(sequence)] = sequence
    return padded


def train_lstm_model(
    epochs: int = 10,
    batch_size: int = 16,
    sequence_length: int = 48,
    validation_split: float = 0.2,
    force_retrain: bool = False,
) -> dict[str, Any]:
    ensure_wlasl_structure()

    if MODEL_PATH.exists() and not force_retrain:
        return {
            "status": "skipped",
            "message": "Model already exists. Use force retrain to train again.",
            "modelPath": str(MODEL_PATH),
        }

    try:
        import tensorflow as tf
        from sklearn.metrics import confusion_matrix
    except Exception as error:  # pragma: no cover - runtime dependency
        raise RuntimeError("TensorFlow and scikit-learn are required for training.") from error

    rows = _read_labels_rows()
    if not rows:
        raise RuntimeError("labels.csv is missing or empty. Run generate_labels.py first.")

    write_status(
        "train_model",
        "running",
        {
            "epochs": epochs,
            "batchSize": batch_size,
            "sequenceLength": sequence_length,
        },
    )
    append_log_line(TRAIN_LOG_PATH, f"\n[{utc_now_iso()}] training session started")

    sequences = []
    labels = []
    splits = []
    for row in rows:
        sequence = _load_sequence_for_row(row)
        if sequence.size == 0:
            continue
        sequences.append(_pad_or_trim_sequence(sequence, sequence_length))
        labels.append(row["gloss"])
        splits.append(row.get("split", "train"))

    if not sequences:
        raise RuntimeError("No usable sequence files were found for training.")

    X = np.stack(sequences).astype(np.float32)
    label_names = sorted(set(labels))
    label_to_index = {label: index for index, label in enumerate(label_names)}
    y = np.array([label_to_index[label] for label in labels], dtype=np.int32)

    train_indexes = [index for index, split in enumerate(splits) if split != "test"]
    test_indexes = [index for index, split in enumerate(splits) if split == "test"]
    if not test_indexes:
        split_point = max(1, int(len(X) * (1 - validation_split)))
        train_indexes = list(range(split_point))
        test_indexes = list(range(split_point, len(X)))

    X_train, y_train = X[train_indexes], y[train_indexes]
    X_val, y_val = X[test_indexes], y[test_indexes]

    model = tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=(sequence_length, X.shape[2])),
            tf.keras.layers.Masking(mask_value=0.0),
            tf.keras.layers.LSTM(128, return_sequences=True),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.LSTM(64),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(64, activation="relu"),
            tf.keras.layers.Dense(len(label_names), activation="softmax"),
        ]
    )
    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    checkpoint_path = MODELS_DIR / "checkpoint.keras"
    checkpoint = tf.keras.callbacks.ModelCheckpoint(
        filepath=str(checkpoint_path),
        save_best_only=True,
        monitor="val_accuracy",
        mode="max",
    )

    history = model.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=[checkpoint],
        verbose=1,
    )

    best_model = tf.keras.models.load_model(checkpoint_path) if checkpoint_path.exists() else model
    best_model.save(MODEL_PATH)

    predictions = best_model.predict(X_val, verbose=0)
    predicted_labels = np.argmax(predictions, axis=1)
    matrix = confusion_matrix(y_val, predicted_labels, labels=list(range(len(label_names))))

    with CONFUSION_MATRIX_PATH.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["label", *label_names])
        for label_name, row_values in zip(label_names, matrix):
            writer.writerow([label_name, *row_values.tolist()])

    metrics_payload = {
        "train_accuracy": float(history.history["accuracy"][-1]),
        "val_accuracy": float(history.history["val_accuracy"][-1]),
        "train_loss": float(history.history["loss"][-1]),
        "val_loss": float(history.history["val_loss"][-1]),
        "epochs": epochs,
        "samples": int(len(X)),
    }
    save_json_file(METRICS_PATH, metrics_payload)
    save_json_file(LABEL_MAP_PATH, {"labels": label_names, "label_to_index": label_to_index})
    save_json_file(
        MODEL_INFO_PATH,
        {
            "modelPath": str(MODEL_PATH),
            "labelMapPath": str(LABEL_MAP_PATH),
            "metricsPath": str(METRICS_PATH),
            "confusionMatrixPath": str(CONFUSION_MATRIX_PATH),
            "classCount": len(label_names),
            "sequenceLength": sequence_length,
            "featureDimension": int(X.shape[2]),
            "lastTrainedAt": utc_now_iso(),
            "trainingStatus": "completed",
        },
    )

    append_log_line(TRAIN_LOG_PATH, f"completed\tval_accuracy={metrics_payload['val_accuracy']:.4f}")
    write_status("train_model", "completed", metrics_payload)
    return metrics_payload


def predict_from_landmarks(landmark_path: str | None = None, sequence: list[list[float]] | None = None, top_k: int = 3) -> dict[str, Any]:
    try:
        import tensorflow as tf
    except Exception as error:  # pragma: no cover - runtime dependency
        raise RuntimeError("TensorFlow is required for prediction.") from error

    if not MODEL_PATH.exists() or not LABEL_MAP_PATH.exists():
        raise FileNotFoundError("Trained model not found. Train the LSTM model first.")

    model = tf.keras.models.load_model(MODEL_PATH)
    label_map = load_json_file(LABEL_MAP_PATH, {"labels": []})
    labels = label_map.get("labels", [])
    if not labels:
        raise RuntimeError("Label map is empty.")

    model_info = load_json_file(MODEL_INFO_PATH, {})
    sequence_length = int(model_info.get("sequenceLength") or 48)

    if sequence is not None:
        array = np.array(sequence, dtype=np.float32)
    else:
        frames = load_json_file(Path(landmark_path), [])
        array = np.array([_flatten_landmark_frame(frame) for frame in frames], dtype=np.float32)

    if array.ndim != 2:
        raise ValueError("Sequence input must be a 2D frame-by-feature array.")

    padded = _pad_or_trim_sequence(array, sequence_length)
    prediction = model.predict(np.expand_dims(padded, axis=0), verbose=0)[0]
    sorted_indexes = np.argsort(prediction)[::-1][:top_k]
    candidates = [
        {"sign": labels[index], "confidence": float(prediction[index])}
        for index in sorted_indexes
    ]
    best = candidates[0]
    avatar_payload = map_predicted_sign_to_avatar(best["sign"])

    return {
        "predictedSign": best["sign"],
        "confidence": round(best["confidence"], 4),
        "candidates": [
            {"sign": item["sign"], "confidence": round(item["confidence"], 4)}
            for item in candidates
        ],
        "avatarMotionData": avatar_payload,
    }


def get_labels_preview(limit: int = 100) -> dict[str, Any]:
    rows = _read_labels_rows()
    return {
        "count": len(rows),
        "items": rows[:limit],
    }


def get_status_summary() -> dict[str, Any]:
    ensure_wlasl_structure()
    latest_status = read_status()
    labels_rows = _read_labels_rows()
    return {
        "repoReady": WLASL_REPO_DIR.exists(),
        "metadataReady": WLASL_JSON_PATH.exists(),
        "rawVideoCount": _count_files(RAW_VIDEOS_DIR, (".mp4", ".mkv", ".webm", ".mov", ".avi")),
        "rawVideoMp4Count": _count_files(RAW_VIDEOS_MP4_DIR, (".mp4",)),
        "processedVideoCount": _count_files(VIDEOS_DIR, (".mp4",)),
        "landmarkCount": _count_files(LANDMARKS_DIR, (".json",)),
        "sequenceCount": _count_files(SEQUENCES_DIR, (".npy",)),
        "labelCount": len(labels_rows),
        "modelReady": MODEL_PATH.exists(),
        "latestStatus": latest_status,
        "directories": {
            "repo": str(WLASL_REPO_DIR),
            "metadata": str(WLASL_JSON_PATH),
            "raw_videos": str(RAW_VIDEOS_DIR),
            "raw_videos_mp4": str(RAW_VIDEOS_MP4_DIR),
            "videos": str(VIDEOS_DIR),
            "landmarks": str(LANDMARKS_DIR),
            "labels": str(LABELS_DIR := LABELS_CSV_PATH.parent),
            "sequences": str(SEQUENCES_DIR),
            "models": str(MODELS_DIR),
            "logs": str(LOGS_DIR),
        },
    }


def get_model_info() -> dict[str, Any]:
    info = load_json_file(MODEL_INFO_PATH, {})
    return {
        "modelPath": str(MODEL_PATH) if MODEL_PATH.exists() else None,
        "labelMapPath": str(LABEL_MAP_PATH) if LABEL_MAP_PATH.exists() else None,
        "metricsPath": str(METRICS_PATH) if METRICS_PATH.exists() else None,
        "confusionMatrixPath": str(CONFUSION_MATRIX_PATH) if CONFUSION_MATRIX_PATH.exists() else None,
        "classCount": int(info.get("classCount", 0)),
        "sequenceLength": info.get("sequenceLength"),
        "featureDimension": info.get("featureDimension"),
        "lastTrainedAt": info.get("lastTrainedAt"),
        "trainingStatus": info.get("trainingStatus") or read_status().get("status"),
    }


def launch_training_job(config: dict[str, Any]) -> dict[str, Any]:
    ensure_wlasl_structure()
    started_at = datetime.now(timezone.utc)
    command = [
        _get_python_executable(),
        str(SCRIPT_DIR / "train_model.py"),
        "--epochs",
        str(config.get("epochs", 10)),
        "--batch-size",
        str(config.get("batchSize", 16)),
        "--sequence-length",
        str(config.get("sequenceLength", 48)),
        "--validation-split",
        str(config.get("validationSplit", 0.2)),
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
        "train_model",
        "queued",
        {
            "command": " ".join(command),
            "startedAt": started_at.isoformat(),
        },
    )
    return {
        "status": "queued",
        "message": "Training job started in the background.",
        "command": " ".join(command),
        "startedAt": started_at,
    }


async def get_labels_preview_async(limit: int = 100) -> dict[str, Any]:
    return await asyncio.to_thread(get_labels_preview, limit)


async def get_status_summary_async() -> dict[str, Any]:
    return await asyncio.to_thread(get_status_summary)


async def get_model_info_async() -> dict[str, Any]:
    return await asyncio.to_thread(get_model_info)


async def predict_from_landmarks_async(payload: dict[str, Any]) -> dict[str, Any]:
    return await asyncio.to_thread(
        predict_from_landmarks,
        payload.get("landmarkPath"),
        payload.get("sequence"),
        payload.get("topK", 3),
    )


async def launch_training_job_async(config: dict[str, Any]) -> dict[str, Any]:
    return await asyncio.to_thread(launch_training_job, config)


# ---------------------------------------------------------------------------
# Landmark sequence serving — feeds the frontend sign avatar player
# ---------------------------------------------------------------------------

def _synthetic_pose_for_gloss(gloss: str) -> list[dict[str, Any]]:
    """Generate a deterministic unique arm-pose sequence from a gloss word.

    This fallback runs when no extracted WLASL landmark files exist for a word.
    Each character in the gloss shifts the shoulder/elbow angles so every word
    gets visually distinct motion that is always the same for the same word.
    """
    seed = sum(ord(char) * (index + 1) for index, char in enumerate(gloss.lower()))
    base_right_shoulder = 0.78 + (seed % 31) * 0.012
    base_left_shoulder  = 2.38 - (seed % 29) * 0.011
    base_right_elbow    = 1.52 + (seed % 23) * 0.018
    base_left_elbow     = -1.54 - (seed % 17) * 0.014

    frames = []
    n_frames = 5
    for i in range(n_frames):
        progress  = i / max(n_frames - 1, 1)
        wave      = 0.22 * (1 - abs(progress * 2 - 1))
        direction = 1 if i % 2 == 0 else -1
        frames.append({
            "time":                round(progress * 1.4, 3),
            "leftShoulderAngle":   round(base_left_shoulder  + wave * direction * 0.18, 4),
            "leftElbowAngle":      round(base_left_elbow     - wave * direction * 0.22, 4),
            "rightShoulderAngle":  round(base_right_shoulder + wave * direction * 0.16, 4),
            "rightElbowAngle":     round(base_right_elbow    + wave * direction * 0.24, 4),
            "leftHand":  [],
            "rightHand": [],
        })
    return frames


def _normalise_landmark_point(pt: dict[str, float]) -> dict[str, float]:
    return {"x": round(float(pt.get("x", 0.0)), 5),
            "y": round(float(pt.get("y", 0.0)), 5),
            "z": round(float(pt.get("z", 0.0)), 5)}


def _landmark_json_to_frames(raw_frames: list[dict[str, Any]], total_duration: float = 1.6) -> list[dict[str, Any]]:
    """Convert extracted landmark JSON to the time-indexed frame format
    used by the frontend signEngine landmark player."""
    n = len(raw_frames)
    if not n:
        return []
    frames = []
    for index, raw in enumerate(raw_frames):
        left_hand  = [_normalise_landmark_point(pt) for pt in raw.get("left_hand_landmarks",  [])]
        right_hand = [_normalise_landmark_point(pt) for pt in raw.get("right_hand_landmarks", [])]
        pose_pts   = raw.get("pose_landmarks", [])

        # Derive rough shoulder/elbow angles from pose landmarks for the
        # existing angle-based renderer to use as a fallback.
        left_shoulder_angle  = 2.35
        right_shoulder_angle = 0.79
        left_elbow_angle     = -1.55
        right_elbow_angle    = 1.55
        if len(pose_pts) > 15:
            try:
                import math
                ls = pose_pts[11]; le = pose_pts[13]; lw = pose_pts[15]
                rs = pose_pts[12]; re = pose_pts[14]; rw = pose_pts[16]
                left_shoulder_angle  = round(math.atan2(le["y"] - ls["y"], le["x"] - ls["x"]), 4)
                left_elbow_angle     = round(math.atan2(lw["y"] - le["y"], lw["x"] - le["x"]) - left_shoulder_angle, 4)
                right_shoulder_angle = round(math.atan2(re["y"] - rs["y"], re["x"] - rs["x"]), 4)
                right_elbow_angle    = round(math.atan2(rw["y"] - re["y"], rw["x"] - re["x"]) - right_shoulder_angle, 4)
            except Exception:
                pass

        frames.append({
            "time":                round(index / max(n - 1, 1) * total_duration, 4),
            "leftShoulderAngle":   left_shoulder_angle,
            "leftElbowAngle":      left_elbow_angle,
            "rightShoulderAngle":  right_shoulder_angle,
            "rightElbowAngle":     right_elbow_angle,
            "leftHand":            left_hand[:21],
            "rightHand":           right_hand[:21],
        })
    return frames


def get_landmark_sequence(gloss_word: str) -> dict[str, Any]:
    """Return a time-indexed frame sequence for one gloss word.

    Resolution order:
    1. Per-gloss avatar JSON  (landmarks/{gloss}.json) — exported by Colab Cell 16.
       These files are pre-converted to the avatar frame format and contain real
       MediaPipe hand landmarks from the best WLASL video for that gloss.
    2. Per-video-id JSON  (landmarks/{video_id}.json) — from full extraction run.
    3. Deterministic synthetic pose — always unique per word, no files needed.
    """
    gloss = gloss_word.strip().lower()

    # ── Priority 1: per-gloss avatar JSON (Colab Cell 16 output) ──
    gloss_json_path = LANDMARKS_DIR / f"{gloss}.json"
    if gloss_json_path.exists():
        try:
            data = load_json_file(gloss_json_path, {})
            frames = data.get("frames", [])
            if frames:
                return {
                    "gloss":   gloss,
                    "source":  data.get("source", "wlasl_extracted"),
                    "videoId": data.get("videoId"),
                    "frames":  frames,
                }
        except Exception:
            pass

    # ── Priority 2: per-video-id JSONs via WLASL metadata ──
    if WLASL_JSON_PATH.exists():
        try:
            wlasl_data = load_json_file(WLASL_JSON_PATH, [])
            for entry in wlasl_data:
                if entry.get("gloss", "").lower() != gloss:
                    continue
                for instance in entry.get("instances", []):
                    video_id  = str(instance.get("video_id", "")).strip()
                    json_path = LANDMARKS_DIR / f"{video_id}.json"
                    if json_path.exists():
                        raw_frames = load_json_file(json_path, [])
                        if raw_frames:
                            frames = _landmark_json_to_frames(raw_frames)
                            return {
                                "gloss":   gloss,
                                "source":  "wlasl_extracted",
                                "videoId": video_id,
                                "frames":  frames,
                            }
        except Exception:
            pass

    # ── Priority 3: synthetic fallback — always distinct per keyword ──
    return {
        "gloss":   gloss,
        "source":  "synthetic_fallback",
        "videoId": None,
        "frames":  _synthetic_pose_for_gloss(gloss),
    }


async def get_landmark_sequence_async(gloss_word: str) -> dict[str, Any]:
    return await asyncio.to_thread(get_landmark_sequence, gloss_word)

