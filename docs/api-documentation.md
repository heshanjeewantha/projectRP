# SignLearn AI — Comprehensive API Documentation

## Shared & Authentication
- `POST /api/auth/signup` — Student & Teacher registration
- `POST /api/auth/login` — Authentication token issuing

---

## Component 01: Attention Monitoring
- `WS /ws/attention/{session_id}` — Real-time frame streaming, MediaPipe + YOLO telemetry computation, and HUD status feed
- `POST /api/videos/upload` — Video lesson and transcript upload
- `GET /api/videos` — List of available video lessons
- `GET /api/videos/{video_id}` — Retrieve video metadata and stream URL
- `GET /api/transcripts/{video_id}` — Synchronized subtitle and transcript segments
- `POST /api/attention/log` — Real-time attention score logging
- `POST /api/attention/batch` — Bulk upload of telemetry sessions
- `GET /api/attention/history/{user_id}` — Historical attention sessions
- `GET /api/missed-segments/{user_id}` — Missed lesson segments list

---

## Component 02: Knowledge Graph Question System
- `GET /api/knowledge-graph` — Retrieve full O/L ICT syllabus graph hierarchy
- `GET /api/knowledge-graph/concept/{concept_id}` — Retrieve concept node and prerequisite links
- `GET /api/knowledge-graph/lesson/{lesson_id}/question` — Dynamic graph-weighted question for playback second
- `GET /api/knowledge-graph/lesson/{lesson_id}/timeline` — Timeline checkpoints and concept windows
- `POST /api/knowledge-graph/answer` — Submit student answer and update mastery score
- `GET /api/knowledge-graph/diagram/{concept_id}` — Concept visual SVG diagram data

---

## Component 03: Adaptive Chatbot & Knowledge Growth
- `POST /api/chatbot/chat` — Core adaptive chatbot query (supports EARA, explain modes, and LLM/local dataset fallback)
- `GET /api/chatbot/attention-recommendations/{student_id}` — Low-attention weak-spot lesson concept suggestions
- `GET /api/chatbot/short-notes/{topic_id}` — Instant high-yield O/L ICT short notes (takeaways, analogies, exam traps)
- `GET /api/chatbot/knowledge-growth/{student_id}` — 7-day progress trend, mastery scores, and attention correlation
- `GET /api/chatbot/topics` — List of all O/L ICT syllabus topics
- `POST /api/chatbot/challenge/check` — Evaluate prerequisite micro-challenge answer
- `GET /api/chatbot/summary/{topic_id}` — Topic summary drawer preview
- `GET /api/chatbot/history/{student_id}` — Student chat conversation history
- `DELETE /api/chatbot/history/{student_id}` — Clear chat conversation history
- `GET /api/chatbot/analytics/teacher` — Teacher analytics dashboard metrics
- `GET /api/chatbot/analytics/report/pdf` — Downloadable PDF analytics report

---

## Component 04: Sign Avatar Lecture Generator
- `POST /api/sign-avatar/generate` — Text to sign gloss and landmark animation sequence
- `GET /api/sign-avatar/gestures` — Gesture library dictionary
- `POST /api/sign-lecture/generate` — Full lesson script to sign lecture pipeline
- `GET /api/sign-lecture/list/{teacher_id}` — Teacher saved sign lectures
- `GET /api/sign-lecture/{lecture_id}` — Retrieve saved sign lecture sequence
- `POST /api/sign-lecture/save` — Save generated sign lecture to database
- `DELETE /api/sign-lecture/{lecture_id}` — Delete sign lecture

---

## Component 05: Smart Wristband IoT & Sign Course
- `GET /api/wristband/device/{student_id}` — Connected BLE wristband hardware status
- `GET /api/wristband/config/{student_id}` — Student haptic vibration pattern presets
- `POST /api/wristband/config` — Save vibration intensity, duration, and OLED messages
- `POST /api/wristband/test` — Dispatch test vibration notification to wristband
- `GET /api/wristband/history/{student_id}` — Wristband alert dispatch logs
- `DELETE /api/wristband/history/{student_id}` — Clear wristband event logs
- `GET /api/sign-course/modules` — Syllabus sign language course units and keywords
- `GET /api/sign-course/progress/{student_id}` — Student sign course completion status and badges
- `POST /api/sign-course/progress` — Update keyword pass status and award certificate
