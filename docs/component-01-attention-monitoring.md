# Component 01: Attention Monitoring

This component owns lesson playback, webcam attention tracking, attention logs, transcripts, and missed segment history. Frontend files live in `frontend/src/modules/component-01-attention-monitoring`, and backend logic lives in `backend/src/modules/component_01_attention_monitoring`.

Core integrations:
- WebSocket attention stream at `/ws/attention/{session_id}`
- Video and transcript APIs for lesson playback
- Missed-popup and history support used by the student lesson screen

Key runtime dependencies:
- FastAPI
- Motor/MongoDB
- OpenCV
- MediaPipe
