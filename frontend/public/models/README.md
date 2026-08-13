# SignLearn VRM interpreter asset

Place a licensed, humanoid `.vrm` avatar at:

`frontend/public/models/avatar.vrm`

Or configure a different public asset URL in `frontend/.env`:

```env
VITE_VRM_AVATAR_URL=/models/your-reviewed-interpreter.vrm
```

The avatar must contain head, neck, spine, chest, shoulder, arm, hand, and
finger bones in the standard VRM humanoid hierarchy. SignLearn rejects models
without this complete rig and does not render a primitive-avatar fallback.
