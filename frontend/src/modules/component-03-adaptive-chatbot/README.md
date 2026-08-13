# Component 03: Adaptive Chatbot

## Purpose
Provides the adaptive chatbot, lesson summaries, repeated-query alerts, teacher analytics, and micro-challenge flow.

## Folder Explanation
- `pages/`: chatbot, lesson summary, analytics, and repeated alert screens
- `components/`: floating chatbot launcher and chatbot UI pieces
- `services/`: chatbot and analytics API clients
- `data/`, `utils/`, `docs/`: reserved for local references and notes

## APIs Used
- `/api/chatbot/*`
- `/api/reinforcement/*`
- `/api/concept/*`
- `/api/repeated-query/*`
- `/api/analytics/*`

## Database Models
- `chatbot`
- `lesson summaries`
- `micro challenges`
- `repeated query alerts`
- `understanding scores`

## ML/Dataset Files
- Uploaded chatbot lesson PDFs, short notes, question banks, and syllabus JSON are stored in backend component 03 datasets

## How To Test
Open `/chatbot`, ask questions in learning and exam mode, verify summary links, analytics pages, and repeated-question behavior.

## Related Frontend Pages
- `ChatbotPage.jsx`
- `LessonSummaryPage.jsx`
- `TeacherAnalyticsDashboard.jsx`
- `RepeatedQueryAlertsPage.jsx`

## Related Backend Routes
- component 03 backend routes under `backend/src/modules/component_03_adaptive_chatbot/routes`
