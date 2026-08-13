# Component 5: Smart Haptic Wristband with 3D Device Configuration & OLED Notification Display

## Overview
This component adds a wristband module to the existing SignLearn AI system.

Flow:
- system event
- backend notification mapping
- wristband configuration lookup
- ESP32 wristband notification
- vibration pattern playback
- OLED message display
- event history logging

## AI / ML Model Type Used
This component currently uses no machine-learning model.

It is built with:
- rule-based alert mapping
- preset vibration pattern logic
- OLED message formatting logic
- IoT device communication with ESP32

So Component 5 is an IoT integration component, not a CNN, LSTM, regression, or deep-learning module.

## Frontend
Main frontend files:
- `frontend/src/pages/WristbandPage.jsx`
- `frontend/src/components/Wristband/WristbandPreview.jsx`
- `frontend/src/api/wristbandApi.js`
- `frontend/src/components/Navbar/Navbar.jsx`
- `frontend/src/App.jsx`

Main UI features:
- wristband navbar button
- responsive wristband page
- 3D-style wristband preview
- OLED preview
- device connection summary
- alert type selector
- vibration pattern selector
- intensity and duration sliders
- test notification button
- save configuration button
- event history table

## Backend
Main backend files:
- `backend/models/wristband.py`
- `backend/routes/wristband_routes.py`
- `backend/services/wristband_service.py`
- `backend/data/wristband_alert_presets.json`

MongoDB collections:
- `wristbandDevices`
- `wristbandConfigs`
- `wristbandNotifications`
- `wristbandEventHistory`

## API Endpoints
### POST `/api/wristband/config`
Save or update a student's wristband configuration.

Request example:
```json
{
  "studentId": "student_demo_123",
  "deviceId": "band-student_demo_123",
  "alertType": "Distraction Alert",
  "vibrationPattern": "Long Pulse",
  "oledMessage": "FOCUS BACK",
  "intensity": 85,
  "duration": 1000
}
```

### GET `/api/wristband/config/{studentId}`
Return the student's current wristband configuration.

### POST `/api/wristband/test`
Send a test notification using the selected alert configuration.

### POST `/api/wristband/notify`
Send a system notification to the wristband.

### GET `/api/wristband/history/{studentId}`
Return wristband event history for the student.

### DELETE `/api/wristband/history/{studentId}`
Clear the student's wristband notification/event history.

### GET `/api/wristband/device/{studentId}`
Return the current wristband device summary.

## Alert Types
Supported alert types:
- `Distraction Alert`
- `Chatbot Reply`
- `Missed Lesson Segment`
- `Popup Question`
- `Exam Reminder`
- `Sign Avatar Replay`

Each alert type has a default preset in:
- `backend/data/wristband_alert_presets.json`

## Vibration Logic
Supported vibration patterns:
- `Short Pulse`: vibrate `200ms`
- `Double Pulse`: vibrate `200ms`, pause `150ms`, vibrate `200ms`
- `Long Pulse`: vibrate `1000ms`
- `Short + Long`: vibrate `200ms`, pause `150ms`, vibrate `800ms`
- `Repeated Pulse`: vibrate `200ms` repeated `5` times
- `Emergency Pulse`: fast repeated vibration burst

## OLED Display Logic
The OLED preview and stored config use short uppercase text.

Current backend rule:
- message is normalized to uppercase
- multiple spaces are collapsed
- display text is limited to `18` characters for the small wristband screen

Example messages:
- `FOCUS BACK`
- `CHAT REPLY`
- `MISSED PART`
- `NEW QUESTION`
- `EXAM TIP`
- `REPLAY SIGN`

## Device Data Model
### `wristbandDevices`
Stores the student device summary:
- `studentId`
- `deviceId`
- `deviceName`
- `connectionStatus`
- `batteryLevel`
- `firmwareVersion`
- `lastSeenAt`

### `wristbandConfigs`
Stores the current saved alert configuration:
- `studentId`
- `deviceId`
- `alertType`
- `vibrationPattern`
- `oledMessage`
- `intensity`
- `duration`
- `deviceStatus`
- `updatedAt`

### `wristbandNotifications`
Stores generated notifications:
- `studentId`
- `deviceId`
- `alertType`
- `vibrationPattern`
- `oledMessage`
- `status`
- `source`
- `createdAt`

### `wristbandEventHistory`
Stores config saves, test events, and system sends:
- `studentId`
- `deviceId`
- `eventType`
- `alertType`
- `vibrationPattern`
- `oledMessage`
- `status`
- `details`
- `createdAt`

## ESP32 Firmware
Firmware file:
- `iot/esp32_wristband/SmartHapticWristband.ino`

Main firmware functions:
- `connectToWiFi()`
- `fetchNotification()`
- `playVibrationPattern(pattern)`
- `showOLEDMessage(message)`
- `sendDeviceStatus()`

Current firmware behavior:
- connects to WiFi
- polls the backend config endpoint
- shows OLED text
- plays the matching vibration pattern
- supports a local push-button test

## Hardware Wiring Guide
Suggested parts:
- ESP32 mini board
- vibration motor
- 0.96 inch OLED display
- battery module
- TP4056 charging module
- push button
- transistor or motor driver

Suggested wiring:
- OLED `VCC` -> `3.3V`
- OLED `GND` -> `GND`
- OLED `SCL` -> ESP32 `SCL`
- OLED `SDA` -> ESP32 `SDA`
- motor control pin -> ESP32 `GPIO 16` through transistor/driver
- push button -> ESP32 `GPIO 4`
- battery/charging module -> ESP32 power input

Important:
- do not drive the vibration motor directly from a GPIO pin without a transistor/driver stage

## System Integration
This component is ready to connect to existing components through the notify endpoint.

Examples:
- Component 1 attention detection:
  - `alertType = Distraction Alert`
  - `vibrationPattern = Long Pulse`
  - `oledMessage = FOCUS BACK`

- Component 2 popup question system:
  - `alertType = Popup Question`
  - `vibrationPattern = Short Pulse`
  - `oledMessage = NEW QUESTION`

- Component 3 chatbot:
  - `alertType = Chatbot Reply`
  - `vibrationPattern = Double Pulse`
  - `oledMessage = CHAT REPLY`

- Component 4 sign avatar replay:
  - `alertType = Sign Avatar Replay`
  - `vibrationPattern = Emergency Pulse`
  - `oledMessage = REPLAY SIGN`

## 3D Preview Notes
The current frontend uses a responsive 3D-style wristband preview built with in-project UI code so it works with the current dependency set.

It supports:
- device rotation interaction
- zoom control
- OLED message preview on the device face
- animated vibration waves around the wristband

If `three` or `@react-three/fiber` is added later, this preview can be upgraded to a true mesh-based device model without changing the page flow or backend APIs.

## Running And Testing
### Backend
Run the existing FastAPI backend as usual.

### Frontend
Run the existing React frontend as usual.

### Wristband UI Test
1. Open the app
2. Click `Wristband`
3. Choose an alert type
4. Adjust vibration pattern, intensity, and duration
5. Edit the OLED message
6. Click `Save Configuration`
7. Click `Test Notification`
8. Confirm the event history updates

### ESP32 Test
1. Open `SmartHapticWristband.ino`
2. set WiFi credentials
3. update the backend IP address
4. upload firmware to ESP32
5. power the wristband
6. verify OLED status
7. trigger a test notification from the web app

## Notes
- This component was added inside the existing project.
- Existing components were not removed.
- The current preview is production-friendly for the existing stack and is ready for a future full Three.js hardware viewer upgrade.
