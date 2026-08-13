"""
ml/hand_tracker.py
---
Extract hand landmarks from video frames using MediaPipe Hands.
Used by the transcription pipeline to process uploaded lecture videos.
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Optional, List, Dict


class HandTracker:
    def __init__(self, max_hands: int = 2):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=max_hands,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6,
        )

    def extract_landmarks(self, frame_bgr: np.ndarray) -> Optional[List[Dict]]:
        """
        Extract hand landmarks from a BGR frame.
        Returns a list of dicts, one per detected hand.
        Each dict has 'landmarks': list of 21 {x, y, z} points.
        Returns None if no hands detected.
        """
        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb)

        if not results.multi_hand_landmarks:
            return None

        hand_data = []
        for hand_landmarks in results.multi_hand_landmarks:
            landmarks = [
                {"x": lm.x, "y": lm.y, "z": lm.z}
                for lm in hand_landmarks.landmark
            ]
            hand_data.append({"landmarks": landmarks})

        return hand_data

    def flatten_landmarks(self, hand_data: List[Dict]) -> np.ndarray:
        """
        Flatten the first hand's 21 landmarks into a 63-element feature vector
        [x0,y0,z0, x1,y1,z1, ... x20,y20,z20].
        Used as input to the sign classifier.
        """
        if not hand_data:
            return np.zeros(63, dtype=np.float32)
        lms = hand_data[0]["landmarks"]
        return np.array([[l["x"], l["y"], l["z"]] for l in lms],
                        dtype=np.float32).flatten()

    def __del__(self):
        self.hands.close()
