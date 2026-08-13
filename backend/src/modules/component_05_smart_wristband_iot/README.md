# Component 05: Smart Wristband IoT

## Purpose
Stores wristband device state, vibration presets, notification history, and test/system notification flows for the smart wristband prototype.

## Folder Explanation
- `routes/`: wristband config, notify, device, and history endpoints
- `services/`: preset resolution, device updates, and event persistence
- `models/`: wristband request/response models
- `patterns/`: alert preset JSON
- `firmware/`: ESP32 device sketch
- `device-config/`, `utils/`, `docs/`: reserved for future extensions

## APIs Used
- `/api/wristband/config`
- `/api/wristband/test`
- `/api/wristband/notify`
- `/api/wristband/history/{student_id}`
- `/api/wristband/device/{student_id}`

## Database Models
- `wristbandDevices`
- `wristbandConfigs`
- `wristbandNotifications`
- `wristbandEventHistory`

## ML/Dataset Files
- `patterns/wristband_alert_presets.json`
- `firmware/SmartHapticWristband.ino`

## How To Test
Save a configuration, send test and system notifications, and verify history and device endpoints return updated data.

## Related Frontend Pages
- `frontend/src/modules/component-05-smart-wristband-iot/pages/WristbandPage.jsx`

## Related Backend Routes
- `wristband_routes.py`
