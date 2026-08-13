# Component 3: Advanced Emotion-Aware Adaptive Learning Chatbot with Reinforcement and Analytics

## Overview
This component upgrades the existing SignLearn AI chatbot into a broader adaptive learning support system for O/L ICT.

It now combines:
- EARA response adaptation
- learning mode and exam mode detection
- backend LLM answers with automatic local dataset fallback
- optional prerequisite micro-challenges
- lesson summary support
- forgetting-curve login quizzes
- concept re-entry checks
- repeated query alerts for teachers
- understanding analytics and downloadable reports

This module is integrated into the existing React frontend, FastAPI backend, MongoDB database, authentication flow, and global floating chatbot widget.

## AI / ML Model Type Used
This chatbot can now call a hosted LLM API from the backend when configured, while still keeping a full local dataset fallback path for offline or failure scenarios.

Instead it uses:
- `Intent detection`
  - type: keyword-based NLP classifier
- `EARA`
  - type: rule-based adaptive response engine
- `LLM answer generation`
  - type: backend-only API call with timeout, one retry, and safe fallback
- `Forgetting curve reinforcement`
  - type: time-based heuristic model
- `Repeated query detection`
  - type: similarity and session-history heuristic
- `Understanding score`
  - type: weighted analytics formula

So Component 3 is best described as a hybrid adaptive learning engine: LLM-assisted when available, and rule-based plus dataset-grounded when the API is unavailable.

## Frontend
Main student interfaces:
- `frontend/src/pages/ChatbotPage.jsx`
- `frontend/src/components/FloatingChatbot.jsx`
- `frontend/src/components/Chatbot/LoginQuizModal.jsx`
- `frontend/src/pages/LessonSummaryPage.jsx`
- `frontend/src/pages/HomePage.jsx`

Main teacher/admin interfaces:
- `frontend/src/pages/TeacherAnalyticsDashboard.jsx`
- `frontend/src/pages/RepeatedQueryAlertsPage.jsx`
- `frontend/src/pages/AdminDashboardPage.jsx`

Shared API client:
- `frontend/src/api/chatbotApi.js`

### Student UI features
- adaptive chat area
- mode badge: `Learning` / `Exam`
- learning-state badge
- optional micro-challenge flow
- summary preview popup
- summary page navigation
- compressed exam-style answers
- login quiz modal on student home page
- floating chatbot access on all pages

### Teacher UI features
- topic-wise understanding bars
- progress-over-time chart
- learning-state distribution
- weak student table
- repeated query alert list
- downloadable PDF and CSV reports

## Backend
Main backend files:
- `backend/models/chatbot.py`
- `backend/services/chatbot_service.py`
- `backend/routes/chatbot_routes.py`
- `backend/routes/chatbot_analytics_routes.py`
- `backend/data/ol_ict_chatbot_syllabus.json`

### MongoDB collections
- `chatbotMessages`
- `chatbotSessions`
- `ictSyllabusTopics`
- `studentLearningStates`
- `microChallenges`
- `microChallengeAttempts`
- `lessonSummaries`
- `learnedTopics`
- `loginQuizAttempts`
- `repeatedQueryAlerts`
- `conceptReEntryLogs`
- `studentUnderstandingScores`
- `teacherAnalyticsReports`

## EARA Model
EARA means Emotion-Aware Response Adaptation.

The chatbot builds its answer style using:
- student question
- detected intent
- learning mode or exam mode
- current learning state
- current topic
- prerequisite topics

Function:
- `generateEARAPrompt(question, intent, learningState, topic, prerequisites)`

### Learning-state behavior
- `not_understanding`: simple step-by-step explanation
- `bored`: more engaging explanation with examples
- `distracted`: short refocus answer with key points
- `understanding`: normal explanation

## Intent Detection and Exam Mode
The chatbot checks question keywords to detect whether the student is likely asking for a lesson explanation or an exam-style answer.

### Learning intent examples
- `explain`
- `what is`
- `how`
- `why`
- `example`

### Exam intent examples
- `define`
- `2 marks`
- `short answer`
- `exam`
- `past paper`
- `MCQ`
- `structured question`

### Exam-mode behavior
When exam mode is selected or detected:
- answers are shorter
- long explanation is reduced
- keywords are emphasized
- marks-style guidance is included

## Micro-Challenge Flow
Before some learning-mode answers, the chatbot can offer:

`Do you want to try a quick challenge before the answer?`

Options:
- `Try Challenge`
- `Skip & Show Answer`

### If the student tries the challenge
1. A simple prerequisite question is shown.
2. The answer is checked through the backend.
3. If the answer is wrong:
   - the system shows revision feedback
   - the student can preview or open the lesson summary
4. The student can still continue to the full answer.

This keeps the challenge optional and non-blocking.

## Lesson Summary Support
The lesson summary feature links chatbot difficulty to quick revision material.

Summary route:
- `GET /api/chatbot/lesson-summary/{topicId}`

Student page:
- `/lesson-summary/:topicId`

Each summary includes:
- topic name
- short summary
- key points
- prerequisite topics
- sample questions
- exam questions

## Forgetting-Curve Login Quiz
When a student visits the home page after login, the system can show a short revision quiz.

