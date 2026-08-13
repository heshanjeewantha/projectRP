"""
routes/websocket_routes.py
WebSocket endpoints for real-time attention analysis.
"""
from collections import deque
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import base64
import cv2
import numpy as np

from src.common.utils.websocket_manager import ws_manager
from src.modules.component_01_attention_monitoring.ml.attention_detector import (
    AttentionDetector,
)

router = APIRouter(tags=["WebSocket"])

# Instance of the MediaPipe detector (reused across WS frames)
detector = AttentionDetector()
STATUS_HISTORY_SIZE = 4
NOT_ATTENTIVE_VOTE_THRESHOLD = 3
NO_FACE_GRACE_FRAMES = 3


@router.websocket("/ws/attention/{session_id}")
async def websocket_attention_endpoint(websocket: WebSocket, session_id: str):
    """
    Accepts base64-encoded frames from React webcam, runs MediaPipe attention
    detection, and returns the result (attentive/not_attentive) instantly.
    """
    await ws_manager.connect(session_id, websocket)
    status_history: deque[str] = deque(maxlen=STATUS_HISTORY_SIZE)
    no_face_streak = 0
    stable_status = "attentive"
    try:
        while True:
            # Receive base64 frame from frontend
            data = await websocket.receive_json()
            frame_base64 = data.get("frame")
            video_timestamp = data.get("timestamp", 0.0)

            if frame_base64:
                try:
                    # Decode base64 to OpenCV image
                    img_data = base64.b64decode(frame_base64.split(",")[1])
                    np_arr = np.frombuffer(img_data, np.uint8)
                    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

                    # Run ML analysis
                    result = detector.analyze_frame(frame)
                    result["timestamp"] = video_timestamp

                    if result.get("reason") == "no_face":
                        no_face_streak += 1
                    else:
                        no_face_streak = 0

                    observed_status = result.get("status", stable_status)
                    status_history.append(observed_status)

                    not_attentive_votes = sum(
                        1 for status in status_history if status == "not_attentive"
                    )
                    should_mark_distracted = (
                        no_face_streak >= NO_FACE_GRACE_FRAMES
                        or not_attentive_votes >= NOT_ATTENTIVE_VOTE_THRESHOLD
                    )
                    stable_status = "not_attentive" if should_mark_distracted else "attentive"
                    result["status"] = stable_status

                    # Send back result
                    await websocket.send_json(result)

                except Exception as e:
                    await websocket.send_json({"status": "error", "message": str(e)})

    except WebSocketDisconnect:
        ws_manager.disconnect(session_id)
