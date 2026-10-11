"""
ml/phone_detector.py
---
MediaPipe Hands & Face Mesh Spatial Phone-in-Hand Detector.

Detects phone-in-hand usage postures with high accuracy:
  1. Phone-in-Hand (Texting / Holding up): Hand raised in front of chest/chin with phone grip.
  2. Phone-in-Hand (Desk / Lap Texting): Hand resting in lower field-of-view with downward gaze/pitch.
  3. Dual-Hand Phone Holding: Both hands held close together in typing formation.

Lazy initialization ensures 0-second server startup.
"""

import numpy as np
import cv2
import mediapipe as mp


class PhoneDetector:
    """
    High-accuracy Phone-in-Hand Detector using MediaPipe Hands + Face Mesh.
    """

    CONFIRM_FRAMES = 2   # Require 2 consecutive positive detections
    CLEAR_FRAMES   = 3   # Require 3 consecutive clear frames to reset

    def __init__(self):
        self._positive_streak = 0
        self._negative_streak = 0
        self._currently_detected = False
        self._current_posture = "none"
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
        Analyze BGR frame for cell phone in hand posture.
        Returns: {
            phone_detected: bool,
            phone_in_hand: bool,
            phone_posture: str,
            phone_confidence: float
        }
        """
        self._ensure_initialized()
        raw_detected, raw_posture, raw_confidence = self._detect_phone_posture(frame_bgr)

        if raw_detected:
            self._positive_streak += 1
            self._negative_streak = 0
            self._current_posture = raw_posture
        else:
            self._negative_streak += 1
            self._positive_streak = 0

        # State hysteresis
        if not self._currently_detected and self._positive_streak >= self.CONFIRM_FRAMES:
            self._currently_detected = True
        elif self._currently_detected and self._negative_streak >= self.CLEAR_FRAMES:
            self._currently_detected = False
            self._current_posture = "none"

        confidence = raw_confidence if self._currently_detected else 0.0
        is_phone_in_hand = self._currently_detected and ("in_hand" in self._current_posture or "texting" in self._current_posture)

        return {
            "phone_detected": self._currently_detected,
            "phone_in_hand": is_phone_in_hand,
            "phone_posture": self._current_posture if self._currently_detected else "none",
            "phone_confidence": round(confidence, 2),
        }

    def _detect_phone_posture(self, frame_bgr: np.ndarray):
        """
        Calculates spatial distance and hand grip geometry for phone-in-hand.
        Returns: (detected: bool, posture: str, confidence: float)
        """
        h, w = frame_bgr.shape[:2]
        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)

        face_res = self._face_mesh.process(rgb)
        hand_res = self._hands.process(rgb)

        if not hand_res.multi_hand_landmarks:
            return False, "none", 0.0

        # If any hand is showing an open gesture (palm/peace/raised), NEVER detect as phone
        for hand_lms in hand_res.multi_hand_landmarks:
            if self._is_open_gesture(hand_lms.landmark):
                return False, "none", 0.0

        if not face_res.multi_face_landmarks:
            # If no face but hand in lower center with tight phone grip, check desk phone
            for hand_lms in hand_res.multi_hand_landmarks:
                wrist = hand_lms.landmark[0]
                if wrist.y > 0.5:
                    if self._is_phone_grip(hand_lms.landmark, w, h):
                        return True, "phone_in_hand_desk", 0.75
            return False, "none", 0.0

        face_lms = face_res.multi_face_landmarks[0].landmark

        # Key face landmarks
        left_ear  = np.array([face_lms[234].x * w, face_lms[234].y * h])  # Left tragus/ear
        right_ear = np.array([face_lms[454].x * w, face_lms[454].y * h])  # Right tragus/ear
        chin      = np.array([face_lms[152].x * w, face_lms[152].y * h])  # Chin
        nose      = np.array([face_lms[1].x * w,   face_lms[1].y * h])    # Nose tip
        forehead  = np.array([face_lms[10].x * w,  face_lms[10].y * h])   # Forehead top

        # Face scale and head pitch
        face_width = np.linalg.norm(left_ear - right_ear)
        face_height = np.linalg.norm(forehead - chin)
        if face_width < 10 or face_height < 10:
            return False, "none", 0.0

        threshold_dist = face_width * 0.48

        # Head pitch downward indicator: nose is significantly lower relative to ears
        ears_mid_y = (left_ear[1] + right_ear[1]) / 2.0
        is_looking_down = nose[1] > ears_mid_y + (face_height * 0.08)

        for hand_lms in hand_res.multi_hand_landmarks:
            # If the user is showing an open hand / gesture (palm, peace, open fingers), NOT a phone
            if self._is_open_gesture(hand_lms.landmark):
                continue

            wrist_y = hand_lms.landmark[0].y
            has_phone_grip = self._is_phone_grip(hand_lms.landmark, w, h)

            # 1. Texting / Holding phone near chest/chin (Only if looking down and gripping an object)
            if is_looking_down and has_phone_grip:
                hand_pts = [
                    np.array([hand_lms.landmark[i].x * w, hand_lms.landmark[i].y * h])
                    for i in [0, 4, 5, 9, 12, 17]
                ]
                for hp in hand_pts:
                    dist_chin = np.linalg.norm(hp - chin)
                    if dist_chin < (threshold_dist * 0.75):
                        return True, "phone_in_hand_texting", 0.86

            # 2. Phone in Hand (Desk / Lap texting): Hand resting low + looking downward + phone grip
            if wrist_y > 0.52 and is_looking_down and has_phone_grip:
                return True, "phone_in_hand_desk", 0.84

        return False, "none", 0.0

    def _is_open_gesture(self, lms) -> bool:
        """True if hand has extended fingers (e.g. Open Palm, Peace, Thumbs Up)."""
        try:
            wrist = np.array([lms[0].x, lms[0].y])
            idx_tip = np.array([lms[8].x, lms[8].y])
            idx_mcp = np.array([lms[5].x, lms[5].y])
            mid_tip = np.array([lms[12].x, lms[12].y])
            mid_mcp = np.array([lms[9].x, lms[9].y])
            ring_tip = np.array([lms[16].x, lms[16].y])
            ring_mcp = np.array([lms[13].x, lms[13].y])

            idx_open = np.linalg.norm(idx_tip - wrist) > np.linalg.norm(idx_mcp - wrist) * 1.15
            mid_open = np.linalg.norm(mid_tip - wrist) > np.linalg.norm(mid_mcp - wrist) * 1.15
            ring_open = np.linalg.norm(ring_tip - wrist) > np.linalg.norm(ring_mcp - wrist) * 1.15

            # If 2 or more fingers are open, it is an open gesture, not phone grip
            return sum([idx_open, mid_open, ring_open]) >= 2
        except Exception:
            return False

    def _is_phone_grip(self, lms, w: int, h: int) -> bool:
        """
        Heuristic for smartphone grip:
        Fingertips (8, 12, 16, 20) are curved inward towards MCP palm joints (5, 9, 13, 17)
        while thumb (4) has lateral spread.
        """
        try:
            # Distance from Index Tip (8) to Index MCP (5)
            idx_tip = np.array([lms[8].x * w, lms[8].y * h])
            idx_mcp = np.array([lms[5].x * w, lms[5].y * h])
            # Distance from Middle Tip (12) to Middle MCP (9)
            mid_tip = np.array([lms[12].x * w, lms[12].y * h])
            mid_mcp = np.array([lms[9].x * w, lms[9].y * h])
            # Wrist
            wrist = np.array([lms[0].x * w, lms[0].y * h])

            palm_size = np.linalg.norm(idx_mcp - wrist)
            if palm_size < 5:
                return False

            idx_curl = np.linalg.norm(idx_tip - idx_mcp) / palm_size
            mid_curl = np.linalg.norm(mid_tip - mid_mcp) / palm_size

            # Curled fingers holding an object
            return (idx_curl < 0.95 and mid_curl < 0.95)
        except Exception:
            return False

    def __del__(self):
        try:
            if self._face_mesh:
                self._face_mesh.close()
            if self._hands:
                self._hands.close()
        except Exception:
            pass

