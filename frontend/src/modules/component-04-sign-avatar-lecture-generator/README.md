# Component 04: Sign Avatar Lecture Generator

## Purpose
Generates text-to-sign avatar sequences, builds lecture playback segments, and connects sign playback with chatbot and wristband actions.

## Folder Explanation
- `pages/`: main sign avatar studio page
- `components/`: sign viewer and gesture helpers
- `services/`: sign avatar and lecture API client
- `datasets/`, `models/`, `animations/`: reserved for gesture assets and local references
- `data/`, `utils/`, `docs/`: supporting resources

## APIs Used
- `/api/sign-avatar/*`
- `/api/sign-lecture/*`
- `/api/signs/*`

## Database Models
- `sign_avatar`
- `sign lectures`
- `missed sign segments`
- `wlasl`

## ML/Dataset Files
- Gesture dataset JSON
- WLASL dataset structure and scripts
- Avatar mapping helpers and lecture generation logic

## How To Test
Open `/sign-avatar`, generate a sign sequence, generate a lecture from notes, replay segments, and confirm saved lecture history loads.

## Related Frontend Pages
- `SignAvatarPage.jsx`

## Related Backend Routes
- component 04 backend routes under `backend/src/modules/component_04_sign_avatar_lecture_generator/routes`
