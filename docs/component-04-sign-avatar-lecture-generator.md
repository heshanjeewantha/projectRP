# Component 4: Text-to-3D Sign Language Avatar Generator & Monitoring Module

## Overview
This component converts lesson text into a sign-ready gloss sequence and plays it through a more realistic upper-body signing viewer inside the existing app.

Flow:
- input text
- text cleaning
- gloss generation
- gesture mapping
- hand-pose generation
- avatar playback
- monitoring-aware replay support

## AI / ML Model Type Used
This component currently does not use a CNN sign-recognition model, LSTM sequence model, GAN avatar model, or a real 3D motion-capture inference pipeline.

It uses:
- `Text cleaning and gloss conversion`
  - type: rule-based text processing
- `Gesture mapping`
  - type: dataset lookup + fallback logic
- `MediaPipe-style 21-point hand representation`
  - type: landmark-driven hand structure
- `Hand rig controller`
  - type: geometry / interpolation / kinematic pose generation
- `Fingerspelling fallback`
  - type: rule-based sequence generator

So Component 4 is currently a structured sign-avatar prototype using landmark logic and stored gesture data rather than deep-learning animation generation.

## Frontend
Main frontend files:
- `frontend/src/pages/SignAvatarPage.jsx`
- `frontend/src/components/SignAvatar/RealisticAvatarViewer.jsx`
- `frontend/src/components/SignAvatar/HandRigController.js`
- `frontend/src/components/SignAvatar/GesturePoseLibrary.js`
- `frontend/src/components/SignAvatar/FingerspellingFallback.js`
- `frontend/src/api/signAvatarApi.js`

Main UI features:
- text input
- language selector
- topic selector
- generate sign button
- generate lecture video tab
- lesson title / subject / topic / notes input
- notes file upload
- generated lesson script preview
- generated gloss preview
- sign lecture player
- segment list with jump / replay
- save lecture
- export lecture JSON
- realistic upper-body sign viewer
- play / pause / replay
- slow / normal / fast speed
- camera zoom slider focused on the hands
- show hand landmarks toggle
- show finger labels toggle
- generated gloss panel
- active gesture panel
- gesture sequence panel
- monitoring status badge
- recent sign-avatar history

## Backend
Main backend files:
- `backend/models/sign_avatar.py`
- `backend/services/sign_avatar_service.py`
- `backend/routes/sign_avatar_routes.py`
- `backend/data/sign_gesture_dataset.json`

MongoDB collections:
- `signGestureDataset`
- `signAvatarSessions`
- `signAvatarHistory`
- `missedSignSegments`
- `signLectures`
- `signLectureSegments`
- `signLectureHistory`

## API Endpoints
### POST `/api/sign-avatar/generate`
Generate gloss and a gesture sequence for the given text.

Request example:
```json
{
  "studentId": "student_demo_123",
  "inputText": "A computer is an electronic device",
  "selectedLanguage": "English",
  "currentLearningState": "understanding",
  "currentTopic": "Computer Hardware"
}
```

### GET `/api/sign-avatar/gestures`
Return the available gesture pose dataset.

### GET `/api/sign-avatar/history/{studentId}`
Return previous sign-avatar sessions for one student.

### DELETE `/api/sign-avatar/history/{studentId}`
Delete sign-avatar history, sessions, and missed sign segments for the student.

### POST `/api/sign-avatar/missed-segment`
Store a missed sign segment when the monitoring module detects distraction during playback.

### POST `/api/sign-lecture/generate`
Generate a sign-avatar lecture timeline from teacher notes.

Request example:
```json
{
  "teacherId": "admin_demo_001",
  "lessonTitle": "Computer as an Electronic Device",
  "subject": "O/L ICT",
  "topic": "Computer System",
  "notesText": "A computer is an electronic device that accepts data as input, processes it, stores it, and produces information as output.",
  "language": "English",
  "difficultyLevel": "beginner"
}
```

### GET `/api/sign-lecture/{lectureId}`
Return one generated lecture and all timeline segments.

### GET `/api/sign-lecture/list/{teacherId}`
Return lecture history for one teacher/admin user.

### POST `/api/sign-lecture/save`
Mark a generated lecture as saved.

### DELETE `/api/sign-lecture/{lectureId}`
Delete a generated lecture, its segments, and lecture history rows.

## Text-To-Gloss
The text processing module:
1. removes punctuation
2. splits input into words
3. removes simple filler words in English
4. keeps key words for gloss generation

Example:
- Input: `A computer is an electronic device`
- Cleaned words: `computer electronic device`
- Gloss: `COMPUTER ELECTRONIC DEVICE`

## Gesture Storage
Each gesture record now stores:
- `glossWord`
- `animationFile`
- `description`
- `fallbackType`
- `animationDuration`
- `leftHandPose`
- `rightHandPose`
- `boneRotationValues`

The current prototype stores compact pose data rather than full motion-capture clips. This keeps the system easy to seed and easy to replace later.

## MediaPipe-Style Hand Landmarks
The realistic viewer uses a MediaPipe-inspired 21-point hand structure per hand:
- `0`: wrist
- `1-4`: thumb
- `5-8`: index
- `9-12`: middle
- `13-16`: ring
- `17-20`: pinky

