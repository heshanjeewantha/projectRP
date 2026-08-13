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
    "COMPUTER", "SOFTWARE", "HARDWARE", "SECURITY", "INTERNET",
    "NETWORK", "CLOUD", "SERVER", "PROGRAMMING", "DATABASE", "UNKNOWN"
]

# Human-readable explanations shown in popups
SIGN_EXPLANATIONS = {
    "COMPUTER":    "Type on an invisible keyboard.",
    "SOFTWARE":    "Hand sliding over the other hand.",
    "HARDWARE":    "Knocking on the back of the hand.",
    "SECURITY":    "One hand locking the other.",
    "INTERNET":    "Middle fingers move in a circle touching.",
    "NETWORK":     "Fingers interlocked and moving together.",
    "CLOUD":       "C-shapes drawing a cloud.",
    "SERVER":      "Hands moving down tracing a rack.",
    "PROGRAMMING": "Both hands typing rapidly.",
    "DATABASE":    "Two C-shapes stacked.",
    "UNKNOWN":     "Sign not recognized.",
}


def _thumb_angle(landmarks: np.ndarray) -> float:
    """Angle between thumb tip and wrist (rough heuristic)."""
    wrist = landmarks[0]
    thumb_tip = landmarks[4]
    v = thumb_tip - wrist
    return float(np.degrees(np.arctan2(v[1], v[0])))


def _finger_extended(landmarks: np.ndarray, tip: int, pip: int) -> bool:
    """True if fingertip is further from wrist than PIP joint (orientation invariant)."""
    wrist = landmarks[0]
    tip_dist = np.linalg.norm(landmarks[tip] - wrist)
    pip_dist = np.linalg.norm(landmarks[pip] - wrist)
    return tip_dist > pip_dist


class SignClassifier:
    """
    Mock rule-based sign classifier.
    Replace `predict()` internals with model inference when available.
    """

    def predict(self, landmark_vector: np.ndarray) -> dict:
        """
        Predict sign label from a 63-element landmark vector.
        Returns: { label, confidence, explanation }
        """
        if landmark_vector is None or landmark_vector.shape[0] < 63:
            return self._result("UNKNOWN", 0.0)

        # Reshape to (21, 3)
        lms = landmark_vector.reshape(21, 3)

        # Finger extension flags (tip_idx, pip_idx)
        index_ext  = _finger_extended(lms, 8,  6)
        middle_ext = _finger_extended(lms, 12, 10)
        ring_ext   = _finger_extended(lms, 16, 14)
        pinky_ext  = _finger_extended(lms, 20, 18)
        thumb_ext  = _finger_extended(lms, 4,  3)

        n_ext = sum([index_ext, middle_ext, ring_ext, pinky_ext, thumb_ext])

        # ── Heuristic rules ───────────────────────────────────────────────
        if thumb_ext and index_ext and not middle_ext and not ring_ext and pinky_ext:
            return self._result("SERVER", 0.88)

        if n_ext == 5:  # All fingers extended
            return self._result("COMPUTER", 0.85)

        if n_ext == 0:  # Fist
            thumb_ang = _thumb_angle(lms)
            if -90 < thumb_ang < 30:
                return self._result("HARDWARE", 0.80)
            return self._result("CLOUD", 0.72)

        if index_ext and middle_ext and not ring_ext and not pinky_ext:
            return self._result("SECURITY", 0.78)

        if not index_ext and not middle_ext and not ring_ext and not pinky_ext:
            return self._result("DATABASE", 0.75)

        if index_ext and not middle_ext and not ring_ext and not pinky_ext:
            return self._result("PROGRAMMING", 0.70)

        if middle_ext and ring_ext and not index_ext and not pinky_ext:
            return self._result("INTERNET", 0.65)

        if n_ext >= 3 and thumb_ext:
            return self._result("NETWORK", 0.62)

        if index_ext and middle_ext and ring_ext and not pinky_ext:
            return self._result("SOFTWARE", 0.68)

        return self._result("UNKNOWN", 0.40)

    @staticmethod
    def _result(label: str, confidence: float) -> dict:
        return {
            "label": label,
            "confidence": round(confidence, 2),
            "explanation": SIGN_EXPLANATIONS.get(label, ""),
        }
