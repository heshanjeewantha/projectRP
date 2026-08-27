# Component 04 — Sign Avatar Lecture Generator
## Complete Technical Reference (Updated: 2026-08-27)

---

## 1. SYSTEM OVERVIEW

Component 04 converts O/L ICT lesson text into animated sign-language avatar sequences.
It has **three independent sub-systems** that never block each other.

```
┌─────────────────────────────────────────────────────────────────────┐
│  COMPONENT 04 — SIGN AVATAR LECTURE GENERATOR                       │
│                                                                     │
│  Sub-System 1 ── Primary Sign Avatar (always works, no ML needed)  │
│  Sub-System 2 ── WLASL LSTM Pipeline  (admin-triggered ML)         │
│  Sub-System 3 ── Sign MNIST Pipeline  (admin-triggered ML)         │
└─────────────────────────────────────────────────────────────────────┘
```

All three share the same backend module:
```
backend/src/modules/component_04_sign_avatar_lecture_generator/
```

Frontend entry point:
```
frontend/src/modules/component-04-sign-avatar-lecture-generator/pages/SignAvatarPage.jsx
```

---

## 2. SUB-SYSTEM 1 — PRIMARY SIGN AVATAR (Full Detail)

### What It Does
Student types O/L ICT lesson text → backend extracts sign keywords → frontend 2D canvas avatar plays each sign word as an animated hand gesture.

### Step-by-Step Data Flow

```
Student types lesson text
         ↓
POST /api/sign-avatar/generate-sequence
         ↓
sign_avatar_service.py → generate_sign_avatar_sequence()
         ↓
  ┌──────────────────────────────────────────────────┐
  │ 1. _extract_sign_keywords_and_text()             │
  │    a. Try LLM keyword extraction (if API key)    │
  │    b. Fallback: _local_extract_sign_keywords()   │
  │       → _clean_input_text() (strip fillers)      │
  │       → match against sign dictionary            │
  └──────────────────────────────────────────────────┘
         ↓
  ┌──────────────────────────────────────────────────┐
  │ 2. _build_avatar_animation_sequence()            │
  │    For each keyword:                             │
  │    → lookup ICT_SIGN_DICTIONARY entry            │
  │    → check gesture_library (MongoDB/JSON)        │
  │    → produce sequence item with:                 │
  │      keyword, animationName, subtitle,           │
  │      duration, fallbackGesture, isFallback       │
  └──────────────────────────────────────────────────┘
         ↓
  ┌──────────────────────────────────────────────────┐
  │ 3. enrich_sequence_with_wlasl()   [NEW 2026-08]  │
  │    Reads label_map.json                          │
  │    Tags items whose keyword is in WLASL model:   │
  │      wlaslModelClass: true                       │
  │      wlaslValAccuracy: 0.9811                    │
  │      wlaslArchitecture: "BiLSTM"                 │
  │      wlaslLandmarkEndpoint: "/api/signs/..."     │
  └──────────────────────────────────────────────────┘
         ↓
  ┌──────────────────────────────────────────────────┐
  │ 4. _build_subtitle_segments()                    │
  │    Calculates startMs/endMs for each keyword     │
  └──────────────────────────────────────────────────┘
         ↓
Response JSON:
  keywords[], avatarAnimationSequence[],
  subtitleSegments[], sourceType,
  simplifiedText, llmAssisted,
  wlaslModelMeta{}, wlaslEnrichedCount
         ↓
Frontend: SignLecturePlayer.jsx
  → AvatarAnimationController.jsx
  → fetchLandmarkFrames() ── GET /api/signs/landmark-sequence/{keyword}
  → SignAvatar2D.jsx      ── draws 2D canvas avatar with real frames
```

### Text Cleaning — Filler Words Removed

These English filler words are stripped before keyword extraction:

```
a, an, the, is, are, am, was, were, to, of, for, in, on, at,
this, that, these, those, with, and, or, by, be
```

### Gesture Library Loading Priority

