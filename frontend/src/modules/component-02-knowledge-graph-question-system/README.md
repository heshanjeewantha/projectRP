# Component 02: Knowledge Graph Question System

## Purpose
Shows popup questions based on the current lesson concept and the O/L ICT knowledge graph.

## Folder Explanation
- `components/`: popup UI for concept questions
- `services/`: frontend API access for knowledge graph and popup answers
- `data/`, `utils/`, `docs/`: reserved for local references and documentation

## APIs Used
- `GET /api/knowledge-graph`
- `GET /api/popup-question`
- `POST /api/submit-popup-answer`
- `GET /api/student-popup-answers/{student_id}`

## Database Models
- `knowledge_graph`
- `popup_questions`
- `lesson_timelines`
- `student_popup_answers`

## ML/Dataset Files
- Knowledge graph JSON and lesson timeline seed live in backend component 02 datasets and seed folders

## How To Test
Start a lesson, wait for a popup trigger, answer a question, and confirm the response history updates.

## Related Frontend Pages
- Popup components used from the lesson page in component 01

## Related Backend Routes
- component 02 backend routes under `backend/src/modules/component_02_knowledge_graph_question_system/routes`
