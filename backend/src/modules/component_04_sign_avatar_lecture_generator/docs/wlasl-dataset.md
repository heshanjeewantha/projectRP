# Component 6: WLASL Dataset Automation, Landmark Pipeline, and LSTM Training

## Overview
This component adds an automated WLASL dataset setup and preprocessing pipeline inside the existing FastAPI backend.

It is designed for:
- sign-language AI training
- future React frontend integration
- future 3D avatar animation mapping
- future ICT custom sign datasets

## Created Backend Structure
```text
backend/
├── dataset/
│   └── WLASL/
│       ├── raw_videos/
│       ├── raw_videos_mp4/
│       ├── videos/
│       ├── processed/
│       │   ├── landmarks/
│       │   ├── labels/
│       │   └── sequences/
│       ├── models/
│       ├── logs/
│       └── WLASL_repo/
├── scripts/
│   ├── download_wlasl.py
│   ├── preprocess_wlasl.py
│   ├── extract_landmarks.py
│   ├── generate_labels.py
│   ├── train_model.py
│   └── predict.py
├── app/
│   ├── api/
│   ├── services/
│   ├── models/
│   └── utils/
```

## Main Flow
Lesson or dataset source:
- WLASL metadata JSON
- video URLs

Pipeline:
1. clone WLASL repository
2. read `WLASL_v0.3.json`
3. download raw videos with `yt-dlp`
4. convert and resize valid clips
5. extract MediaPipe Holistic landmarks
6. generate `labels.csv`
7. train LSTM model on landmark sequences
8. expose prediction through FastAPI
9. prepare future avatar mapping output

## Repository Integration
The automation pipeline expects:
- `https://github.com/dxli94/WLASL`
- `start_kit/video_downloader.py`
- `start_kit/preprocess.py`
- `WLASL_v0.3.json`

Important:
- the project now has automatic clone support in code
- the actual clone and download happen when you run the script locally
- this environment did not clone the external repository directly

## Model Type Used
This component is built around:

### 1. MediaPipe Holistic
- type: pretrained landmark extraction model
- use:
  - left hand landmarks
  - right hand landmarks
  - pose landmarks
  - face landmarks

### 2. LSTM Sign Recognition Model
- type: recurrent neural network
- use:
  - sequence learning over frame-by-frame landmark vectors

### 3. Confusion Matrix + Accuracy Metrics
- type: evaluation metrics
- use:
  - validation accuracy
  - confusion matrix output

This is the first component in the project that explicitly scaffolds a true sequence-learning deep model:
- `LSTM`

## Stored Outputs
### Raw and processed videos
- `backend/dataset/WLASL/raw_videos/`
- `backend/dataset/WLASL/raw_videos_mp4/`
- `backend/dataset/WLASL/videos/`

### Landmark JSON
- `backend/dataset/WLASL/processed/landmarks/`

Each JSON stores:
- `frame_number`
- `left_hand_landmarks`
- `right_hand_landmarks`
- `pose_landmarks`
- `face_landmarks`

### Sequence tensors
- `backend/dataset/WLASL/processed/sequences/`

Stored as:
- `.npy` arrays

### Labels
- `backend/dataset/WLASL/processed/labels/labels.csv`

Columns:
- `video_id`
- `gloss`
- `video_path`
- `landmark_path`
- `split`
- `signer_id`

### Trained model outputs
- `backend/dataset/WLASL/models/wlasl_lstm.keras`
- `backend/dataset/WLASL/models/label_map.json`
- `backend/dataset/WLASL/models/metrics.json`
- `backend/dataset/WLASL/models/confusion_matrix.csv`
- `backend/dataset/WLASL/models/model_info.json`

## FastAPI Endpoints
- `GET /api/signs/labels`
- `GET /api/signs/status`
- `POST /api/signs/train`
- `POST /api/signs/predict`
- `GET /api/signs/model-info`

## Future Avatar Support
The prediction flow is already prepared for:

`predicted_sign -> animation_sequence -> avatar_motion_data`

Current placeholder mapper:
- `backend/src/modules/component_04_sign_avatar_lecture_generator/gloss/avatar_mapper.py`

This makes the system ready for:
- Three.js avatar systems
- Blender motion export pipelines
- Unity animation controllers

## Setup Commands
Run inside `backend`:

### Install dependencies
```powershell
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```

### Download dataset
```powershell
.\venv\Scripts\python.exe scripts\download_wlasl.py
```

### Preprocess videos
```powershell
.\venv\Scripts\python.exe scripts\preprocess_wlasl.py
```

### Extract landmarks
```powershell
.\venv\Scripts\python.exe scripts\extract_landmarks.py
```

### Generate labels
```powershell
.\venv\Scripts\python.exe scripts\generate_labels.py
```

### Train the LSTM model
```powershell
.\venv\Scripts\python.exe scripts\train_model.py --epochs 10 --batch-size 16 --sequence-length 48
```

### Run prediction
```powershell
.\venv\Scripts\python.exe scripts\predict.py --landmark-path dataset\WLASL\processed\landmarks\sample.json
```

### Start backend
```powershell
.\venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Important Note
This implementation is fully integrated into the existing backend project structure.

Because external network access is not available in this coding environment:
- the WLASL repository was not physically cloned here
- videos were not downloaded here
- the scripts are prepared so you can run the full pipeline locally on your machine
