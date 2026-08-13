# WLASL Dataset Pipeline

## Purpose
This folder contains the full automated dataset structure for:
- WLASL video download
- video preprocessing
- MediaPipe Holistic landmark extraction
- label generation
- LSTM training
- sign prediction
- future avatar mapping

## Folder Structure
```text
backend/dataset/WLASL/
├── raw_videos/
├── raw_videos_mp4/
├── videos/
├── processed/
│   ├── landmarks/
│   ├── labels/
│   └── sequences/
├── models/
├── logs/
└── WLASL_repo/
```

## Important Notes
- `raw_videos/` stores original downloaded files.
- `raw_videos_mp4/` stores converted MP4 versions.
- `videos/` stores cleaned and resized clips used in the training pipeline.
- `processed/landmarks/` stores per-video landmark JSON files.
- `processed/sequences/` stores `.npy` sequence tensors for the LSTM model.
- `processed/labels/labels.csv` stores training labels.
- `models/` stores the trained `.keras` model, label map, metrics, and confusion matrix.
- `logs/` stores download, preprocess, landmark, and training logs.

## Commands
Run from the `backend` folder:

### 1. Download or refresh the dataset
```powershell
.\venv\Scripts\python.exe scripts\download_wlasl.py
```

### 2. Preprocess videos
```powershell
.\venv\Scripts\python.exe scripts\preprocess_wlasl.py
```

### 3. Extract landmarks
```powershell
.\venv\Scripts\python.exe scripts\extract_landmarks.py
```

### 4. Generate labels
```powershell
.\venv\Scripts\python.exe scripts\generate_labels.py
```

### 5. Train the LSTM model
```powershell
.\venv\Scripts\python.exe scripts\train_model.py --epochs 10 --batch-size 16 --sequence-length 48
```

### 6. Predict from landmarks
```powershell
.\venv\Scripts\python.exe scripts\predict.py --landmark-path dataset\WLASL\processed\landmarks\sample.json
```

## API Routes
- `GET /api/signs/labels`
- `GET /api/signs/status`
- `POST /api/signs/train`
- `POST /api/signs/predict`
- `GET /api/signs/model-info`

## Future Avatar Support
Prediction output is already structured for:

`predicted_sign -> animation_sequence -> avatar_motion_data`

This is handled by the placeholder mapper in:
- `backend/src/modules/component_04_sign_avatar_lecture_generator/gloss/avatar_mapper.py`
