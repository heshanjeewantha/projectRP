"""
ml/phone_detector.py
---
MediaPipe Hands & Face Mesh Spatial Phone Usage Detector.

Detects phone usage postures with high accuracy:
  1. Hand held against ear/side of head (phone call posture)
  2. Hand raised directly in front of lower face/mouth (texting/holding phone up)

Lazy initialization ensures 0-second server startup.
"""

import numpy as np
import cv2
import mediapipe as mp


class PhoneDetector:
    """
    High-accuracy Phone Detector using MediaPipe Hands + Face Mesh spatial relationship.
    """

    CONFIRM_FRAMES = 2   # Require 2 consecutive positive detections
    CLEAR_FRAMES   = 3   # Require 3 consecutive clear frames to reset

    def __init__(self):
        self._positive_streak = 0
        self._negative_streak = 0
        self._currently_detected = False
        self._face_mesh = None
        self._hands = None

    def _ensure_initialized(self):
        """Lazy load MediaPipe solutions on first frame."""
        if self._face_mesh is None:
            self._mp_face = mp.solutions.face_mesh
            self._face_mesh = self._mp_face.FaceMesh(
                static_image_mode=False,
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5,
            )

        if self._hands is None:
            self._mp_hands = mp.solutions.hands
            self._hands = self._mp_hands.Hands(
                static_image_mode=False,
                max_num_hands=2,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5,
            )

    def analyze_frame(self, frame_bgr: np.ndarray) -> dict:
        """
        Analyze BGR frame for cell phone usage posture.
        Returns: { phone_detected: bool, phone_confidence: float }
        """
        self._ensure_initialized()
        raw_detected, raw_confidence = self._detect_phone_posture(frame_bgr)

        if raw_detected:
            self._positive_streak += 1
            self._negative_streak = 0
        else:
            self._negative_streak += 1
            self._positive_streak = 0

        # State hysteresis
        if not self._currently_detected and self._positive_streak >= self.CONFIRM_FRAMES:
            self._currently_detected = True
        elif self._currently_detected and self._negative_streak >= self.CLEAR_FRAMES:
            self._currently_detected = False

        confidence = raw_confidence if self._currently_detected else 0.0

        return {
            "phone_detected": self._currently_detected,
            "phone_confidence": round(confidence, 2),
        }

    def _detect_phone_posture(self, frame_bgr: np.ndarray):
        """
        Calculates spatial distance between hand landmarks and face landmarks.
        """
        h, w = frame_bgr.shape[:2]
        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)

        face_res = self._face_mesh.process(rgb)
        hand_res = self._hands.process(rgb)

        if not face_res.multi_face_landmarks or not hand_res.multi_hand_landmarks:
            return False, 0.0

        face_lms = face_res.multi_face_landmarks[0].landmark

        # Key face landmarks
        left_ear  = np.array([face_lms[234].x * w, face_lms[234].y * h])  # Left tragus/ear
        right_ear = np.array([face_lms[454].x * w, face_lms[454].y * h])  # Right tragus/ear
        chin      = np.array([face_lms[152].x * w, face_lms[152].y * h])  # Chin
        nose      = np.array([face_lms[1].x * w,   face_lms[1].y * h])    # Nose tip

        # Estimate face width scale
        face_width = np.linalg.norm(left_ear - right_ear)
        if face_width < 10:
            return False, 0.0

        threshold_dist = face_width * 0.45  # Distance threshold relative to face size

        for hand_lms in hand_res.multi_hand_landmarks:
            # Check key hand points: Wrist (0), Index MCP (5), Middle MCP (9), Pinky MCP (17), Middle Tip (12)
            hand_pts = [
                np.array([hand_lms.landmark[i].x * w, hand_lms.landmark[i].y * h])
                for i in [0, 5, 9, 12, 17]
            ]

            for hp in hand_pts:
                dist_left_ear  = np.linalg.norm(hp - left_ear)
                dist_right_ear = np.linalg.norm(hp - right_ear)
                dist_chin      = np.linalg.norm(hp - chin)

                # 1. Phone Call Posture: Hand near left or right ear
                if dist_left_ear < threshold_dist or dist_right_ear < threshold_dist:
                    confidence = 0.88 - min(dist_left_ear, dist_right_ear) / (threshold_dist * 2)
                    return True, max(0.70, round(confidence, 2))

                # 2. Texting / Holding phone up in front of face: Hand raised near chin
                if dist_chin < (threshold_dist * 0.7) and hp[1] < chin[1] + (face_width * 0.2):
                    return True, 0.82

        return False, 0.0

    def __del__(self):
        try:
            if self._face_mesh:
                self._face_mesh.close()
            if self._hands:
                self._hands.close()
        except Exception:
            pass
