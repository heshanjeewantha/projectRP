# Component 02: Knowledge Graph Question System

## Purpose
Seeds the O/L ICT knowledge graph, resolves lesson timelines, and serves concept-aware popup questions and answer history.

## Folder Explanation
- `routes/`: knowledge graph and popup endpoints
- `services/`: graph loading, scoring, and answer persistence
- `models/`: popup and graph response models
- `datasets/`: graph and concept diagram JSON
- `seed/`: lesson timeline seed data
- `graph/`, `utils/`, `docs/`: reserved for future extensions

## APIs Used
- `/api/knowledge-graph`
- `/api/popup-question`
- `/api/submit-popup-answer`
- `/api/student-popup-answers/{student_id}`

## Database Models
- `knowledge_graph`
- `popup_questions`
- `lesson_timelines`
- `student_popup_answers`

## ML/Dataset Files
- `datasets/ol_ict_knowledge_graph.json`
- `datasets/ol_ict_concept_diagrams.json`
- `seed/sample_lesson_timeline.json`

## How To Test
Seed the backend, request the knowledge graph, request popup questions with a lesson time, and submit answers for a student.

## Related Frontend Pages
- Popup flows are consumed from component 01 lesson UI

## Related Backend Routes
- `knowledge_graph_routes.py`
