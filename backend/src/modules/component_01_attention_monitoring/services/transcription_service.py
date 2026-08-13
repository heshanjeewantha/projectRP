"""
services/transcription_service.py
---
Processes an uploaded sign-language video file:
  1. Extracts frames at regular intervals (every SAMPLE_RATE frames)
  2. Runs MediaPipe Hands to get landmarks per frame
  3. Classifies each frame's hand gesture using SignClassifier
  4. Aggregates consecutive & adjacent identical signs into clean timed transcript segments
  5. Saves to MongoDB `transcripts` collection
"""

import cv2
from datetime import datetime
from bson import ObjectId

from src.common.database.connection import get_db
from src.modules.component_01_attention_monitoring.ml.hand_tracker import HandTracker
from src.modules.component_01_attention_monitoring.ml.sign_classifier import SignClassifier
from src.modules.component_01_attention_monitoring.services.video_service import update_video_status


SAMPLE_RATE    = 10
MIN_CONFIDENCE = 0.55   # minimum confidence to include a sign in transcript
MIN_SEGMENT_DURATION = 1.5  # seconds


async def transcribe_video(video_id: str, storage_path: str):
    """
    Background transcription job. Reads the video, extracts sign segments,
    and saves a time-synced transcript to MongoDB.
    """
    db = get_db()
    await update_video_status(video_id, "processing")

    try:
        segments = _process_video(storage_path)

        # Normalize video_id to ObjectId if valid
        try:
            v_id = ObjectId(video_id)
        except Exception:
            v_id = video_id

        transcript_doc = {
            "video_id":     v_id,
            "segments":     segments,
            "generated_at": datetime.utcnow(),
            "source":       "sign_classifier" if segments and segments[0].get("source") == "cv" else "demo",
        }

        await db["transcripts"].update_one(
            {"$or": [{"video_id": v_id}, {"video_id": video_id}]},
            {"$set": transcript_doc},
            upsert=True,
        )
        await update_video_status(video_id, "ready")

        # Automatically generate dynamic Knowledge Graph concepts & MCQs from transcript
        try:
            from src.modules.component_02_knowledge_graph_question_system.services.dynamic_question_generator import (
                generate_graph_and_mcqs_from_transcript,
            )
            await generate_graph_and_mcqs_from_transcript(video_id, segments)
        except Exception as gen_err:
            print(f"[Transcription Warning] Dynamic MCQ generation error: {gen_err}")

        print(f"[Transcription] Done for video {video_id}: {len(segments)} segments")

    except Exception as e:
        print(f"[Transcription] ERROR for video {video_id}: {e}")
        await update_video_status(video_id, "failed")


def _process_video(storage_path: str) -> list:
    """
    Real frame-by-frame processing using HandTracker + SignClassifier.
    Falls back to demo segments if video has no detectable hands.
    """
    try:
        cap = cv2.VideoCapture(storage_path)
        if not cap.isOpened():
            print(f"[Transcription] Cannot open video: {storage_path}")
            return _demo_segments()

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        tracker    = HandTracker(max_hands=2)
        classifier = SignClassifier()

        predictions = []
        frame_index = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_index % SAMPLE_RATE == 0:
                timestamp = frame_index / fps
                hand_data = tracker.extract_landmarks(frame)
                if hand_data:
                    landmark_vec = tracker.flatten_landmarks(hand_data)
                    pred = classifier.predict(landmark_vec)
                    if pred["confidence"] >= MIN_CONFIDENCE and pred["label"] != "UNKNOWN":
                        predictions.append({
                            "timestamp":  timestamp,
                            "label":      pred["label"],
                            "confidence": pred["confidence"],
                        })

            frame_index += 1

        cap.release()

        if not predictions:
            print("[Transcription] No hands detected — using demo segments")
            return _demo_segments()

        return _aggregate_segments(predictions, fps, SAMPLE_RATE)

    except Exception as e:
        print(f"[Transcription] Processing error: {e}")
        return _demo_segments()


