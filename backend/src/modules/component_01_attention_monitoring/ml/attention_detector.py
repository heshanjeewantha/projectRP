"""
ml/attention_detector.py
---
Real-time attention detection using MediaPipe Face Mesh.

Detection signals:
  - EAR (Eye Aspect Ratio)    → eyes closed / blinking
  - PERCLOS                   → % eye closure over rolling window → drowsiness
  - MAR (Mouth Aspect Ratio)  → yawning detection
  - Head pose (yaw/pitch/roll)→ looking away
  - Blink rate                → blinks per minute
  - Gaze direction            → iris position relative to eye corners

Status priority (highest to lowest):
  drowsy > phone_detected (handled in WS route) > yawning > head_turned > eyes_closed > ok
"""

import cv2
import numpy as np
import mediapipe as mp
from collections import deque
from typing import Optional


# ── Eye landmark indices (MediaPipe Face Mesh) ───────────────────────────────
LEFT_EYE   = [362, 385, 387, 263, 373, 380]
RIGHT_EYE  = [33,  160, 158, 133, 153, 144]

# Iris landmarks (refine_landmarks=True required)
LEFT_IRIS  = [474, 475, 476, 477]
RIGHT_IRIS = [469, 470, 471, 472]

# Mouth landmarks for MAR
MOUTH_OUTER = [61, 291, 81, 178, 13, 14, 311, 402]  # outer lip
# Vertical: top (13), bottom (14); Horizontal: left (61), right (291)
MOUTH_VERTICAL   = [13, 14]
MOUTH_HORIZONTAL = [61, 291]
# Extra vertical pairs for MAR
MOUTH_V1 = [81, 178]
MOUTH_V2 = [311, 402]

# 3D model points for head pose
MODEL_POINTS = np.array([
    (0.0,    0.0,    0.0),         # Nose tip
    (0.0,    330.0,  65.0),        # Chin
    (-225.0, -170.0, 135.0),       # Left eye corner
    (225.0,  -170.0, 135.0),       # Right eye corner
    (-150.0,  150.0, 125.0),       # Left mouth corner
    (150.0,   150.0, 125.0),       # Right mouth corner
], dtype=np.float64)

FACE_INDICES = [1, 152, 33, 263, 61, 291]


# ── Helper functions ──────────────────────────────────────────────────────────

def _eye_aspect_ratio(landmarks, eye_indices, w, h) -> float:
    """Compute EAR for one eye."""
    pts = [(landmarks[i].x * w, landmarks[i].y * h) for i in eye_indices]
    A = np.linalg.norm(np.array(pts[1]) - np.array(pts[5]))
    B = np.linalg.norm(np.array(pts[2]) - np.array(pts[4]))
    C = np.linalg.norm(np.array(pts[0]) - np.array(pts[3]))
    return (A + B) / (2.0 * C + 1e-6)


def _mouth_aspect_ratio(landmarks, w, h) -> float:
    """Compute MAR (Mouth Aspect Ratio) to detect yawning."""
    # Vertical distances
    p13 = np.array([landmarks[13].x * w, landmarks[13].y * h])
    p14 = np.array([landmarks[14].x * w, landmarks[14].y * h])
    p81 = np.array([landmarks[81].x * w, landmarks[81].y * h])
    p178 = np.array([landmarks[178].x * w, landmarks[178].y * h])
    p311 = np.array([landmarks[311].x * w, landmarks[311].y * h])
    p402 = np.array([landmarks[402].x * w, landmarks[402].y * h])

    A = np.linalg.norm(p13 - p14)
    B = np.linalg.norm(p81 - p178)
    C_pair = np.linalg.norm(p311 - p402)

    # Horizontal distance
    p61  = np.array([landmarks[61].x * w, landmarks[61].y * h])
    p291 = np.array([landmarks[291].x * w, landmarks[291].y * h])
    D = np.linalg.norm(p61 - p291)

    return (A + B + C_pair) / (3.0 * D + 1e-6)


