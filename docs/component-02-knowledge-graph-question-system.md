# Component 2: Knowledge Graph Driven Popup Question System for O/L ICT

## Overview

This component adds a concept-aware popup question engine for O/L ICT lessons. Instead of showing random questions, the backend maps the current playback time to a syllabus concept and uses a graph-based selector to choose a suitable unanswered question.

The implementation is designed to fit the existing project structure:

- Backend: FastAPI + Motor/MongoDB
- Frontend: React + Vite
- Collections: `knowledge_graph`, `popup_questions`, `lesson_timelines`, `student_popup_answers`

## AI / ML Model Type Used

This component does not use a CNN, LSTM, regression model, or graph neural network.

It uses:
- `Knowledge graph structure`
  - type: graph-based syllabus representation
- `GQSA`
  - type: weighted rule-based selection algorithm
- `Difficulty scoring`
  - type: heuristic scoring logic based on student accuracy and question difficulty

In short, Component 2 is an intelligent graph-and-rules subsystem, not a deep-learning model.

## Dataset

Two seed files were added under `backend/data/`:

- `ol_ict_knowledge_graph.json`
- `sample_lesson_timeline.json`
- `ol_ict_concept_diagrams.json`

### Knowledge Graph Structure

Each O/L ICT concept includes:

- `conceptId`
- `conceptName`
- `grade`
- `unit`
- `description`
- `prerequisites`
- `relatedConcepts`
- `difficultyLevel`
- `keywords`
- `questions`
- `diagram`

Each concept currently has 5 popup questions. Every question includes:

- `questionId`
- `questionText`
- `options`
- `correctAnswer`
- `explanation`
- `difficultyLevel`
- `conceptId`

Each concept diagram dataset includes:

- `diagramId`
- `title`
- `subtitle`
- `layout`
- `nodes`
- `edges`
- `summaryPoints`

### Included O/L ICT Concepts

- Introduction to ICT
- Computer Hardware
- Computer Software
- Operating Systems
- Data Representation
- Number Systems
- Logic Gates
- Computer Networks
- Internet and Email
- Cyber Security
- Word Processing
- Spreadsheets
- Databases
- Programming Basics
- Algorithms and Flowcharts

## How the Knowledge Graph Works

Each concept acts as a node in the graph.

- `prerequisites` connect a concept to earlier knowledge the student should understand first.
- `relatedConcepts` connect a concept to nearby ideas that support reinforcement and transfer.
- `questions` are attached directly to each concept, so the selector can pull questions from the right graph neighborhood.

When the backend receives `lessonId` and `currentTime`, it:

1. Finds the active lesson timeline.
2. Detects the current concept from the current playback second.
3. Loads the concept explanation diagram and summary.
4. Expands to prerequisite and related concepts.
5. Removes questions the student has already answered.
6. Scores the remaining questions and returns the highest-scoring one.

## GQSA: Graph-Based Question Selection Algorithm

### Core weights

- Current concept: `0.60`
- Prerequisite concepts: `0.25`
- Related concepts: `0.15`

### Additional scoring factors

The selector also adjusts scores using:

- Student previous answers
- Per-concept accuracy
- Overall popup accuracy
- Question difficulty

### Difficulty handling

The algorithm uses the student's past performance to decide whether easy, medium, or hard questions should be favored.

- Lower accuracy boosts easier questions.
- Mid-range accuracy slightly favors medium questions.
- Higher accuracy gives more weight to harder questions.

### Repeat prevention

Answered questions are excluded per student by checking `student_popup_answers.questionId`.

## Lesson Timeline Mapping

The sample lesson timeline is stored in `backend/data/sample_lesson_timeline.json`.

It includes:

- `lessonId`
- `videoTitle`
- `videoUrl`
- `timeline`

Each timeline segment includes:

- `startTime`
- `endTime`
- `conceptId`
- `conceptName`

### Default fallback behavior

If a specific `lessonId` does not yet have its own timeline document, the backend falls back to the default sample O/L ICT timeline. This keeps the popup workflow usable while more lesson-specific mappings are added later.

## MongoDB Collections

### `knowledge_graph`

Stores one document per concept, including concept metadata and the embedded question list from the seed dataset.

### `popup_questions`

Stores a flattened question collection for efficient selection queries.

### `lesson_timelines`

Stores lesson-to-concept time mappings. The default seeded document is `lesson_ol_ict_001`.

### `student_popup_answers`

Stores student popup answer history with:

- `studentId`
- `lessonId`
- `conceptId`
- `conceptName`
- `questionId`
- `questionText`
- `selectedAnswer`
- `correctAnswer`
- `isCorrect`
- `difficultyLevel`
- `explanation`
- `answeredAt`

## API Endpoints

### `GET /api/knowledge-graph`

Returns the full O/L ICT knowledge graph.

### `GET /api/popup-question?studentId=&lessonId=&currentTime=`

Returns one suitable popup question for the active concept window.

Notes:

- The response includes concept context and selection metadata.
- The live popup response does not expose the correct answer.

### `POST /api/submit-popup-answer`

Accepts:

```json
{
  "studentId": "student_demo_123",
  "lessonId": "lesson_ol_ict_001",
  "questionId": "intro_ict_q1",
  "selectedAnswer": "Information and Communication Technology"
}
```

The backend resolves the authoritative answer, computes `isCorrect`, and saves the answer record.

### `GET /api/student-popup-answers/{studentId}`

Returns the student's popup question history ordered by most recent answer first.

## Backend Integration Notes

The new backend files are:

- `backend/models/knowledge_graph.py`
- `backend/routes/knowledge_graph_routes.py`
- `backend/services/knowledge_graph_service.py`

`backend/main.py` now:

- seeds the dataset on startup
- registers the new router

## Frontend Integration Notes

The new frontend files are:

- `frontend/src/api/popupApi.js`
- `frontend/src/components/Popup/ConceptDiagramPanel.jsx`
- `frontend/src/components/Popup/KnowledgeQuestionPopup.jsx`

The student page now:

- polls the popup endpoint every 30 seconds while the video is playing
- pauses the video when a popup question is available
- shows a simple concept explainer diagram before the MCQ
- submits the selected answer
- shows correct or wrong feedback
- reveals the explanation after submission
- shows recent popup answer history in a chat-style layout

## UI Theme

The frontend theme was refreshed to a modern green-and-black learning dashboard style with:

- green accent gradients
- darker glass panels
- animated diagram cards
- chat-style history bubbles
- updated background atmosphere and motion

The existing missed-content popup remains in place and is not removed.

## Running the System

### Backend

From the `backend` folder:

```powershell
uvicorn main:app --reload
```

On startup, the backend will connect to MongoDB and upsert the O/L ICT dataset and sample lesson timeline.

### Frontend

From the `frontend` folder:

```powershell
npm install
npm run dev
```

The frontend expects the backend API at `http://localhost:8000`.

## Extending the Dataset Later

To add more O/L ICT content later:

1. Add a new concept block to `backend/data/ol_ict_knowledge_graph.json`.
2. Add at least one timeline segment that points to the new `conceptId`.
3. Restart the backend so the seed upsert refreshes MongoDB.

Because the collections are upserted by `conceptId`, `questionId`, and `lessonId`, the dataset can be expanded without rewriting the rest of the component.
