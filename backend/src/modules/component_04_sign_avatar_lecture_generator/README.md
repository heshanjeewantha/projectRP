# Component 04: Sign Avatar Lecture Generator

## Purpose
Generates sign avatar sequences, stores gesture mappings, builds lecture segments, and manages both the WLASL motion-sign pipeline and the Sign MNIST alphabet pipeline.

It now also exposes a keyword-driven sign sequence endpoint for lesson notes:
- `POST /api/sign-avatar/generate-sequence`
- extracts ICT keywords
- maps them to sign animations or fallback gestures
- returns subtitle-ready timing data for the frontend player

## Folder Explanation
- `routes/`: sign avatar, lecture, WLASL, and Sign MNIST endpoints
- `services/`: avatar generation, lecture generation, WLASL pipeline logic, and Sign MNIST training helpers
- `models/`: sign avatar, WLASL, and Sign MNIST request/response models
- `datasets/`: WLASL structure, Sign MNIST archive data, and training scripts
- `gestures/`: gesture dataset assets used for sign generation
- `gloss/`: gloss-to-avatar mapping helpers
- `utils/`: WLASL path helpers
- `docs/`: component-specific notes

## APIs Used
- `/api/sign-avatar/*`
- `/api/sign-lecture/*`
- `/api/signs/*`
- `/api/signs/mnist/*`

## Database Models
- `signGestureDataset`
- `signAvatarSessions`
- `signAvatarHistory`
- `signLectures`
- `signLectureSegments`
- `missedSignSegments`

## ML/Dataset Files
- `gestures/sign_gesture_dataset.json`
- `datasets/WLASL/*`
- `datasets/archive/sign_mnist_train.csv`
- `datasets/archive/sign_mnist_test.csv`
- `datasets/train_model.py`
- `datasets/train_sign_mnist_model.py`
- `datasets/preprocess_wlasl.py`
- `datasets/extract_landmarks.py`

## How To Test
Generate sign output, generate a lecture, reopen saved lectures, and hit WLASL or Sign MNIST status and training endpoints.

## Related Frontend Pages
- `frontend/src/modules/component-04-sign-avatar-lecture-generator/pages/SignAvatarPage.jsx`

## Related Backend Routes
- `sign_avatar_routes.py`
- `signs_routes.py`
