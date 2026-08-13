"""
models/attention.py — Pydantic models for Attention events
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class AttentionStatus(str, Enum):
    attentive     = "attentive"
    not_attentive = "not_attentive"


class AttentionReason(str, Enum):
    ok             = "ok"
    eyes_closed    = "eyes_closed"
    drowsy         = "drowsy"
    yawning        = "yawning"
    head_turned    = "head_turned"
    phone_detected = "phone_detected"
    no_face        = "no_face"
    unknown        = "unknown"


class AttentionEvent(BaseModel):
    timestamp:          float          # seconds into video
    status:             AttentionStatus
    reason:             AttentionReason = AttentionReason.unknown

    # Eye metrics
    eye_open:           bool  = True
    ear:                float = 0.0    # Eye Aspect Ratio
    perclos:            float = 0.0    # % eyes closed over rolling window
    drowsiness_score:   float = 0.0    # smoothed PERCLOS (0-1)
    blink_rate:         float = 0.0    # blinks per minute

    # Mouth / yawn
    mar:                float = 0.0    # Mouth Aspect Ratio
    yawning:            bool  = False

    # Head & gaze
    head_pose_deviation: float = 0.0
    gaze_direction:      str   = "center"   # center|left|right|up|down|unknown

    # Phone
    phone_detected:     bool  = False
    phone_confidence:   float = 0.0

    # Sign language
    sign_text:          Optional[str]  = None
    sign_confidence:    float          = 0.0

    # Engagement
    engagement_score:   int   = 100    # 0-100

    logged_at: Optional[datetime] = None

    def model_post_init(self, __context):
        if self.logged_at is None:
            self.logged_at = datetime.utcnow()


class AttentionLogCreate(BaseModel):
    user_id:    str
    session_id: str
    video_id:   str
    events:     List[AttentionEvent]


class AttentionLogOut(AttentionLogCreate):
    id: str
