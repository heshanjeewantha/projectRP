# Component 04: Sign Avatar Lecture Generator

## Purpose
Component 4 has three independent sub-pipelines:

1. **Primary Sign Avatar** - rule-based text-to-gloss with gesture dataset lookup and landmark-driven avatar viewer. No ML model.
2. **WLASL LSTM Pipeline** - full ML pipeline: clones WLASL repo, downloads videos via yt-dlp, preprocesses frames with OpenCV, extracts MediaPipe Holistic landmarks, trains a 2-layer LSTM (TensorFlow/Keras) for sign-word classification, and serves per-frame landmark sequences to the frontend avatar player.
3. **Sign MNIST Pipeline** - trains an MLP classifier (scikit-learn) on Sign MNIST CSV data for static alphabet (A-Y, excluding J/Z) recognition.

## Folder Explanation
- `routes/`: sign avatar, lecture, WLASL, and Sign MNIST endpoints
- `services/sign_avatar_service.py`: primary avatar pipeline (rule-based)
- `services/wlasl_pipeline_service.py`: WLASL download/preprocess/landmark extraction/LSTM training/prediction
- `services/sign_mnist_service.py`: Sign MNIST MLP training and prediction
- `models/`: sign avatar, WLASL, and Sign MNIST request/response models
- `datasets/`: WLASL dataset structure, Sign MNIST archive data, and training scripts
- `gestures/`: gesture dataset JSON used by the primary avatar pipeline
- `gloss/avatar_mapper.py`: PLACEHOLDER - maps WLASL LSTM prediction to future GLB animation (not yet connected)
- `utils/`: WLASL and Sign MNIST path helpers
- `docs/`: component-specific notes

## APIs Used
- `/api/sign-avatar/*` - primary avatar pipeline
- `/api/sign-lecture/*` - lecture generation pipeline
- `/api/signs/*` - WLASL pipeline (status, train, predict, landmark-sequence)
- `/api/signs/mnist/*` - Sign MNIST pipeline (status, train, predict)

## Database Models
- `signGestureDataset`
- `signAvatarSessions`
- `signAvatarHistory`
- `signLectures`
- `signLectureSegments`
- `missedSignSegments`

## ML Models
- **WLASL LSTM**: 2-layer LSTM (TensorFlow/Keras) trained on MediaPipe Holistic landmark sequences extracted from WLASL videos. Saved to `datasets/WLASL/models/wlasl_lstm.keras`.

- **Sign MNIST MLP**: MLPClassifier (scikit-learn) trained on Sign MNIST 784-pixel grayscale images. Saved via joblib.

## Dataset Files
- `gestures/sign_gesture_dataset.json` - compact pose data for primary avatar pipeline
- `datasets/WLASL/` - WLASL repo clone, raw videos, preprocessed videos, landmarks, sequences, labels
- `datasets/archive/sign_mnist_train.csv`
- `datasets/archive/sign_mnist_test.csv`
- `datasets/train_model.py` - WLASL LSTM training script (launched as subprocess)
- `datasets/train_sign_mnist_model.py` - Sign MNIST MLP training script (launched as subprocess)
- `datasets/preprocess_wlasl.py`
- `datasets/extract_landmarks.py`

## How To Test
1. Primary avatar: generate sign output, generate a lecture, reopen saved lectures.
2. WLASL: hit `/api/signs/status`, launch training via `/api/signs/train`, predict via `/api/signs/predict`, get frame sequences via `/api/signs/landmark-sequence/{gloss_word}`.
3. Sign MNIST: hit `/api/signs/mnist/status`, launch training via `/api/signs/mnist/train`, predict via `/api/signs/mnist/predict`.

## Related Frontend Pages
- `frontend/src/modules/component-04-sign-avatar-lecture-generator/pages/SignAvatarPage.jsx`

## Related Backend Routes
- `sign_avatar_routes.py`
- `signs_routes.py`
