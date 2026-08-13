"""
ml/attention_detector.py
---
Real-time attention detection using MediaPipe Face Mesh.

Rules (MVP):
  - Eye Aspect Ratio (EAR) < 0.21  → eyes closed → NOT ATTENTIVE
  - Head yaw  > ±30° OR pitch > ±25°  → looking away → NOT ATTENTIVE
  - Otherwise → ATTENTIVE

Usage:
    detector = AttentionDetector()
    result = detector.analyze_frame(frame_bgr_numpy_array)
    # result = {"status": "attentive"|"not_attentive",
    #           "ear": 0.28, "yaw": 5.2, "pitch": -3.1, "roll": 1.0}
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Optional


# MediaPipe face mesh landmark indices for eyes
LEFT_EYE  = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33,  160, 158, 133, 153, 144]

# 3D model points for head pose estimation (OpenCV camera coordinates: X right, Y down, Z forward)
MODEL_POINTS = np.array([
    (0.0, 0.0, 0.0),             # Nose tip
    (0.0, 330.0, 65.0),          # Chin
    (-225.0, -170.0, 135.0),     # Left eye corner
    (225.0, -170.0, 135.0),      # Right eye corner
    (-150.0, 150.0, 125.0),      # Left mouth corner
    (150.0, 150.0, 125.0)        # Right mouth corner
], dtype=np.float64)

# MediaPipe indices matching MODEL_POINTS above
FACE_INDICES = [1, 152, 33, 263, 61, 291]


def _eye_aspect_ratio(landmarks, eye_indices, w, h) -> float:
    """Compute EAR for one eye given face mesh landmarks."""
    pts = []
    for idx in eye_indices:
        lm = landmarks[idx]
        pts.append((lm.x * w, lm.y * h))

    # Vertical distances
    A = np.linalg.norm(np.array(pts[1]) - np.array(pts[5]))
    B = np.linalg.norm(np.array(pts[2]) - np.array(pts[4]))
    # Horizontal distance
    C = np.linalg.norm(np.array(pts[0]) - np.array(pts[3]))
    return (A + B) / (2.0 * C + 1e-6)


class AttentionDetector:
    EAR_THRESHOLD   = 0.21
    YAW_THRESHOLD   = 30.0   # degrees
    PITCH_THRESHOLD = 25.0   # degrees

    def __init__(self):
        self.mp_face = mp.solutions.face_mesh
        self.face_mesh = self.mp_face.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

    def analyze_frame(self, frame_bgr: np.ndarray) -> dict:
        """
        Analyze a single BGR frame.
        Returns dict with status, ear, yaw, pitch, roll.
        """
        h, w = frame_bgr.shape[:2]
        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb)

        if not results.multi_face_landmarks:
            # No face detected → treat as NOT ATTENTIVE
            return {
                "status": "not_attentive",
                "reason": "no_face",
                "ear": 0.0,
                "yaw": 0.0,
                "pitch": 0.0,
                "roll": 0.0,
            }

        landmarks = results.multi_face_landmarks[0].landmark

        # ── Eye Aspect Ratio ─────────────────────────────────────────
        left_ear  = _eye_aspect_ratio(landmarks, LEFT_EYE,  w, h)
        right_ear = _eye_aspect_ratio(landmarks, RIGHT_EYE, w, h)
        ear = (left_ear + right_ear) / 2.0

        # ── Head Pose Estimation ──────────────────────────────────────
        image_points = np.array([
            (landmarks[i].x * w, landmarks[i].y * h)
            for i in FACE_INDICES
        ], dtype=np.float64)

        focal_length = w
        cam_matrix = np.array([
            [focal_length, 0, w / 2],
            [0, focal_length, h / 2],
            [0, 0, 1],
        ], dtype=np.float64)

        dist_coeffs = np.zeros((4, 1))
        success, rvec, tvec = cv2.solvePnP(
            MODEL_POINTS, image_points, cam_matrix, dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE
        )

        yaw = pitch = roll = 0.0
        if success:
            rmat, _ = cv2.Rodrigues(rvec)
            angles, *_ = cv2.RQDecomp3x3(rmat)
            pitch, yaw, roll = angles[0], angles[1], angles[2]

        # ── Classification ────────────────────────────────────────────
        eyes_closed  = ear < self.EAR_THRESHOLD
        looking_away = abs(yaw) > self.YAW_THRESHOLD or abs(pitch) > self.PITCH_THRESHOLD

        if eyes_closed:
            status, reason = "not_attentive", "eyes_closed"
        elif looking_away:
            status, reason = "not_attentive", "head_turned"
        else:
            status, reason = "attentive", "ok"

        return {
            "status": status,
            "reason": reason,
            "ear": round(float(ear), 3),
            "yaw": round(float(yaw), 2),
            "pitch": round(float(pitch), 2),
            "roll": round(float(roll), 2),
            "eye_open": not eyes_closed,
            "head_pose_deviation": round(float(abs(yaw)), 2),
        }

    def __del__(self):
        self.face_mesh.close()
