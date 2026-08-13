# API Documentation

## Shared
- `POST /api/auth/signup`
- `POST /api/auth/login`

## Component 01: Attention Monitoring
- `POST /api/videos/upload`
- `GET /api/videos`
- `GET /api/videos/{video_id}`
- `GET /api/transcripts/{video_id}`
- `POST /api/attention/log`
- `GET /api/attention/history/{user_id}`
- `GET /api/missed-segments/{user_id}`
- `POST /api/missed-segments`
- `WS /ws/attention/{session_id}`

## Component 02: Knowledge Graph Question System
- `GET /api/knowledge-graph`
- `GET /api/popup-question`
- `POST /api/submit-popup-answer`
- `GET /api/student-popup-answers/{student_id}`

## Component 03: Adaptive Chatbot
- `POST /api/chatbot/ask`
- `POST /api/chatbot/micro-challenge`
- `POST /api/chatbot/check-challenge`
- `GET /api/chatbot/history/{student_id}`
- `DELETE /api/chatbot/history/{student_id}`
- `GET /api/chatbot/topics`
- `GET /api/chatbot/lesson-summary/{topic_id}`
- `GET /api/reinforcement/login-quiz/{student_id}`
- `POST /api/reinforcement/submit-quiz`
- `POST /api/concept/reentry-check`
- `POST /api/repeated-query/check`
- `GET /api/teacher/repeated-query-alerts`
- `GET /api/analytics/student/{student_id}`
- `GET /api/analytics/topic/{topic_id}`
- `GET /api/analytics/teacher-dashboard`
- `GET /api/analytics/download-report`

### `POST /api/chatbot/ask`

Request body:

```json
{
  "studentId": "student_001",
  "question": "Define database 2 marks",
  "selectedMode": "exam",
  "currentLearningState": "understanding",
  "currentTopic": "databases"
}
```

Response highlights:

- `answer`
- `mode`
- `intent`
- `topic`
- `prerequisites`
- `sourceType`: `LLM` or `LOCAL_DATASET`
- `fallbackReason`: safe internal reason code only when local fallback is used
- `confidence`

## Component 04: Sign Avatar Lecture Generator
- `POST /api/sign-avatar/generate`
- `POST /api/sign-avatar/generate-sequence`
- `GET /api/sign-avatar/gestures`
- `GET /api/sign-avatar/history/{student_id}`
- `DELETE /api/sign-avatar/history/{student_id}`
- `POST /api/sign-avatar/missed-segment`
- `POST /api/sign-lecture/generate`
- `GET /api/sign-lecture/list/{teacher_id}`
- `GET /api/sign-lecture/{lecture_id}`
- `POST /api/sign-lecture/save`
- `DELETE /api/sign-lecture/{lecture_id}`
- `GET /api/signs/labels`
- `GET /api/signs/status`
- `POST /api/signs/train`
- `POST /api/signs/predict`
- `GET /api/signs/model-info`

## Component 05: Smart Wristband IoT
- `POST /api/wristband/config`
- `GET /api/wristband/config/{student_id}`
- `POST /api/wristband/test`
- `POST /api/wristband/notify`
- `GET /api/wristband/history/{student_id}`
- `DELETE /api/wristband/history/{student_id}`
- `GET /api/wristband/device/{student_id}`