### Review priority logic
- learned today: no quiz
- learned 2-3 days ago: low priority
- learned 4-7 days ago: medium priority
- learned more than 7 days ago: high priority

### Quiz flow
1. Backend checks `learnedTopics`
2. Relevant revision questions are generated
3. Student can submit or skip
4. Score updates reinforcement data
5. Low score triggers revision recommendation

Endpoints:
- `GET /api/reinforcement/login-quiz/{studentId}`
- `POST /api/reinforcement/submit-quiz`

## Dynamic Difficulty Escalation
The chatbot adjusts follow-up difficulty using prior performance.

Difficulty levels:
- Level 1: basic definition
- Level 2: explanation
- Level 3: comparison
- Level 4: application question
- Level 5: exam-style problem

If the student shows stronger performance, the chatbot returns a harder suggested next prompt.

## Concept Re-Entry Detection
When the student returns to a topic after a long time, the backend can respond with a quick refresh.

Endpoint:
- `POST /api/concept/reentry-check`

### Returned refresh package
- short reminder message
- 2 to 3 key points
- prerequisite reminder

This is also reflected inside chatbot answers through `conceptReEntry` and `conceptRefreshPoints`.

## Repeated Query Alert Algorithm
The backend checks whether similar questions were asked multiple times in recent sessions.

Factors used:
- same student
- same or very similar keywords
- same topic
- recent history

If the count reaches repeated difficulty level:
- a teacher alert is created
- the topic can be recommended for revision
- understanding score is reduced through a penalty

Endpoints:
- `POST /api/repeated-query/check`
- `GET /api/teacher/repeated-query-alerts`

Alert includes:
- student id
- student name
- topic
- repeated question count
- example questions
- status

## Understanding Score Formula
The system stores topic-wise understanding values using:

`understandingScore = quizScore * 0.4 + microChallengeScore * 0.3 + chatbotConfidence * 0.2 - repeatedQueryPenalty * 0.1`

### Score inputs
- `quizScore`: login quiz performance
- `microChallengeScore`: micro-challenge accuracy
- `chatbotConfidence`: estimated from recent learning-state trend
- `repeatedQueryPenalty`: penalty based on repeated concept difficulty

Stored in:
- `studentUnderstandingScores`

## Teacher Analytics Dashboard
Teacher analytics route:
- `/admin/analytics`

Repeated alerts route:
- `/admin/repeated-alerts`

Backend dashboard endpoint:
- `GET /api/analytics/teacher-dashboard`

### Dashboard sections
- topic-wise understanding bar chart
- progress line chart
- learning-state distribution
- weak student table
- micro-challenge performance
- quiz result overview
- repeated query alert list
- recommended revision topics

## Downloadable Reports
Endpoint:
- `GET /api/analytics/download-report`

Supported formats:
- `pdf`
- `csv`

The backend generates:
- CSV reports for spreadsheet-style review
- lightweight PDF reports for printable dashboard snapshots

## API Summary
### Chatbot
- `POST /api/chatbot/ask`
- `POST /api/chatbot/micro-challenge`
- `POST /api/chatbot/check-challenge`
- `GET /api/chatbot/history/{studentId}`
- `DELETE /api/chatbot/history/{studentId}`
- `GET /api/chatbot/lesson-summary/{topicId}`

### Reinforcement
- `GET /api/reinforcement/login-quiz/{studentId}`
- `POST /api/reinforcement/submit-quiz`

### Concept Re-entry
- `POST /api/concept/reentry-check`

### Repeated Query
- `POST /api/repeated-query/check`
- `GET /api/teacher/repeated-query-alerts`

### Analytics
- `GET /api/analytics/student/{studentId}`
- `GET /api/analytics/topic/{topicId}`
- `GET /api/analytics/teacher-dashboard`
- `GET /api/analytics/download-report`

## Dataset
The chatbot syllabus dataset now includes richer O/L ICT topic data:
- `topicId`
- `topicName`
- `description`
- `summary`
- `subtopics`
- `keyPoints`
- `prerequisites`
- `keywords`
- `sampleQuestions`
- `examQuestions`
- `microChallenges`

Included topics:
- Computer System
- Data and Information
- Operating Systems
- Word Processing
- Spreadsheets
- Databases
- DBMS
- Normalization
- Internet and Email
- Networking
- Programming Basics
- Flowcharts
- Cyber Security

## How to Test
### Student flow
1. Log in as the student demo user.
2. On the home page, check whether the login quiz appears.
3. Open `/chatbot`.
4. Ask a learning question such as `Explain database`.
5. Try or skip the micro-challenge.
6. If the challenge is wrong, open the summary preview or full summary page.
7. Ask an exam-style question such as `Define database 2 marks`.
8. Confirm the answer becomes short and compressed.

### Teacher flow
1. Log in as the admin demo user.
2. Open `/admin/analytics`.
3. Review bar chart, progress chart, weak students, and revision topics.
4. Open `/admin/repeated-alerts`.
5. Download a PDF or CSV report from the analytics dashboard.

## Notes
- This upgrade stays inside the existing SignLearn AI project.
- Existing authentication, lesson pages, floating chatbot, and dashboard routes remain in place.
- The implementation uses the existing project stack and keeps the frontend theme consistent.
