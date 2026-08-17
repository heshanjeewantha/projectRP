# SignLearn AI — Adaptive O/L ICT Learning Platform

**SignLearn AI** is an intelligent multimodal e-learning and sign language support platform designed for Sri Lankan G.C.E. Ordinary Level (O/L) Information and Communication Technology (ICT) education.

---

## 🏛️ Core Research Components

1. **Component 01: Real-Time Attention Monitoring & Telemetry**
   * Live webcam facial telemetry via MediaPipe FaceMesh & Pose (EAR, MAR, PERCLOS drowsiness tracking, Gaze Vectoring).
   * YOLOv8 smartphone and unauthorized distraction detection.
   * Real-time WebSocket streaming at `/ws/attention/{session_id}` with high-tech biometric HUD and video timeline attention heatmaps.

2. **Component 02: Knowledge Graph Driven Popup Question System**
   * Graph-based weighted question selection algorithm (**GQSA**: 60% active concept, 25% prerequisite, 15% related concepts).
   * Dynamic automated concept node and MCQ generator from video transcripts ([dynamic_question_generator.py](backend/src/modules/component_02_knowledge_graph_question_system/services/dynamic_question_generator.py)).
   * Interactive concept visual SVG diagrams and spaced repetition reinforcement.

3. **Component 03: Emotion-Aware Adaptive Chatbot (EARA) & Knowledge Growth**
   * Attention-aware lesson revision suggestions bridging low-attention timestamps from Component 1 to syllabus weak spots.
   * Instant High-Yield Short Notes Knowledge Bank with real-world analogies, O/L exam tips, and memory mnemonics.
   * Visual Knowledge Growth & Concept Mastery Matrix (domain progress bars, attention correlation index, 7-day trend).
   * Multi-style Explain Mode toggles (`Standard`, `Simple (ELI10)`, `Real-World Analogy`, `O/L Exam Focus`).
   * Hybrid backend engine: Online LLM with timeout, retry, and grounded local dataset fallback.

4. **Component 04: Sign Avatar Lecture Generator**
   * Text-to-sign gloss conversion and MediaPipe 21-point landmark hand-rig animation controller.
   * Full lesson script to sign lecture generator with segment jumping, replay, and JSON export.

5. **Component 05: Smart Haptic Wristband IoT & Sign Practice Arena**
   * ESP32 wearable haptic feedback (`SSD1306 OLED` + `ERM Vibration Motor`) over BLE/Serial with customizable alert presets.
   * Interactive Sign Language Course with side-by-side avatar demonstration and real-time student webcam pose evaluator ([CameraSignEvaluator.jsx](frontend/src/modules/component-05-smart-wristband-iot/components/SignCourse/CameraSignEvaluator.jsx)).
   * Automated module completion certificate generator.

---

## 💻 Tech Stack

* **Frontend**: React 19, Vite 6, TailwindCSS v4, Framer Motion, Lucide React, Zustand
* **Backend**: FastAPI, Uvicorn, Motor (Async MongoDB), Pydantic v2, OpenCV, MediaPipe, Ultralytics YOLOv8
* **Database**: MongoDB Atlas / Local MongoDB
* **IoT Hardware**: ESP32 Dev Module, SSD1306 I2C OLED (128x64), Coreless Vibration Motor

---

## 📋 Prerequisites

Before running the application, ensure you have:
* **Node.js**: `v18.0.0` or higher (Recommended: `v20+`)
* **Python**: `3.10` or `3.11` (64-bit)
* **MongoDB**: MongoDB Atlas URI or local MongoDB instance running on port `27017`
* **Webcam**: Standard USB or built-in laptop camera for attention tracking and sign evaluation

---

## 🚀 Step-by-Step Setup & Run Instructions

### 1. Clone & Open Repository
Open PowerShell or your terminal in the project root:
```powershell
cd g:\projectRP
```

---

### 2. Backend Setup & Execution

#### A. Create and Activate Python Virtual Environment
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
```

#### B. Install Python Dependencies
```powershell
pip install -r requirements.txt
```

#### C. Configure Backend `.env`
Create `backend/.env` (or verify existing configuration):
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.adxbwve.mongodb.net/?appName=Cluster0
DATABASE_NAME=sign_language_system
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=500

# LLM Configuration (Gemini / OpenAI / Ollama)
LLM_PROVIDER=gemini
LLM_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-flash-lite-latest
LLM_TIMEOUT_MS=15000
```

#### D. Start the FastAPI Backend Server
```powershell
# From the backend directory with virtual environment activated:
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
* Backend will be live at: **`http://localhost:8000`**
* Interactive Swagger API Docs: **`http://localhost:8000/docs`**

