"""
ml/sign_classifier.py
---
MVP Mock Sign Classifier
------------------------
In production, this would load a trained TFLite / PyTorch model.
For MVP, we use rule-based heuristics on hand landmark geometry
to classify a small set of ASL signs.

Signs covered (MVP demo):
  HELLO, THANK_YOU, YES, NO, WATER, PLEASE, SORRY, I_LOVE_YOU, HELP, STOP
"""

import numpy as np
from typing import Optional


# ── Labels ───────────────────────────────────────────────────────────────────
SIGN_LABELS = [
    "PALM", "PEACE", "FIST", "THUMBS_UP", "COMPUTER", "SOFTWARE", "HARDWARE", "SECURITY", "INTERNET",
    "NETWORK", "CLOUD", "SERVER", "PROGRAMMING", "DATABASE", "UNKNOWN"
]

# Human-readable explanations shown in popups & HUD
SIGN_EXPLANATIONS = {
    "PALM":        "Open Palm 🖐️ — Skip forward +10 seconds.",
    "PEACE":       "Peace Sign ✌️ — Rewind -10 seconds.",
    "FIST":        "Closed Fist ✊ — Toggle Play / Pause.",
    "THUMBS_UP":   "Thumbs Up 👍 — Toggle Play / Pause.",
    "COMPUTER":    "Computer — Type on an invisible keyboard.",
    "SOFTWARE":    "Software — Hand sliding over the other hand.",
    "HARDWARE":    "Hardware — Knocking on the back of the hand.",
    "SECURITY":    "Security — One hand locking the other.",
    "INTERNET":    "Internet — Middle fingers move in a circle touching.",
    "NETWORK":     "Network — Fingers interlocked and moving together.",
    "CLOUD":       "Cloud — C-shapes drawing a cloud.",
    "SERVER":      "Server — Hands moving down tracing a rack.",
    "PROGRAMMING": "Programming — Both hands typing rapidly.",
    "DATABASE":    "Database — Two C-shapes stacked.",
    "UNKNOWN":     "Sign not recognized.",
}


def _is_finger_open(landmarks: np.ndarray, tip: int, pip: int, mcp: int) -> bool:
    """
    Robust check if finger is open/extended:
    Tip is further from wrist than PIP, and tip is further from MCP than PIP is from MCP.
    """
    wrist = landmarks[0]
    tip_to_wrist = np.linalg.norm(landmarks[tip] - wrist)
    pip_to_wrist = np.linalg.norm(landmarks[pip] - wrist)
    mcp_to_wrist = np.linalg.norm(landmarks[mcp] - wrist)
    return tip_to_wrist > pip_to_wrist and tip_to_wrist > (mcp_to_wrist * 1.12)


def _is_thumb_open(landmarks: np.ndarray) -> bool:
    """Check if thumb is extended away from palm."""
    wrist = landmarks[0]
    thumb_tip = landmarks[4]
    thumb_ip = landmarks[3]
    thumb_mcp = landmarks[2]
    pinky_mcp = landmarks[17]

    tip_spread = np.linalg.norm(thumb_tip - pinky_mcp)
    ip_spread = np.linalg.norm(thumb_ip - pinky_mcp)
    tip_to_wrist = np.linalg.norm(thumb_tip - wrist)
    mcp_to_wrist = np.linalg.norm(thumb_mcp - wrist)

    return (tip_spread > ip_spread * 1.08) or (tip_to_wrist > mcp_to_wrist * 1.15)


class SignClassifier:
    """
    Real-time rule-based gesture & sign classifier for Smart Lesson platform.
    """

    def predict(self, landmark_vector: np.ndarray) -> dict:
        """
        Predict sign label and gesture action from a 63-element landmark vector.
        Returns: { label, confidence, gesture_action, explanation }
        """
        if landmark_vector is None or landmark_vector.shape[0] < 63:
            return self._result("UNKNOWN", 0.0)

        # Reshape to (21, 3)
        lms = landmark_vector.reshape(21, 3)

        # Finger extension flags (tip_idx, pip_idx, mcp_idx)
        index_ext  = _is_finger_open(lms, 8,  6,  5)
        middle_ext = _is_finger_open(lms, 12, 10, 9)
        ring_ext   = _is_finger_open(lms, 16, 14, 13)
        pinky_ext  = _is_finger_open(lms, 20, 18, 17)
        thumb_ext  = _is_thumb_open(lms)

        n_ext = sum([index_ext, middle_ext, ring_ext, pinky_ext, thumb_ext])

        # ── Smart Lesson Video Control Gestures ─────────────────────────
        # 1. 🖐️ Open Palm -> Skip Forward +10s (4 or 5 extended fingers)
        if (index_ext and middle_ext and ring_ext and pinky_ext) or (n_ext >= 4 and index_ext and middle_ext):
            return self._result("PALM", 0.94, gesture_action="SKIP_FORWARD_10S")

        # 2. ✌️ Peace Sign -> Skip Backward -10s (Index & Middle open, Ring & Pinky closed)
        if index_ext and middle_ext and not ring_ext and not pinky_ext:
            return self._result("PEACE", 0.92, gesture_action="SKIP_BACKWARD_10S")

        # 3. 👍 Thumbs Up / ✊ Closed Fist -> Unified ONE sign for Play / Pause Toggle
        if thumb_ext and not index_ext and not middle_ext and not ring_ext and not pinky_ext:
            return self._result("THUMBS_UP", 0.92, gesture_action="TOGGLE_PLAY_PAUSE")

        if not index_ext and not middle_ext and not ring_ext and not pinky_ext:
            return self._result("FIST", 0.90, gesture_action="TOGGLE_PLAY_PAUSE")

        # ── Curriculum Sign Heuristics ──────────────────────────────────
        if thumb_ext and index_ext and not middle_ext and not ring_ext and pinky_ext:
            return self._result("SERVER", 0.88)

        if index_ext and not middle_ext and not ring_ext and not pinky_ext:
            return self._result("PROGRAMMING", 0.75)

        if middle_ext and ring_ext and not index_ext and not pinky_ext:
            return self._result("INTERNET", 0.70)

        if index_ext and middle_ext and ring_ext and not pinky_ext:
            return self._result("SOFTWARE", 0.72)

        return self._result("UNKNOWN", 0.40)

    @staticmethod
    def _result(label: str, confidence: float, gesture_action: str | None = None) -> dict:
        return {
            "label": label,
            "confidence": round(confidence, 2),
            "gesture_action": gesture_action,
            "explanation": SIGN_EXPLANATIONS.get(label, ""),
        }