def _gaze_direction(landmarks, w, h) -> str:
    """
    Estimate gaze direction using iris center vs eye corner midpoint.
    Returns: 'center', 'left', 'right', 'up', 'down'
    """
    try:
        # Right iris center
        iris_pts = [(landmarks[i].x * w, landmarks[i].y * h) for i in RIGHT_IRIS]
        iris_cx = np.mean([p[0] for p in iris_pts])
        iris_cy = np.mean([p[1] for p in iris_pts])

        # Right eye horizontal midpoint
        eye_left_x  = landmarks[RIGHT_EYE[0]].x * w
        eye_right_x = landmarks[RIGHT_EYE[3]].x * w
        eye_top_y   = landmarks[RIGHT_EYE[1]].y * h
        eye_bot_y   = landmarks[RIGHT_EYE[5]].y * h

        eye_mid_x = (eye_left_x + eye_right_x) / 2.0
        eye_mid_y = (eye_top_y + eye_bot_y) / 2.0
        eye_width = abs(eye_right_x - eye_left_x)
        eye_height = abs(eye_bot_y - eye_top_y)

        dx = (iris_cx - eye_mid_x) / (eye_width + 1e-6)
        dy = (iris_cy - eye_mid_y) / (eye_height + 1e-6)

        GAZE_THRESH_H = 0.15
        GAZE_THRESH_V = 0.12

        if abs(dx) > abs(dy):
            if dx > GAZE_THRESH_H:
                return "right"
            elif dx < -GAZE_THRESH_H:
                return "left"
        else:
            if dy < -GAZE_THRESH_V:
                return "up"
            elif dy > GAZE_THRESH_V:
                return "down"
        return "center"
    except (IndexError, AttributeError):
        return "center"


# ── Main Detector Class ───────────────────────────────────────────────────────

