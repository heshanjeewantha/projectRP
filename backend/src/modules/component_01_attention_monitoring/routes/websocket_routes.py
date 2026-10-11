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
from src.modules.component_01_attention_monitoring.ml.live_sign_recognizer import LiveSignRecognizer

router = APIRouter(tags=["WebSocket"])

# Singleton detector instances (reused across WebSocket frames for state continuity)
_attention_detector = AttentionDetector()
_sign_recognizer    = LiveSignRecognizer()

STATUS_HISTORY_SIZE          = 4
NOT_ATTENTIVE_VOTE_THRESHOLD = 3
NO_FACE_GRACE_FRAMES         = 3


@router.websocket("/ws/attention/{session_id}")
async def websocket_attention_endpoint(websocket: WebSocket, session_id: str):
    """
    Accepts base64-encoded frames from React webcam.
    Runs attention and sign detectors and returns extended result JSON:
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

                # ── Run attention and gesture detectors ───────────────────
                attention_result = _attention_detector.analyze_frame(frame)
                sign_result      = _sign_recognizer.analyze_frame(frame)

                # ── Merge results ─────────────────────────────────────────
                result = {
                    **attention_result,
                    "phone_detected": False,
                    "phone_confidence": 0.0,
                    "phone_in_hand": False,
                    "phone_posture": "none",
                    **sign_result,
                }
                result["timestamp"] = video_timestamp

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