`HandRigController.js` converts compact hand pose settings into visible landmark points and finger segments. The viewer can render:
- the palm shape
- finger bones
- joints
- optional landmark dots
- optional finger labels

This means the current prototype is already structured for future landmark-driven sign data.

## Realistic Avatar Viewer
The upgraded viewer focuses on:
- upper body framing
- both hands clearly visible
- all five fingers visible on each hand
- separate finger segments and joints
- better skin tone and lighting treatment
- smooth interpolation between sign poses
- hand-focused zoom support

This version does not yet use a downloaded GLB humanoid model, but it is no longer the old circle-body placeholder. It uses a structured rig-like SVG/landmark system designed to be swapped with a real 3D rig later.

## Sign Avatar Lecture Video Generator
The new lecture feature extends the existing sign-avatar module instead of replacing it.

Flow:
1. teacher enters lesson title, subject, topic, and notes
2. notes are cleaned and repeated text is removed
3. notes are split into short teaching lines
4. each line is converted into sign gloss
5. each gloss line is mapped to the existing gesture dataset
6. the frontend plays the lecture segment-by-segment through the same avatar viewer
7. the lecture can be saved and exported as JSON

### Notes To Script
The backend creates short beginner-friendly script lines from longer notes.

Example:
- Notes: `A computer is an electronic device that accepts data as input, processes it, stores it, and produces information as output.`
- Script:
  - `Today we are learning about Computer System.`
  - `A computer is an electronic device.`
  - `It accepts data as input.`
  - `It processes it.`
  - `It stores it.`
  - `It produces information as output.`

### Script To Gloss
Each script line is converted using the existing text-to-gloss pipeline.

Example:
- `A computer is an electronic device.` -> `COMPUTER ELECTRONIC DEVICE`
- `It accepts data as input.` -> `ACCEPTS DATA INPUT`

### Lecture Timeline
Each lecture stores a list of segments with:
- `segmentId`
- `originalText`
- `simplifiedScript`
- `generatedGloss`
- `gestureSequence`
- `estimatedDuration`
- `keyWords`
- `orderIndex`

### Lecture Player
The frontend lecture player includes:
- avatar playback
- subtitle text
- current gloss text
- progress bar
- segment jump
- replay lecture
- replay current segment
- slow / normal / fast speed

### Save And Export
- `Generate` creates a draft lecture in MongoDB
- `Save` marks it as saved for later reopening
- `Export JSON` downloads the generated lecture structure

### Cross-Component Integration
- Component 1: if the learner is distracted during lecture playback, the active sign is stored as a missed segment
- Component 3: the current lecture sentence can be opened in the chatbot for follow-up explanation
- Component 5: the wristband can pulse when a new lecture segment begins and when distraction is detected

## Fingerspelling Fallback
If a gloss word has no direct gesture:
- alphabetic words use a fingerspelling fallback
- unsupported non-alphabetic content uses a neutral missing-gesture pose

The fingerspelling module provides letter-based hand shapes so the system can still show an understandable fallback sequence.

## Monitoring Integration
The page reads the current attention state from Component 1.

If the student becomes distracted during playback:
- the active gloss word is marked as missed
- a replay suggestion is shown
- the missed segment is stored in `missedSignSegments`
- the learner can replay the sequence in slow mode

The same missed-segment logic is reused for generated lecture playback.

## Adding New Sign Gestures
To add a new gesture:
1. open `backend/data/sign_gesture_dataset.json`
2. add a new gesture entry with:
   - gloss word
   - description
   - animation duration
   - left-hand pose
   - right-hand pose
   - bone rotation values
3. restart the backend so seeding can update MongoDB

If you later get real sign motion data:
- keep the gloss word the same
- replace the placeholder `animationFile`
- add real landmark sequences or connect a GLB animation pipeline

## Replacing Placeholder Gestures With Real 3D Animation
The current architecture is ready for the next upgrade stage:
- replace compact pose values with frame-by-frame landmarks
- or connect `glossWord` to a real GLB/GLTF animation clip
- or map MediaPipe landmarks directly to a rigged humanoid hand skeleton

Because the page already separates:
- gloss generation
- gesture mapping
- rig control
- viewer rendering

the real data can be introduced without rebuilding the whole component.

## Running And Testing
### Backend
Run the existing FastAPI backend as usual.

### Frontend
Run the existing React frontend as usual.

### Manual Test
1. Open the app
2. Click `Sign Avatar`
3. Enter text
4. Choose language and topic
5. Click `Generate Sign`
6. Use play / pause / replay
7. Change speed
8. Toggle landmarks and labels
9. Use camera zoom
10. Simulate distraction and verify replay suggestion + missed segment storage

### Lecture Generator Test
1. Open `Sign Avatar`
2. Switch to `Generate Lecture Video`
3. Use the sample lecture notes or upload a `.txt` file
4. Click `Generate Lecture`
5. Verify generated script preview
6. Verify generated gloss preview
7. Play the lecture
8. Jump between segments
9. Replay one segment in slow mode
10. Save the lecture
11. Export the lecture JSON
12. Reopen it from the saved lecture list

## Notes
- This component remains integrated into the existing project.
- Existing pages were not removed.
- The new viewer is a realistic prototype path built around landmark-driven hands and can be upgraded later to a true GLB humanoid signer.
