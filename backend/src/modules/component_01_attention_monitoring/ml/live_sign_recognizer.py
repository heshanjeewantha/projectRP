"""
ml/live_sign_recognizer.py
---
Real-time sign language recognition from single webcam frames.

Reuses HandTracker + SignClassifier pipeline with lazy initialization
for fast server startup.
"""

import numpy as np
from typing import Optional

from src.modules.component_01_attention_monitoring.ml.hand_tracker import HandTracker
from src.modules.component_01_attention_monitoring.ml.sign_classifier import SignClassifier, SIGN_EXPLANATIONS


MIN_SIGN_CONFIDENCE = 0.50
SIGN_CONFIRM_FRAMES = 1


class LiveSignRecognizer:
    """
    Wraps HandTracker + SignClassifier for real-time single-frame sign recognition.
    """

    def __init__(self):
        self._tracker = None
        self._classifier = None

        # Temporal smoothing state
        self._last_sign: Optional[str] = None
        self._sign_streak: int = 0
        self._stable_sign: Optional[str] = None
        self._stable_confidence: float = 0.0

    def _ensure_initialized(self):
        if self._tracker is None:
            self._tracker = HandTracker(max_hands=2)
            self._classifier = SignClassifier()

    def analyze_frame(self, frame_bgr: np.ndarray) -> dict:
        """
        Detect hand sign in a single BGR frame.
        """
        self._ensure_initialized()
        hand_data = self._tracker.extract_landmarks(frame_bgr)

        if not hand_data:
            self._sign_streak = 0
            return {
                "hand_detected": False,
                "sign_text": None,
                "sign_confidence": 0.0,
                "sign_explanation": "",
            }

        landmark_vec = self._tracker.flatten_landmarks(hand_data)
        prediction = self._classifier.predict(landmark_vec)

        label = prediction["label"]
        confidence = prediction["confidence"]

        if label == self._last_sign:
            self._sign_streak += 1
        else:
            self._sign_streak = 1
            self._last_sign = label

        if self._sign_streak >= SIGN_CONFIRM_FRAMES and confidence >= MIN_SIGN_CONFIDENCE:
            self._stable_sign = label
            self._stable_confidence = confidence
        elif label == "UNKNOWN" and self._sign_streak >= SIGN_CONFIRM_FRAMES:
            self._stable_sign = None
            self._stable_confidence = 0.0

        sign_text = self._stable_sign if self._stable_sign and self._stable_sign != "UNKNOWN" else None
        gesture_action = prediction.get("gesture_action") if sign_text else None

        return {
            "hand_detected": True,
            "sign_text": sign_text,
            "sign_confidence": round(self._stable_confidence, 2) if sign_text else 0.0,
            "gesture_action": gesture_action,
            "sign_explanation": SIGN_EXPLANATIONS.get(sign_text, "") if sign_text else "",
        }

    def __del__(self):
        try:
            if self._tracker:
                del self._tracker
        except Exception:
            pass
