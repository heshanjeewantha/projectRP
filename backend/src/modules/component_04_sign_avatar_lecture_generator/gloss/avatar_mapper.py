"""Placeholder mapper from predicted sign labels to future avatar motion data."""
from __future__ import annotations


def map_predicted_sign_to_avatar(predicted_sign: str) -> dict:
    normalized = (predicted_sign or "UNKNOWN").upper()
    return {
        "predicted_sign": normalized,
        "animation_sequence": [normalized],
        "avatar_motion_data": {
            "source": "wlasl-placeholder",
            "rigProfile": "future-threejs-blender-unity",
            "clipName": normalized.lower(),
            "notes": "Replace this placeholder mapping with real avatar animation clips later.",
        },
    }