class AttentionDetector:
    # Thresholds
    EAR_THRESHOLD        = 0.21    # eyes closed
    MAR_THRESHOLD        = 0.50    # mouth open → yawn
    YAW_THRESHOLD        = 25.0    # degrees
    PITCH_THRESHOLD      = 22.0    # degrees

    # PERCLOS: % of frames where eyes are closed, over rolling window
    PERCLOS_WINDOW       = 30      # frames (~15 seconds at 2fps)
    PERCLOS_THRESHOLD    = 0.30    # 30% closed → drowsy

    # Yawn confirmation: must persist N frames
    YAWN_CONFIRM_FRAMES  = 2

    # Blink tracking
    BLINK_WINDOW_FRAMES  = 60      # measure blinks per this many frames

    def __init__(self):
        self.mp_face = mp.solutions.face_mesh
        self.face_mesh = self.mp_face.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,   # Required for iris landmarks
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

        # Rolling EAR history for PERCLOS
        self._ear_history: deque = deque(maxlen=self.PERCLOS_WINDOW)
        # Blink tracking
        self._prev_eye_open: bool = True
        self._blink_timestamps: deque = deque(maxlen=120)  # store blink frame indices
        self._frame_count: int = 0
        # Yawn confirmation
        self._yawn_streak: int = 0
        # Drowsiness score (smoothed PERCLOS 0.0-1.0)
        self._drowsiness_score: float = 0.0

    def analyze_frame(self, frame_bgr: np.ndarray) -> dict:
        """
        Analyze a single BGR frame.
        Returns comprehensive attention metrics dict.
        """
        self._frame_count += 1
        h, w = frame_bgr.shape[:2]
        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb)

        if not results.multi_face_landmarks:
            self._ear_history.append(0.0)  # treat no-face as eyes closed for PERCLOS
            return {
                "status": "not_attentive",
                "reason": "no_face",
                "ear": 0.0,
                "perclos": self._compute_perclos(),
                "drowsiness_score": round(self._drowsiness_score, 2),
                "mar": 0.0,
                "yawning": False,
                "blink_rate": self._compute_blink_rate(),
                "gaze_direction": "unknown",
                "yaw": 0.0,
                "pitch": 0.0,
                "roll": 0.0,
                "eye_open": False,
                "head_pose_deviation": 0.0,
            }

        landmarks = results.multi_face_landmarks[0].landmark

        # ── Eye Aspect Ratio ─────────────────────────────────────────────────
        left_ear  = _eye_aspect_ratio(landmarks, LEFT_EYE,  w, h)
        right_ear = _eye_aspect_ratio(landmarks, RIGHT_EYE, w, h)
        ear = (left_ear + right_ear) / 2.0
        eyes_closed = ear < self.EAR_THRESHOLD

        # Blink detection (transition from open → closed)
        if self._prev_eye_open and eyes_closed:
            self._blink_timestamps.append(self._frame_count)
        self._prev_eye_open = not eyes_closed

        # ── PERCLOS ──────────────────────────────────────────────────────────
        self._ear_history.append(1.0 if eyes_closed else 0.0)
        perclos = self._compute_perclos()

        # Update drowsiness score (exponential moving average for smoothness)
        self._drowsiness_score = 0.85 * self._drowsiness_score + 0.15 * perclos
        drowsy = self._drowsiness_score >= self.PERCLOS_THRESHOLD

        # ── Mouth Aspect Ratio (Yawning) ──────────────────────────────────
        mar = _mouth_aspect_ratio(landmarks, w, h)
        if mar >= self.MAR_THRESHOLD:
            self._yawn_streak += 1
        else:
            self._yawn_streak = 0
        yawning = self._yawn_streak >= self.YAWN_CONFIRM_FRAMES

        # ── Gaze Direction ───────────────────────────────────────────────────
        gaze = _gaze_direction(landmarks, w, h)

        # ── Head Pose ────────────────────────────────────────────────────────
        image_points = np.array(
            [(landmarks[i].x * w, landmarks[i].y * h) for i in FACE_INDICES],
            dtype=np.float64,
        )
        focal_length = w
        cam_matrix = np.array([
            [focal_length, 0, w / 2],
            [0, focal_length, h / 2],
            [0, 0, 1],
        ], dtype=np.float64)
        dist_coeffs = np.zeros((4, 1))
        success, rvec, tvec = cv2.solvePnP(
            MODEL_POINTS, image_points, cam_matrix, dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE,
        )
        yaw = pitch = roll = 0.0
        if success:
            rmat, _ = cv2.Rodrigues(rvec)
            angles, *_ = cv2.RQDecomp3x3(rmat)
            pitch, yaw, roll = angles[0], angles[1], angles[2]

        looking_away = abs(yaw) > self.YAW_THRESHOLD or abs(pitch) > self.PITCH_THRESHOLD
        off_screen_gaze = gaze in ("left", "right") and abs(yaw) > 15.0

        # ── Classification (priority order) ──────────────────────────────────
        blink_rate = self._compute_blink_rate()

        if drowsy:
            status, reason = "not_attentive", "drowsy"
        elif yawning:
            status, reason = "not_attentive", "yawning"
        elif looking_away or off_screen_gaze:
            status, reason = "not_attentive", "head_turned"
        elif eyes_closed:
            status, reason = "not_attentive", "eyes_closed"
        else:
            status, reason = "attentive", "ok"

        # Engagement score: 0-100
        engagement = self._compute_engagement(perclos, looking_away, yawning, gaze, blink_rate)

        return {
            "status": status,
            "reason": reason,
            "ear": round(float(ear), 3),
            "perclos": round(perclos, 3),
            "drowsiness_score": round(self._drowsiness_score, 3),
            "mar": round(float(mar), 3),
            "yawning": yawning,
            "blink_rate": round(blink_rate, 1),
            "gaze_direction": gaze,
            "yaw": round(float(yaw), 2),
            "pitch": round(float(pitch), 2),
            "roll": round(float(roll), 2),
            "eye_open": not eyes_closed,
            "head_pose_deviation": round(float(abs(yaw)), 2),
            "engagement_score": engagement,
        }

    def _compute_perclos(self) -> float:
        """Proportion of recent frames where eyes were closed."""
        if not self._ear_history:
            return 0.0
        return round(sum(self._ear_history) / len(self._ear_history), 3)

    def _compute_blink_rate(self) -> float:
        """Estimate blinks per minute based on recent blink timestamps."""
        if len(self._blink_timestamps) < 2:
            return 0.0
        # Use frame count as proxy for time (at ~2 FPS, 60 frames = 30s)
        frame_span = self._frame_count - self._blink_timestamps[0]
        if frame_span == 0:
            return 0.0
        # Approximate 2 FPS → minutes = frames / 2 / 60
        minutes = frame_span / 2.0 / 60.0
        return len(self._blink_timestamps) / max(minutes, 1/60)

    def _compute_engagement(
        self, perclos: float, looking_away: bool, yawning: bool,
        gaze: str, blink_rate: float
    ) -> int:
        """
        Compute a 0-100 engagement score from multiple signals.
        100 = fully engaged, 0 = completely disengaged.
        """
        score = 100.0

        # Penalize drowsiness
        score -= perclos * 40.0

        # Penalize looking away
        if looking_away:
            score -= 30.0
        elif gaze in ("left", "right"):
            score -= 10.0
        elif gaze in ("up", "down"):
            score -= 5.0

        # Penalize yawning
        if yawning:
            score -= 15.0

        # Reward normal blink rate (12-20 bpm is healthy/focused)
        if 12 <= blink_rate <= 20:
            score += 5.0

        return max(0, min(100, int(round(score))))

    def __del__(self):
        try:
            self.face_mesh.close()
        except Exception:
            pass
