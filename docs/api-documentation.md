# SignLearn AI — Comprehensive API Documentation

## Shared & Authentication
- `POST /api/auth/signup` — Student & Teacher registration
- `POST /api/auth/login` — Authentication token issuing

---

## Component 01: Attention Monitoring & Behavioral Telemetry
- `WS /ws/attention/{session_id}` — Real-time frame streaming, MediaPipe FaceMesh/Pose telemetry computation (EAR, MAR, PERCLOS, Gaze), and HUD status feed
- `POST /api/videos/upload` — Video lesson and transcript upload
- `GET /api/videos` — List of available video lessons
- `GET /api/videos/{video_id}` — Retrieve video metadata and stream URL
- `GET /api/transcripts/{video_id}` — Synchronized subtitle and transcript segments
- `POST /api/attention/log` — Real-time attention score logging
- `POST /api/attention/batch` — Bulk upload of telemetry sessions
- `GET /api/attention/history/{user_id}` — Historical attention sessions for student
- `GET /api/missed-segments/{user_id}` — Missed lesson segments list based on attention drops
- `GET /api/attention/admin/reports/{user_id}` — Full student attention and behavioral evaluation report
- `GET /api/attention/admin/users` — List of all enrolled students with aggregate engagement scores

---

## Component 02: Knowledge Graph Question System
- `GET /api/knowledge-graph` — Retrieve full O/L ICT syllabus graph hierarchy
- `GET /api/knowledge-graph/concept/{concept_id}` — Retrieve concept node and prerequisite links
- `GET /api/knowledge-graph/lesson/{lesson_id}/question` — Dynamic graph-weighted question (GQSA: 60% active, 25% prerequisite, 15% related) for playback second
- `GET /api/knowledge-graph/lesson/{lesson_id}/timeline` — Timeline checkpoints and concept windows
- `POST /api/knowledge-graph/answer` — Submit student answer, calculate score, and update mastery
- `GET /api/knowledge-graph/diagram/{concept_id}` — Retrieve concept visual SVG/interactive diagram data

---

## Component 03: Emotion-Aware Adaptive Chatbot & Knowledge Growth
- `POST /api/chatbot/chat` — Core adaptive chatbot query (supports EARA, explain modes, and LLM/local dataset fallback)
- `GET /api/chatbot/attention-recommendations/{student_id}` — Low-attention weak-spot lesson concept suggestions
- `GET /api/chatbot/short-notes/{topic_id}` — Instant high-yield O/L ICT short notes (takeaways, analogies, exam traps, mnemonics)
- `GET /api/chatbot/knowledge-growth/{student_id}` — 7-day progress trend, mastery scores, domain breakdown, and attention correlation
- `GET /api/chatbot/topics` — List of all O/L ICT syllabus topics
- `POST /api/chatbot/challenge/check` — Evaluate prerequisite micro-challenge answer
- `GET /api/chatbot/summary/{topic_id}` — Topic summary drawer preview
- `GET /api/chatbot/history/{student_id}` — Student chat conversation history
- `DELETE /api/chatbot/history/{student_id}` — Clear chat conversation history
- `GET /api/chatbot/analytics/teacher` — Teacher analytics dashboard metrics (topics struggling, student engagement distribution)
- `GET /api/chatbot/analytics/report/pdf` — Downloadable PDF analytics report
- `GET /api/chatbot/repeated-alerts` — Alerts for students repeatedly struggling with the same concept
- `GET /api/chatbot/past-paper/questions` — Retrieve past paper question bank with marking criteria
- `POST /api/chatbot/past-paper/evaluate` — AI auto-evaluation of open-ended answer against official marking scheme
- `GET /api/chatbot/flashcards/{topic_id}` — Retrieve interactive 3D flashcard decks
- `POST /api/chatbot/flashcards/review` — Log flashcard rating (SM-2 spaced repetition interval calculator)
- `POST /api/chatbot/mock-exam/start` — Generate timed 40-question O/L ICT mock exam paper
- `POST /api/chatbot/mock-exam/submit` — Submit mock exam answers and receive grade analysis
- `GET /api/chatbot/login-quiz` — 3-question daily diagnostic warm-up quiz
- `POST /api/chatbot/login-quiz/submit` — Submit diagnostic quiz answers and tailor daily review

---

## Component 04: Sign Avatar Lecture Generator
- `POST /api/sign-avatar/generate` — Text to sign gloss and 21-point landmark animation sequence
- `GET /api/sign-avatar/gestures` — Gesture library dictionary
- `POST /api/sign-lecture/generate` — Full lesson script to sign lecture pipeline
- `GET /api/sign-lecture/list/{teacher_id}` — Teacher saved sign lectures
- `GET /api/sign-lecture/{lecture_id}` — Retrieve saved sign lecture sequence
- `POST /api/sign-lecture/save` — Save generated sign lecture to database
- `DELETE /api/sign-lecture/{lecture_id}` — Delete sign lecture

---

## Component 05: Smart Wristband IoT & Sign Practice Arena
- `GET /api/wristband/device/{student_id}` — Connected BLE wristband hardware status
- `GET /api/wristband/config/{student_id}` — Student haptic vibration pattern presets
- `POST /api/wristband/config` — Save vibration intensity, duration, and OLED messages
- `POST /api/wristband/test` — Dispatch test vibration notification to wristband
- `GET /api/wristband/history/{student_id}` — Wristband alert dispatch logs
- `DELETE /api/wristband/history/{student_id}` — Clear wristband event logs
- `GET /api/sign-course/modules` — Syllabus sign language course units and keywords
- `GET /api/sign-course/progress/{student_id}` — Student sign course completion status and badges
- `POST /api/sign-course/progress` — Update keyword pass status and issue verified completion certificate
