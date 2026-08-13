# Component 05: Smart Wristband IoT

## Purpose
Controls wristband alert settings, test notifications, and wristband history for attention-aware learning support.

## Folder Explanation
- `pages/`: wristband dashboard page
- `components/`: wristband preview UI
- `services/`: wristband API client
- `firmware/`: reserved for device-facing assets
- `models3d/`, `data/`, `utils/`, `docs/`: supporting resources

## APIs Used
- `/api/wristband/config`
- `/api/wristband/test`
- `/api/wristband/notify`
- `/api/wristband/history/{student_id}`
- `/api/wristband/device/{student_id}`

## Database Models
- `wristband`
- `wristband device`
- `wristband notification history`

## ML/Dataset Files
- Wristband alert preset data is stored in backend component 05 patterns
- ESP32 firmware is stored in backend component 05 firmware

## How To Test
Open `/wristband`, save a config, send a test notification, and confirm history and device status update.

## Related Frontend Pages
- `WristbandPage.jsx`

## Related Backend Routes
- component 05 backend routes under `backend/src/modules/component_05_smart_wristband_iot/routes`
