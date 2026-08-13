# Component 03: Adaptive Chatbot

## Purpose
Runs the adaptive chatbot, backend LLM integration with local fallback, uploaded lesson ingestion, micro-challenges, summaries, repeated-query alerts, and teacher analytics.

## Folder Explanation
- `routes/`: chatbot, reinforcement, re-entry, repeated-query, and analytics endpoints
- `services/`: adaptive response, summary, analytics, and dataset ingestion logic
- `models/`: chatbot request/response models
- `datasets/`: syllabus, lessons, short notes, and question banks
- `prompts/`, `intent/`, `analytics/`, `utils/`, `docs/`: reserved for prompt and scoring extensions

## APIs Used
- `/api/chatbot/*`
- `/api/reinforcement/*`
- `/api/concept/*`
- `/api/repeated-query/*`
- `/api/analytics/*`

## LLM Fallback Notes
- Configure `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, and `LLM_TIMEOUT_MS` in `backend/.env`.
- The chatbot tries the configured LLM first and falls back to the local O/L ICT dataset on timeout, quota, auth, server, network, or invalid-response failures.
- The frontend receives `sourceType`, `fallbackReason`, and `confidence` with each chatbot answer.

## Database Models
- `chatbotMessages`
- `chatbotSessions`
- `ictSyllabusTopics`
- `lessonSummaries`
- `microChallenges`
- `repeatedQueryAlerts`
- `studentUnderstandingScores`

## ML/Dataset Files
- `datasets/ol_ict_chatbot_syllabus.json`
- `datasets/Lessons/*`
- `datasets/Short Notes/*`
- `datasets/Lesson Questions/*`

## How To Test
Call the chatbot endpoints, verify topic loading from uploaded datasets, and open analytics or summary routes with seeded data.

## Related Frontend Pages
- `frontend/src/modules/component-03-adaptive-chatbot/pages/ChatbotPage.jsx`
- `frontend/src/modules/component-03-adaptive-chatbot/pages/LessonSummaryPage.jsx`
- `frontend/src/modules/component-03-adaptive-chatbot/pages/TeacherAnalyticsDashboard.jsx`
- `frontend/src/modules/component-03-adaptive-chatbot/pages/RepeatedQueryAlertsPage.jsx`

## Related Backend Routes
- `chatbot_routes.py`
- `chatbot_analytics_routes.py`
