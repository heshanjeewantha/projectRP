# SignLearn AI

SignLearn AI is a full-stack adaptive learning platform for O/L ICT. It combines attention monitoring, knowledge-graph question prompts, an adaptive chatbot, a sign-avatar lecture workflow, and a smart wristband integration in one project.

## Main Components

1. `component_01_attention_monitoring`
   Detects attention state, missed segments, and playback-related learner signals.
2. `component_02_knowledge_graph_question_system`
   Uses concept relationships and popup questions for guided learning.
3. `component_03_adaptive_chatbot`
   Answers O/L ICT questions using lesson datasets, short notes, and lesson questions.
4. `component_04_sign_avatar_lecture_generator`
   Converts text to gloss-like sign sequences and renders the animated avatar.
5. `component_05_smart_wristband_iot`
   Sends haptic and OLED alerts to the ESP32-based wristband workflow.

## Tech Stack

- Frontend: React, Vite, React Router, Zustand, Axios
- Backend: FastAPI, Uvicorn, Pydantic, Motor, PyMongo
- Database: MongoDB
- CV / ML libraries: MediaPipe, OpenCV, NumPy, TensorFlow, Torch, scikit-learn
- IoT: ESP32 / Arduino firmware

## Project Structure

```text
projectRP/
  backend/
    src/
      common/
      modules/
  frontend/
    src/
      modules/
  docs/
  iot/
  uploads/
```

## Setup

### 1. Clone and install

Frontend:

```powershell
cd frontend
npm install
```

Backend:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Variables

Backend: create `backend/.env` from `backend/.env.example`

```env
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=sign_language_system
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=500
LLM_PROVIDER=openai
LLM_API_KEY=your_api_key_here
LLM_MODEL=gpt-4.1-mini
LLM_TIMEOUT_MS=10000
```

Frontend: create `frontend/.env` from `frontend/.env.example`

```env
VITE_API_ROOT=/api
```

## Run Commands

Frontend:

```powershell
cd frontend
npm run dev
```

Backend:

```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Frontend default URL:

```text
http://127.0.0.1:5173
```

Backend default URL:

```text
http://127.0.0.1:8000
```

## GitHub Upload Notes

- Do not commit `backend/.env` or `frontend/.env`
- Do not commit `venv`, `node_modules`, `dist`, `build`, `__pycache__`, or runtime upload files
- Do not commit logs that may contain local connection details
- Large trained models and binary artifacts are ignored by `.gitignore`

## Datasets and Large Files

- Runtime-uploaded videos under `backend/uploads/` are intentionally ignored
- Python virtual environment files are intentionally ignored
- If you later add large private datasets or trained model binaries, keep only a sample in GitHub and document the download process here

## API Notes

- Backend root: `GET /`
- Chatbot APIs live under `/api/chatbot`
- Sign avatar APIs live under `/api/sign-avatar`
- Lecture-generation APIs live under `/api/sign-lecture`

## Chatbot LLM Fallback

Component 03 now supports two answer sources inside the existing chatbot flow:

- `LLM` mode: the backend sends the EARA prompt, topic context, prerequisite reminders, and lesson summary hints to the configured LLM provider.
- `LOCAL_DATASET` fallback: if the provider is not configured, times out, returns quota/auth/server errors, or produces an invalid reply, the chatbot immediately answers from the local O/L ICT dataset instead.

### Add the LLM API key

1. Copy `backend/.env.example` to `backend/.env`.
2. Set `LLM_PROVIDER` to `openai`, `gemini`, or `openrouter`.
3. Add `LLM_API_KEY`, `LLM_MODEL`, and optionally change `LLM_TIMEOUT_MS`.
4. Restart the FastAPI backend.

### How fallback answers are generated

- Topic detection uses the selected topic, question keywords, lesson summaries, and dataset keywords.
- Intent detection switches between learning mode and exam mode.
- Prerequisites are pulled from the chatbot dataset and knowledge graph labels.
- Exam fallback answers stay short and marks-friendly.
- Learning fallback answers add simple explanations, examples, and prerequisite reminders.
- Distracted, bored, and not-understanding states still use EARA-style adaptation.

### How to test API failure

- Remove `LLM_API_KEY` from `backend/.env` and ask a chatbot question.
- Set a very small `LLM_TIMEOUT_MS` to simulate a timeout path.
- Disconnect the network or use an invalid provider/model to confirm the local dataset fallback path.
- In the UI, the chatbot should show `Dataset Fallback Answer` and the note `Answered using local lesson dataset.`

### Add new ICT topics

Update `backend/src/modules/component_03_adaptive_chatbot/datasets/ol_ict_chatbot_syllabus.json` with:

- `topicId`
- `topicName`
- `summary`
- `keyPoints`
- `prerequisites`
- `examQuestions`
- `simpleDefinitions`
- `examples`
- `microChallenges`

## Development Notes

- The backend reads configuration from `backend/.env`
- The frontend can use `VITE_API_ROOT` to target a deployed backend
- MongoDB credentials should always stay in local env files or GitHub Secrets, never in source code
