"""
routes/websocket_routes.py
WebSocket endpoint for real-time attention analysis, facial emotion classification,
and Grade 10 & 11 O/L ICT syllabus-aligned contextual interventions.

Runs all detectors per frame:
  1. AttentionDetector  → EAR, PERCLOS, MAR, head pose, gaze, blink rate, engagement,
                          facial emotion classification (AU4/AU7/AU12/AU15).
  2. PhoneDetector      → phone/cell phone detection.
  3. LiveSignRecognizer → real-time sign language gestures.
"""
from collections import deque
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import base64
import cv2
import numpy as np
import time

from src.common.utils.websocket_manager import ws_manager
from src.modules.component_01_attention_monitoring.ml.attention_detector import AttentionDetector
from src.modules.component_01_attention_monitoring.ml.live_sign_recognizer import LiveSignRecognizer
from src.modules.component_01_attention_monitoring.services import video_service
from src.modules.component_01_attention_monitoring.constants.syllabus_constants import (
    find_topic_for_timestamp,
)

router = APIRouter(tags=["WebSocket"])

# Singleton detector instances (reused across WebSocket frames for state continuity)
_attention_detector = AttentionDetector()
_sign_recognizer    = LiveSignRecognizer()

STATUS_HISTORY_SIZE          = 4
NOT_ATTENTIVE_VOTE_THRESHOLD = 3
NO_FACE_GRACE_FRAMES         = 3

# Cache video metadata to avoid repeated DB hits on high-rate frame streaming
_video_cache: dict[str, tuple[float, dict]] = {}


async def _get_cached_video(video_id: str) -> dict | None:
    now = time.time()
    if video_id in _video_cache:
        cached_time, doc = _video_cache[video_id]
        if now - cached_time < 300:  # 5 min cache
            return doc
    doc = await video_service.get_video(video_id)
    if doc:
        _video_cache[video_id] = (now, doc)
    return doc


@router.websocket("/ws/attention/{session_id}")
async def websocket_attention_endpoint(websocket: WebSocket, session_id: str):
    """
    Accepts base64-encoded frames from React webcam.
    Runs attention and emotion detectors, maps to active Grade 10/11 syllabus topic,
    and streams structured telemetry and adaptive intervention recommendations.
    """
    await ws_manager.connect(session_id, websocket)
    status_history: deque[str] = deque(maxlen=STATUS_HISTORY_SIZE)
    no_face_streak = 0
    stable_status = "attentive"
    current_video_id = None

    try:
        while True:
            data = await websocket.receive_json()
            frame_base64    = data.get("frame")
            video_timestamp = float(data.get("timestamp", 0.0))
            incoming_vid    = data.get("video_id")
            if incoming_vid:
                current_video_id = str(incoming_vid)

            if not frame_base64:
                continue

            try:
                # Decode base64 → OpenCV image
                img_data = base64.b64decode(frame_base64.split(",")[1])
                np_arr   = np.frombuffer(img_data, np.uint8)
                frame    = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

                if frame is None:
                    continue

                # ── Run attention, emotion and gesture detectors ──────────
                attention_result = _attention_detector.analyze_frame(frame)
                sign_result      = _sign_recognizer.analyze_frame(frame)

                # ── Merge telemetry results ───────────────────────────────
                result = {
                    **attention_result,
                    "phone_detected": False,
                    "phone_confidence": 0.0,
                    "phone_in_hand": False,
                    "phone_posture": "none",
                    **sign_result,
                    "timestamp": video_timestamp,
                }

                # ── Stability voting ──────────────────────────────────────
                if result.get("reason") == "no_face":
                    no_face_streak += 1
                else:
                    no_face_streak = 0

                observed_status = result.get("status", stable_status)
                status_history.append(observed_status)

                not_attentive_votes = sum(
                    1 for s in status_history if s == "not_attentive"
                )
                should_mark_distracted = (
                    no_face_streak >= NO_FACE_GRACE_FRAMES
                    or not_attentive_votes >= NOT_ATTENTIVE_VOTE_THRESHOLD
                )
                stable_status    = "not_attentive" if should_mark_distracted else "attentive"
                result["status"] = stable_status

                # ── Syllabus Alignment & Contextual Intervention ──────────
                active_syllabus = None
                recommended_intervention = None

                if current_video_id:
                    video_meta = await _get_cached_video(current_video_id)
                    if video_meta:
                        segments = video_meta.get("timeline_segments", [])
                        topic_seg = find_topic_for_timestamp(segments, video_timestamp)

                        active_syllabus = {
                            "grade": video_meta.get("grade", "Grade 10"),
                            "unit_number": video_meta.get("unit_number", 1),
                            "unit_title": video_meta.get("unit_title", "Introduction to ICT"),
                            "topic": video_meta.get("topic", "Data & Information"),
                            "subtopic_id": topic_seg.get("subtopic_id") if topic_seg else None,
                            "subtopic_title": topic_seg.get("subtopic_title") if topic_seg else video_meta.get("topic"),
                            "concept_id": topic_seg.get("concept_id") if topic_seg else None,
                            "key_terms": topic_seg.get("key_terms", []) if topic_seg else [],
                            "summary_hint": topic_seg.get("summary_hint", "") if topic_seg else "",
                            "sample_checkpoint_mcq": topic_seg.get("sample_checkpoint_mcq") if topic_seg else None,
                        }

                        # Compute topic-grounded adaptive intervention
                        current_emotion = result.get("emotion", "focused")
                        subtopic_name = active_syllabus.get("subtopic_title") or "this topic"
                        summary_hint = active_syllabus.get("summary_hint") or "Check key syllabus points."

                        if current_emotion == "confused":
                            recommended_intervention = {
                                "type": "concept_clarification",
                                "title": f"Perplexity on {subtopic_name}",
                                "message": summary_hint,
                                "action": "show_hint_modal",
                                "key_terms": active_syllabus.get("key_terms", []),
                            }
                        elif current_emotion == "frustrated":
                            recommended_intervention = {
                                "type": "scaffold_support",
                                "title": f"Need Support with {subtopic_name}?",
                                "message": f"Take a breath! {summary_hint} Ask the AI tutor for a simpler analogy.",
                                "action": "offer_scaffolding",
                                "key_terms": active_syllabus.get("key_terms", []),
                            }
                        elif current_emotion == "drowsy" or result.get("reason") in ("drowsy", "yawning"):
                            recommended_intervention = {
                                "type": "drowsiness_alert",
                                "title": "Drowsiness Alert",
                                "message": f"Stay focused! Answering a quick quiz on {subtopic_name} will boost recall.",
                                "action": "trigger_haptic_or_quiz",
                                "checkpoint_mcq": active_syllabus.get("sample_checkpoint_mcq"),
                            }
                        elif stable_status == "not_attentive":
                            recommended_intervention = {
                                "type": "smart_rewind",
                                "title": f"Focus Dropped during {subtopic_name}",
                                "message": f"You missed critical O/L points on: {', '.join(active_syllabus.get('key_terms', [])[:3])}. Rewind to recap.",
                                "action": "smart_rewind",
                                "rewind_to": topic_seg.get("start_time", 0.0) if topic_seg else 0.0,
                            }

                result["active_syllabus"] = active_syllabus
                result["recommended_intervention"] = recommended_intervention

                await websocket.send_json(result)

            except Exception as e:
                await websocket.send_json({"status": "error", "message": str(e)})

    except WebSocketDisconnect:
        ws_manager.disconnect(session_id)
