# Component 01: Attention Monitoring

## Purpose
Handles lesson video upload, transcript lookup, attention logging, missed segments, and live WebSocket-based attention monitoring.

## Folder Explanation
- `routes/`: video, transcript, attention, missed segment, and websocket endpoints
- `services/`: lesson and attention business logic
- `models/`: Pydantic request/response models
- `ml/`: MediaPipe-based attention and sign utilities
- `datasets/`, `utils/`, `docs/`: reserved for future assets and notes

## APIs Used
- `/api/videos`
- `/api/transcripts`
- `/api/attention`
- `/api/missed-segments`
- `/ws/attention/{session_id}`

## Database Models
- `videos`
- `transcripts`
- `attention_logs`
- `missed_segments`

## ML/Dataset Files
- `ml/attention_detector.py`
- `ml/hand_tracker.py`
- `ml/sign_classifier.py`

## How To Test
Upload a lesson video, open the lesson page, stream webcam frames, and verify saved logs in history and transcript responses.

## Related Frontend Pages
- `frontend/src/modules/component-01-attention-monitoring/pages/StudentView.jsx`
- `frontend/src/modules/component-01-attention-monitoring/pages/History.jsx`

## Related Backend Routes
- `attention_routes.py`
- `video_routes.py`
- `transcript_routes.py`
- `missed_segment_routes.py`
- `websocket_routes.py`