---

### 3. Frontend Setup & Execution

Open a **new PowerShell terminal window**:

#### A. Navigate to Frontend & Install Dependencies
```powershell
cd g:\projectRP\frontend
npm install
```

#### B. Configure Frontend `.env`
Create `frontend/.env`:
```env
VITE_API_ROOT=/api
```

#### C. Start Vite Development Server
```powershell
npm run dev
```
* Frontend will be live at: **`http://localhost:5173`**

---

## 🌐 Application Navigation & Routes

| Route | Description |
| :--- | :--- |
| `http://localhost:5173/` | **Home Dashboard**: System status overview, quick actions, and login quiz modal |
| `http://localhost:5173/lesson` | **Lesson & Attention HUD**: Video player, live webcam attention tracker, heatmap, and concept popups |
| `http://localhost:5173/chatbot` | **Adaptive Chatbot**: Chat thread, weak spot revision banner, Short Notes, and Knowledge Growth graph |
| `http://localhost:5173/sign-avatar` | **Sign Avatar Studio**: Text-to-gloss sign generator and realistic upper-body avatar viewer |
| `http://localhost:5173/sign-course` | **Sign Course & Arena**: Interactive curriculum units, dual-camera practice arena, and certificate generator |
| `http://localhost:5173/wristband` | **Smart Wristband IoT**: ESP32 BLE device pairing, vibration preset tuning, and OLED preview |
| `http://localhost:5173/history` | **Student History**: Recorded attention sessions, distraction timelines, and answer stats |
| `http://localhost:5173/admin` | **Admin Dashboard**: Pipeline analytics, uploaded video management, and alert reports |
| `http://localhost:5173/upload` | **Admin Video Upload**: Upload O/L ICT video lessons and generate automatic transcripts |

---

## 🛠️ Smart Wristband Firmware Setup (Component 05)

1. Open `backend/src/modules/component_05_smart_wristband_iot/firmware/SmartHapticWristband.ino` in Arduino IDE.
2. Install required libraries via Library Manager:
   * `Adafruit SSD1306` & `Adafruit GFX Library`
   * `ESP32 BLE Arduino`
3. Connect ESP32 via USB and select the COM port.
4. Click **Upload**.
5. The device will advertise as `SignLearn-Band` and automatically pair with the web dashboard on `/wristband`.

---

## 📂 Project Directory Layout

```text
projectRP/
├── backend/
│   ├── src/
│   │   ├── common/                               # DB connection, security, CORS, base configs
│   │   └── modules/
│   │       ├── component_01_attention_monitoring/ # FaceMesh, PERCLOS, YOLOv8, WebSocket
│   │       ├── component_02_knowledge_graph_question_system/ # GQSA, dynamic MCQ generator, datasets
│   │       ├── component_03_adaptive_chatbot/     # EARA, short notes, growth matrix, LLM service
│   │       ├── component_04_sign_avatar_lecture_generator/ # WLASL, hand rig controller, gesture library
│   │       └── component_05_smart_wristband_iot/ # ESP32 BLE service, sign course, firmware
│   ├── main.py                                   # FastAPI entry point
│   ├── requirements.txt                          # Python package dependencies
│   └── .env                                      # Backend environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/layout/                    # Navbar, DashboardPanel, Header
│   │   └── modules/
│   │       ├── component-01-attention-monitoring/ # WebcamFeed, AttentionHeatmap, VideoPlayer
│   │       ├── component-02-knowledge-graph-question-system/ # Popups, ConceptDiagramPanel
│   │       ├── component-03-adaptive-chatbot/     # ChatbotPage, ShortNotesCard, KnowledgeGrowthGraph
│   │       ├── component-04-sign-avatar-lecture-generator/ # RealisticAvatarViewer, HandRigController
│   │       ├── component-05-smart-wristband-iot/ # WristbandPage, SignPracticeArena, CameraSignEvaluator
│   │       └── shared-app/                       # Store (Zustand), Admin pages, Auth
│   ├── package.json                              # Frontend package dependencies
│   └── vite.config.js                            # Vite development & proxy configuration
│
└── docs/                                         # Detailed markdown technical documentation
```

---

## 🧪 Testing & Verification

* **Frontend Build Validation**:
  ```powershell
  cd frontend
  npm run build
  ```
* **Backend Endpoint Health Check**:
  ```powershell
  curl http://localhost:8000/api/videos
  curl http://localhost:8000/api/knowledge-graph
  curl http://localhost:8000/api/chatbot/topics
  ```
