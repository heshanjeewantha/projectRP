# Component 04: Sign Avatar Lecture Generator

## Purpose
Component 4 has three independent sub-pipelines:

1. **Primary Sign Avatar** - rule-based text-to-gloss, gesture dataset lookup, fingerspelling fallback, landmark-driven avatar viewer. No ML model.
2. **WLASL Pipeline (backend)** - full LSTM ML pipeline for sign-word classification from landmark sequences. Frontend receives per-frame landmark data via `/api/signs/landmark-sequence/{gloss_word}`.
3. **Sign MNIST Pipeline (backend)** - MLP classifier for static alphabet letter recognition from 28x28 pixel images.

## Folder Explanation
- `pages/`: main sign avatar studio page (SignAvatarPage.jsx)
- `components/`: sign viewer and gesture helpers
- `services/`: sign avatar and lecture API client
- `datasets/`, `models/`, `animations/`: reserved for gesture assets and local references
- `data/`, `utils/`, `docs/`: supporting resources

## APIs Used
- `/api/sign-avatar/*` - primary avatar pipeline
- `/api/sign-lecture/*` - lecture generation pipeline
- `/api/signs/*` - WLASL landmark sequence serving and model status
- `/api/signs/mnist/*` - Sign MNIST model status

## Database Models
- `sign_avatar`
- `sign lectures`
- `missed sign segments`
- `wlasl`

## ML / Dataset Files (Backend)
- Gesture dataset JSON (primary avatar pipeline)
- WLASL LSTM model trained on MediaPipe landmark sequences
- Sign MNIST MLP model trained on 784-pixel grayscale images
- Avatar mapping helpers and lecture generation logic

## How To Test
Open `/sign-avatar`, generate a sign sequence, generate a lecture from notes, replay segments, confirm saved lecture history loads. Test WLASL landmark serving via `/api/signs/landmark-sequence/{word}`.

## Related Frontend Pages
- `SignAvatarPage.jsx`

## Related Backend Routes
- component 04 backend routes under `backend/src/modules/component_04_sign_avatar_lecture_generator/routes`