1. `gestures/sign_gesture_dataset.json` (static file)
2. MongoDB `signGestureDataset` collection (seeded + teacher-learned)
3. ICT_SIGN_DICTIONARY (curated fallback for lesson player)

---

## 3. COMPLETE KEYWORD TABLES

### 3.1 ICT Sign Dictionary (Sub-System 1 Primary Vocabulary)

30 curated O/L ICT sign words. These are the words the avatar can directly sign.

| # | Keyword | Sinhala | Gloss | Duration | Fallback Gesture |
|---|---------|---------|-------|----------|-----------------|
| 1 | computer | පරිගණකය | COMPUTER | 2.0s | typing_pose |
| 2 | network | ජාලය | NETWORK | 2.0s | linked_hands_pose |
| 3 | database | දත්ත ගබඩාව | DATABASE | 2.0s | stacked_storage_pose |
| 4 | algorithm | අල්ගොරිතමය | ALGORITHM | 1.9s | step_path_pose |
| 5 | software | මෘදුකාංග | SOFTWARE | 1.8s | logic_open_pose |
| 6 | hardware | දෘඩාංග | HARDWARE | 1.8s | solid_component_pose |
| 7 | internet | අන්තර්ජාලය | INTERNET | 2.0s | web_link_pose |
| 8 | input | ආදානය | INPUT | 1.7s | inward_point_pose |
| 9 | output | ප්‍රතිදානය | OUTPUT | 1.7s | outward_release_pose |
| 10 | cpu | මධ්‍යම සැකසුම් ඒකකය | CPU | 1.8s | center_focus_pose |
| 11 | memory | මතකය | MEMORY | 1.8s | memory_hold_pose |
| 12 | storage | ගබඩා කිරීම | STORAGE | 1.8s | memory_hold_pose |
| 13 | keyboard | යතුරුපුවරුව | KEYBOARD | 1.7s | typing_pose |
| 14 | mouse | මවුසය | MOUSE | 1.6s | point_click_pose |
| 15 | monitor | තිරය | MONITOR | 1.7s | screen_frame_pose |
| 16 | code | කේතය | CODE | 1.8s | code_entry_pose |
| 17 | program | වැඩසටහන | PROGRAM | 1.8s | sequence_flow_pose |
| 18 | data | දත්ත | DATA | 1.8s | data_cup_pose |
| 19 | information | තොරතුරු | INFORMATION | 1.9s | present_information_pose |
| 20 | security | ආරක්ෂාව | SECURITY | 1.9s | shield_pose |
| 21 | password | මුරපදය | PASSWORD | 1.8s | shield_pose |
| 22 | login | පිවිසුම | LOGIN | 1.7s | inward_point_pose |
| 23 | file | ගොනුව | FILE | 1.6s | document_frame_pose |
| 24 | folder | ෆෝල්ඩරය | FOLDER | 1.6s | document_frame_pose |
| 25 | server | සර්වරය | SERVER | 1.9s | stacked_storage_pose |
| 26 | browser | වෙබ් බ්‍රව්සරය | BROWSER | 1.8s | web_link_pose |
| 27 | website | වෙබ් අඩවිය | WEBSITE | 1.8s | web_link_pose |
| 28 | email | විද්‍යුත් තැපෑල | EMAIL | 1.8s | message_send_pose |
| 29 | cloud | ක්ලවුඩ් | CLOUD | 1.8s | web_link_pose |
| 30 | device | උපාංගය | DEVICE | 1.7s | device_frame_pose |

### 3.2 WLASL BiLSTM Model Classes (9 Signs — Trained 2026-08-14)

These 9 words have **real WLASL ASL video landmark data** and are recognised by the
trained `wlasl_lstm.keras` model. When these appear in a lesson sequence, the avatar
uses real recorded hand motion frames instead of a synthetic pose.

