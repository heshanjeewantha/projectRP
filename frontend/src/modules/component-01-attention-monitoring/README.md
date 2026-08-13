# Component 01: Attention Monitoring

## Purpose
Tracks learner attention during video lessons, captures webcam events, stores lesson progress, and shows attention-aware history in the student UI.

## Folder Explanation
- `pages/`: student lesson and history screens
- `components/`: webcam and video playback UI
- `hooks/`: real-time WebSocket attention listener
- `services/`: frontend API calls for videos, attention logs, and missed segments
- `assets/`, `utils/`, `docs/`: reserved for visuals, helpers, and notes

## APIs Used
- `GET/POST /api/videos`
- `GET /api/transcripts/{video_id}`
- `POST /api/attention/log`
- `GET /api/attention/history/{user_id}`
- `GET/POST /api/missed-segments`
- `WS /ws/attention/{session_id}`

## Database Models
- `video`
- `transcript`
- `attention`
- `missed_segment`

## ML/Dataset Files
- MediaPipe attention detector utilities in backend component 01
- Shared lesson video uploads from `backend/uploads`

## How To Test
Run the frontend, open `/lesson`, play a lesson, allow webcam access, and confirm attention status updates and history records appear.

## Related Frontend Pages
- `StudentView.jsx`
- `History.jsx`

## Related Backend Routes
- component 01 backend routes under `backend/src/modules/component_01_attention_monitoring/routes`