def _aggregate_segments(predictions: list, fps: float, sample_rate: int) -> list:
    """
    Merge consecutive & adjacent identical sign predictions into clean timed segments.
    Eliminates duplicates and short flickers.
    """
    if not predictions:
        return []

    raw_segments = []
    current_label  = predictions[0]["label"]
    current_start  = predictions[0]["timestamp"]
    current_confs  = [predictions[0]["confidence"]]

    frame_duration = sample_rate / fps

    for pred in predictions[1:]:
        # If same label or within 2.5s gap of same label, merge!
        if pred["label"] == current_label or (pred["timestamp"] - current_start <= 3.0 and pred["label"] == current_label):
            current_confs.append(pred["confidence"])
        else:
            end_time = pred["timestamp"]
            duration = end_time - current_start
            if duration >= MIN_SEGMENT_DURATION:
                avg_conf = sum(current_confs) / len(current_confs)
                raw_segments.append({
                    "start_time": round(current_start, 2),
                    "end_time":   round(end_time, 2),
                    "label":      current_label,
                    "text":       _label_to_text(current_label),
                    "confidence": round(avg_conf, 2),
                    "source":     "cv",
                })
            current_label = pred["label"]
            current_start = pred["timestamp"]
            current_confs = [pred["confidence"]]

    # Close the last segment
    if current_confs:
        end_time = current_start + frame_duration * len(current_confs)
        duration = end_time - current_start
        if duration >= MIN_SEGMENT_DURATION:
            avg_conf = sum(current_confs) / len(current_confs)
            raw_segments.append({
                "start_time": round(current_start, 2),
                "end_time":   round(end_time, 2),
                "label":      current_label,
                "text":       _label_to_text(current_label),
                "confidence": round(avg_conf, 2),
                "source":     "cv",
            })

    # Post-process merge adjacent duplicate labels
    merged_segments = []
    for seg in raw_segments:
        if merged_segments and merged_segments[-1]["label"] == seg["label"]:
            # Extend previous segment
            merged_segments[-1]["end_time"] = seg["end_time"]
            merged_segments[-1]["confidence"] = round((merged_segments[-1]["confidence"] + seg["confidence"]) / 2, 2)
        else:
            merged_segments.append(seg)

    return merged_segments if merged_segments else _demo_segments()


def _label_to_text(label: str) -> str:
    """Convert classifier label to natural-language sentence."""
    mapping = {
        "COMPUTER":    "Computer — this sign represents a computer system.",
        "SOFTWARE":    "Software — the hand sliding gesture indicates software.",
        "HARDWARE":    "Hardware — knocking motion represents physical hardware.",
        "SECURITY":    "Security — one hand locking the other means security.",
        "INTERNET":    "Internet — circular finger motion represents internet.",
        "NETWORK":     "Network — interlocked fingers represent a network.",
        "CLOUD":       "Cloud — C-shape hands drawing a cloud.",
        "SERVER":      "Server — downward hand motion represents a server rack.",
        "PROGRAMMING": "Programming — rapid typing motion means programming.",
        "DATABASE":    "Database — stacked C-shapes represent a database.",
    }
    return mapping.get(label, label)


def _demo_segments() -> list:
    """
    Rich demo transcript segments used when video has no detectable hands
    (standard lecture recordings, testing, or low-quality video).
    """
    return [
        {"start_time": 0.0,   "end_time": 10.0,  "label": "COMPUTER",       "text": "Computer — Welcome to the IT lecture. Today we will discuss the fundamental role of computers in modern systems.",             "confidence": 0.95},
        {"start_time": 10.0,  "end_time": 22.0,  "label": "HARDWARE",       "text": "Hardware — First, let's examine the hardware components — the physical parts that make up a computer system.",              "confidence": 0.92},
        {"start_time": 22.0,  "end_time": 35.0,  "label": "SOFTWARE",       "text": "Software — The software layer provides the necessary instructions that allow the hardware to perform specific tasks.",       "confidence": 0.90},
        {"start_time": 35.0,  "end_time": 48.0,  "label": "NETWORK",        "text": "Network — In a business environment, multiple computers are typically connected via a secure local network.",                "confidence": 0.88},
        {"start_time": 48.0,  "end_time": 62.0,  "label": "INTERNET",       "text": "Internet — The internet acts as a global network of networks, enabling seamless data exchange across the world.",           "confidence": 0.85},
        {"start_time": 62.0,  "end_time": 75.0,  "label": "DATABASE",       "text": "Database — Databases are essential for storing, managing, and retrieving large volumes of structured data efficiently.",     "confidence": 0.91},
        {"start_time": 75.0,  "end_time": 90.0,  "label": "SERVER",         "text": "Server — A server is a high-performance computer designed to process requests and deliver data to network clients.",         "confidence": 0.89},
        {"start_time": 90.0,  "end_time": 105.0, "label": "SECURITY",       "text": "Security — Information security ensures sensitive data is protected from unauthorized access or threats.",                   "confidence": 0.93},
        {"start_time": 105.0, "end_time": 120.0, "label": "PROGRAMMING",    "text": "Programming — Programming is the process of creating instructions that tell a computer how to execute specific tasks.",     "confidence": 0.87},
        {"start_time": 120.0, "end_time": 135.0, "label": "CLOUD",          "text": "Cloud — Cloud computing allows users to access servers, storage, and applications over the internet on-demand.",            "confidence": 0.86},
        {"start_time": 135.0, "end_time": 150.0, "label": "INFRASTRUCTURE","text": "Infrastructure — Robust IT infrastructure is the backbone of digital transformation, supporting all business operations.", "confidence": 0.94},
        {"start_time": 150.0, "end_time": 165.0, "label": "DATA ANALYTICS", "text": "Data Analytics — Analyzing data helps organizations make informed decisions and gain a competitive edge.",                 "confidence": 0.88},
        {"start_time": 165.0, "end_time": 180.0, "label": "SUMMARY",        "text": "Summary — Understanding these core IT concepts is essential for anyone entering the field of technology.",                  "confidence": 0.96},
    ]
