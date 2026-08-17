"""
routes/websocket_routes.py
WebSocket endpoint for real-time attention analysis.

Runs all attention detectors per frame:
  1. AttentionDetector  → EAR, PERCLOS, MAR, head pose, gaze, blink rate, engagement
  2. PhoneDetector      → phone/cell phone detection
  3. LiveSignRecognizer → real-time sign language → text caption
"""
from collections import deque
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import base64
import cv2
import numpy as np

from src.common.utils.websocket_manager import ws_manager
from src.modules.component_01_attention_monitoring.ml.attention_detector import AttentionDetector
from src.modules.component_01_attention_monitoring.ml.phone_detector import PhoneDetector
from src.modules.component_01_attention_monitoring.ml.live_sign_recognizer import LiveSignRecognizer

router = APIRouter(tags=["WebSocket"])

# Singleton detector instances (reused across WebSocket frames for state continuity)
_attention_detector = AttentionDetector()
_phone_detector     = PhoneDetector()
_sign_recognizer    = LiveSignRecognizer()

STATUS_HISTORY_SIZE          = 4
NOT_ATTENTIVE_VOTE_THRESHOLD = 3
NO_FACE_GRACE_FRAMES         = 3


@router.websocket("/ws/attention/{session_id}")
async def websocket_attention_endpoint(websocket: WebSocket, session_id: str):
    """
    Accepts base64-encoded frames from React webcam.
    Runs all detectors and returns extended result JSON:

    {
      "status": "attentive" | "not_attentive",
      "reason": "ok" | "eyes_closed" | "drowsy" | "yawning" | "head_turned" |
                "phone_detected" | "no_face",
      "ear": float,
      "perclos": float,
      "drowsiness_score": float,
      "mar": float,
      "yawning": bool,
      "blink_rate": float,
      "gaze_direction": str,
      "engagement_score": int,
      "phone_detected": bool,
      "phone_confidence": float,
      "hand_detected": bool,
      "sign_text": str | null,
      "sign_confidence": float,
      "sign_explanation": str,
      "yaw": float,
      "pitch": float,
      "roll": float,
      "eye_open": bool,
      "head_pose_deviation": float,
      "timestamp": float
    }
    """
    await ws_manager.connect(session_id, websocket)
    status_history: deque[str] = deque(maxlen=STATUS_HISTORY_SIZE)
    no_face_streak = 0
    stable_status = "attentive"

    try:
        while True:
            data = await websocket.receive_json()
            frame_base64   = data.get("frame")
            video_timestamp = data.get("timestamp", 0.0)

            if not frame_base64:
                continue

            try:
                # Decode base64 → OpenCV image
                img_data = base64.b64decode(frame_base64.split(",")[1])
                np_arr   = np.frombuffer(img_data, np.uint8)
                frame    = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

                if frame is None:
                    continue

                # ── Run attention and phone detectors ──────────────────────
                attention_result = _attention_detector.analyze_frame(frame)
                phone_result     = _phone_detector.analyze_frame(frame)

                # ── Merge results ─────────────────────────────────────────
                result = {
                    **attention_result,
                    **phone_result,
                    "sign_text": None,
                    "sign_confidence": 0.0,
                    "sign_explanation": "",
                }
                result["timestamp"] = video_timestamp

                # ── Override reason/status for phone detection ───
                if phone_result.get("phone_detected"):
                    if result["reason"] == "ok":
                        result["reason"] = "phone_detected"
                        result["status"] = "not_attentive"
                    result["phone_in_hand"] = phone_result.get("phone_in_hand", False)
                    result["phone_posture"] = phone_result.get("phone_posture", "none")
                else:
                    result["phone_in_hand"] = False
                    result["phone_posture"] = "none"

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

                await websocket.send_json(result)

            except Exception as e:
                await websocket.send_json({"status": "error", "message": str(e)})

    except WebSocketDisconnect:
        ws_manager.disconnect(session_id)