| Index | Sign Word | WLASL Class ID | BiLSTM Trained |
|-------|-----------|---------------|----------------|
| 0 | **cloud** | 0 | Yes |
| 1 | **computer** | 1 | Yes |
| 2 | **email** | 2 | Yes |
| 3 | **information** | 3 | Yes |
| 4 | **internet** | 4 | Yes |
| 5 | **keyboard** | 5 | Yes |
| 6 | **mouse** | 6 | Yes |
| 7 | **network** | 7 | Yes |
| 8 | **program** | 8 | Yes |

**Model training stats:**
- Architecture: BiLSTM-128-64
- Sequence length: 60 frames per sign
- Feature dimension: 279 floats per frame
- Training samples: 264 (with augmentation)
- Train accuracy: 95.26%
- Val accuracy: **98.11%**
- Train loss: 0.0845  |  Val loss: 0.0619
- Epochs trained: 80
- Normalisation: wrist-relative
- Trained at: 2026-08-14T05:37:03 UTC

All 9 WLASL classes overlap with the ICT Sign Dictionary above (#29, #1, #28, #19,
#7, #13, #14, #2, #17). This means those words get both static gesture fallback AND
real WLASL landmark frames.

### 3.3 Semantic Word Alias Map

Any of the words in the left column typed by the student will be resolved to the gloss on the right.

| Input Words | Resolves To Gloss |
|-------------|-----------------|
| computer, pc, system | COMPUTER |
| device | DEVICE |
| electronic | ELECTRONIC |
| data, raw | DATA |
| information | INFORMATION |
| internet, web, online | INTERNET |
| email, mail | EMAIL |
| database, databases, table, tables, record, records, field, fields, query, queries | DATABASE |
| program, programs, programming, code, coding | PROGRAM |
| flowchart, algorithm, algorithms | FLOWCHART |
| security, secure, protection, protect, password | SECURITY |
| hardware | HARDWARE |
| software, application, applications, app | SOFTWARE |
| input, enter, insert | INPUT |
| output, result, results, display | OUTPUT |
| memory, storage, store, stored, save, saved | MEMORY |
| network, networks, networking, connection, connections | NETWORK |

### 3.4 Semantic Phrase Map

Multi-word combinations that resolve to a single sign before single-word lookup:

| Input Phrase | Resolves To |
|-------------|------------|
| computer system | COMPUTER |
| input data | INPUT |
| output information | OUTPUT |
| storage device | MEMORY |
| world wide web | INTERNET |
| computer network | NETWORK |
| information security | SECURITY |
| data security | SECURITY |
| computer program | PROGRAM |
| database table | DATABASE |

---

## 4. SUB-SYSTEM 2 — WLASL LSTM PIPELINE (Admin Only)

### Purpose
Download real ASL videos from YouTube, extract MediaPipe hand landmarks frame-by-frame,
train a BiLSTM sequence classifier, use the trained model to enrich Sub-System 1.

### Admin Pipeline Steps

| Step | API Endpoint | Function | Output |
|------|-------------|----------|--------|
| A | Clone repo | ensure_wlasl_repo() | WLASL_v0.3.json with 2000+ gloss words |
| B | POST /api/signs/download | download_wlasl_videos() | raw_videos/ |
| C | POST /api/signs/preprocess | preprocess_wlasl_videos() | videos/ (224×224) |
| D | POST /api/signs/extract-landmarks | extract_landmarks_dataset() | processed/landmarks/{id}.json |
| E | POST /api/signs/generate-labels | generate_labels_csv() | processed/labels/labels.csv |
| F | POST /api/signs/train | launch_training_job() | models/wlasl_lstm.keras |
| G | POST /api/signs/predict | predict_from_landmarks() | {predictedSign, confidence} |

### BiLSTM Model Architecture

```
Input(60, 279)
→ Masking(mask_value=0.0)               ← ignores zero-padded frames
→ Bidirectional(LSTM(128, return_sequences=True))
→ Dropout(0.3)
→ Bidirectional(LSTM(64))
→ Dropout(0.3)
→ Dense(64, activation='relu')
→ Dense(9, activation='softmax')        ← 9 ICT sign classes
```

Compiled with: Adam optimizer, sparse_categorical_crossentropy loss

### MediaPipe Feature Vector — 279 Floats Per Frame

```
Left hand landmarks:    21 points × 3 (x, y, z)          =  63
Right hand landmarks:   21 points × 3 (x, y, z)          =  63
Pose body landmarks:    33 points × 4 (x, y, z, vis)     = 132
Face (7 selected):       7 points × 3 (x, y, z)          =  21
                                                  TOTAL  = 279
```

Selected face landmark indexes: `[1, 33, 61, 152, 199, 263, 291]`

### Wrist-Relative Normalisation

Before training, all hand landmark coordinates are shifted so the wrist is at (0,0,0):
```python
hand_landmarks -= hand_landmarks[0]  # wrist is index 0
```
This makes the model position-invariant — works regardless of where hands appear on screen.

### Data Augmentation

When `--augment` flag is used:
- Gaussian noise ±0.01 added to all coordinates
- Time-shift by ±5 frames (random slice of 60 from extended sequence)
- Mirror augmentation (flip left/right hand)

### Landmark Sequence API

```
GET /api/signs/landmark-sequence/{word}
```

Priority order:
1. `processed/landmarks/{gloss}.json` — per-gloss avatar JSON (Colab Cell 16)
2. `processed/landmarks/{video_id}.json` — per-video extraction
3. Synthetic fallback — deterministic unique arm-pose from word characters (always works)

---

## 5. SUB-SYSTEM 3 — SIGN MNIST PIPELINE (Admin Only)

### Purpose
Train a static handshape letter classifier (A–Z excluding J and Z) from the
Sign Language MNIST archive dataset.

### Dataset
- 28×28 grayscale images of handshapes
- 24 classes (letters A–Z, no J or Z which require motion)
- ~28,000 training images

### MLP Model Architecture

```
Input(784)              ← 28×28 image flattened to 1D
→ Dense(512, relu)
→ Dropout(0.3)
→ Dense(256, relu)
→ Dropout(0.2)
→ Dense(24, softmax)    ← 24 letter classes
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/signs/mnist/status | Dataset + model status |
| GET | /api/signs/mnist/model-info | Model metadata |
| POST | /api/signs/mnist/train | Launch training |
| POST | /api/signs/mnist/predict | Predict from 784 pixel array |

---

## 6. WLASL BiLSTM INTEGRATION INTO SUB-SYSTEM 1 (Added 2026-08-27)

### Background
Previously Sub-System 1 used only static gesture library lookups. The trained
`wlasl_lstm.keras` model was only accessible via `/api/signs/predict` (Sub-System 2).

Now the model's label knowledge is wired into Sub-System 1's keyword sequence generation.

### New Service: `services/wlasl_enrichment.py`

Functions:
```python
get_wlasl_known_classes() -> set[str]
    # Reads label_map.json, returns lowercase set {'cloud','computer',...}
    # Cached in-memory after first read

get_wlasl_model_meta() -> dict
    # Returns {valAccuracy, architecture, classCount, epochs, ...}
    # Cached in-memory after first read

enrich_sequence_with_wlasl(sequence) -> list[dict]
    # For each item: if keyword in known classes → add wlaslModelClass=True
    # Otherwise → wlaslModelClass=False, item unchanged

invalidate_cache() -> None
    # Called after POST /api/signs/train to force fresh label_map read
```

### What Each Enriched Item Looks Like

For a keyword in the WLASL model (e.g. "computer"):
```json
{
  "keyword": "computer",
  "animationName": "computer_sign_animation",
  "subtitle": "Computer",
  "duration": 2.0,
  "fallbackGesture": "typing_pose",
  "sourceGloss": "COMPUTER",
  "isFallback": false,
  "wlaslModelClass": true,
  "wlaslValAccuracy": 0.9811,
  "wlaslArchitecture": "BiLSTM",
  "wlaslLandmarkEndpoint": "/api/signs/landmark-sequence/computer"
}
```

For a keyword NOT in the model (e.g. "database"):
```json
{
  "keyword": "database",
  "wlaslModelClass": false
}
```

### Response Envelope New Fields

```json
{
  "wlaslModelMeta": {
    "modelReady": true,
    "architecture": "BiLSTM",
    "classCount": 9,
    "valAccuracy": 0.9811,
    "trainAccuracy": 0.9526,
    "sequenceLength": 60,
    "featureDimension": 279,
    "epochs": 80,
    "lastTrainedAt": "2026-08-14T05:37:03Z",
    "normalisation": "wrist_relative"
  },
  "wlaslEnrichedCount": 6
}
```

### Frontend Visual Indicators

| Element | Where | What the User Sees |
|---------|-------|-------------------|
| Purple BiLSTM badge | AvatarAnimationController toolbar | `🧠 BiLSTM · 98% acc` |
| Source meta field | Word card | `BiLSTM-128-64 · 98% acc` |
| Timeline keyword chip | SignLecturePlayer timeline | Purple border + brain icon |
| BiLSTM Model stat | SignLecturePlayer stats section | `🧠 BiLSTM Model: 6 / 6 signs` |

---

## 7. FULL API REFERENCE

### Sub-System 1 — Sign Avatar

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/sign-avatar/generate | Full sign generation + MongoDB save |
| POST | /api/sign-avatar/generate-sequence | **Main player API** — keyword sequence |
| GET | /api/sign-avatar/gestures | Gesture library list |
| POST | /api/sign-avatar/learned-patterns | Save teacher-corrected sign |
| GET | /api/sign-avatar/learned-patterns | Get all teacher signs |
| GET | /api/sign-avatar/history/{studentId} | Student history |
| DELETE | /api/sign-avatar/history/{studentId} | Clear history |
| POST | /api/sign-avatar/missed-segment | Log distracted-student missed sign |
| POST | /api/sign-lecture/generate | Generate multi-segment lecture |
| GET | /api/sign-lecture/{lectureId} | Get lecture |
| GET | /api/sign-lecture/list/{teacherId} | List lectures |
| POST | /api/sign-lecture/save | Save draft |
| DELETE | /api/sign-lecture/{lectureId} | Delete |

### Sub-System 2 — WLASL Pipeline

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/signs/status | Full pipeline status |
| GET | /api/signs/model-info | Model metadata |
| GET | /api/signs/labels | labels.csv records |
| POST | /api/signs/train | Launch BiLSTM training |
| POST | /api/signs/predict | Inference from landmark sequence |
| GET | /api/signs/landmark-sequence/{word} | Landmark frames for one word |

### Sub-System 3 — Sign MNIST

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/signs/mnist/status | Status |
| GET | /api/signs/mnist/model-info | Metadata |
| POST | /api/signs/mnist/train | Launch training |
| POST | /api/signs/mnist/predict | Predict from 784 pixels |

---

## 8. FILE MAP

```
backend/src/modules/component_04_sign_avatar_lecture_generator/
├── models/
│   ├── sign_avatar.py              Pydantic models for Sub-System 1
│   ├── sign_mnist.py               Pydantic models for Sub-System 3
│   └── wlasl.py                    Pydantic models for Sub-System 2
├── routes/
│   ├── sign_avatar_routes.py       Sub-System 1 + lecture routes
│   └── signs_routes.py             Sub-System 2 + 3 routes
├── services/
│   ├── sign_avatar_service.py      Sub-System 1 core (1480 lines)
│   ├── wlasl_pipeline_service.py   Sub-System 2 pipeline (957 lines)
│   ├── wlasl_enrichment.py         BiLSTM model integration [NEW 2026-08-27]
│   └── sign_mnist_service.py       Sub-System 3 pipeline
├── gestures/
│   └── sign_gesture_dataset.json   Static gesture library seed data
├── gloss/
│   └── avatar_mapper.py            Predicted sign → avatar payload mapping
├── datasets/
│   ├── WLASL/
│   │   ├── models/
│   │   │   ├── wlasl_lstm.keras    TRAINED BILSTM MODEL (7.4 MB)
│   │   │   ├── checkpoint.keras    Best checkpoint during training
│   │   │   ├── label_map.json      9 class labels + index map
│   │   │   ├── metrics.json        Training metrics
│   │   │   ├── model_info.json     Architecture metadata
│   │   │   └── confusion_matrix.csv
│   │   ├── processed/
│   │   │   ├── landmarks/          {gloss}.json and {video_id}.json
│   │   │   ├── sequences/          {video_id}.npy (raw float arrays)
│   │   │   └── labels/labels.csv
│   │   ├── raw_videos/             Downloaded ASL videos
│   │   └── logs/                   Training and pipeline logs
│   └── train_model.py              BiLSTM training script (run as subprocess)
└── utils/
    └── wlasl_paths.py              All shared path constants

frontend/src/
├── modules/component-04-sign-avatar-lecture-generator/
│   ├── pages/SignAvatarPage.jsx        Page shell + attention state
│   └── services/signAvatarApi.js       All API call functions
└── components/SignAvatar/
    ├── SignLecturePlayer.jsx            Main player UI + stats + timeline
    ├── AvatarAnimationController.jsx    Playback control + WLASL badges
    └── two-d-sign-avatar/
        └── SignAvatar2D.jsx             2D canvas renderer (landmark-driven)
```

---

## 9. MONGODB COLLECTIONS

| Collection | What It Stores |
|-----------|---------------|
| signGestureDataset | Gesture library (seeded + teacher additions) |
| learnedSignPatterns | Teacher motion recordings (frameCount, trajectory) |
| signAvatarHistory | Per-student generation records |
| signAvatarSessions | Latest session state per student |
| missedSignSegments | Signs played while student was distracted |
| signLectures | Teacher-generated lecture documents |
| signLectureSegments | Per-segment gesture sequences within lectures |
| signLectureHistory | Lecture create/save audit trail |
| knowledge_graph | ICT concept nodes used for topic resolution |
| studentLearningStates | Stored learning state per student |
| attention_logs | Attention event stream from Component 01 |

---

## 10. END-TO-END EXAMPLE TRACE

Input text:
> "Use a computer with a keyboard and mouse. Connect to the internet over a network to send an email."

Step 1 — Filler removal:
```
computer, keyboard, mouse, connect, internet, network, send, email
```

Step 2 — Semantic gloss mapping:
```
computer  → COMPUTER  (SEMANTIC_WORD_GLOSS_MAP)
keyboard  → KEYBOARD  (direct gesture library match)
mouse     → MOUSE     (direct gesture library match)
connect   → dropped   (no match)
internet  → INTERNET  (SEMANTIC_WORD_GLOSS_MAP)
network   → NETWORK   (SEMANTIC_WORD_GLOSS_MAP)
send      → dropped   (no match)
email     → EMAIL     (SEMANTIC_WORD_GLOSS_MAP)
```

Step 3 — Sequence built (6 items):
```
[COMPUTER, KEYBOARD, MOUSE, INTERNET, NETWORK, EMAIL]
```

Step 4 — WLASL enrichment:
```
COMPUTER  → wlaslModelClass: true   class 1  98.11%
KEYBOARD  → wlaslModelClass: true   class 5  98.11%
MOUSE     → wlaslModelClass: true   class 6  98.11%
INTERNET  → wlaslModelClass: true   class 4  98.11%
NETWORK   → wlaslModelClass: true   class 7  98.11%
EMAIL     → wlaslModelClass: true   class 2  98.11%

wlaslEnrichedCount: 6 / 6
```

Step 5 — Frontend plays:
```
For each sign:
  fetchLandmarkFrames("computer") → GET /api/signs/landmark-sequence/computer
  → returns real WLASL hand landmark frames (60 frames × 279 floats)
  → SignAvatar2D renders hands from real ASL video data
  → Purple BiLSTM badge shown in toolbar
  → Timeline shows purple chips with brain icon
```
