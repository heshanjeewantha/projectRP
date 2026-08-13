"""
models/attention.py — Pydantic models for Attention events
"""
from pydantic import BaseModel
from typing import List
from datetime import datetime
from enum import Enum


class AttentionStatus(str, Enum):
    attentive = "attentive"
    not_attentive = "not_attentive"


class AttentionEvent(BaseModel):
    timestamp: float          # seconds into video
    status: AttentionStatus
    eye_open: bool = True
    head_pose_deviation: float = 0.0   # degrees off-center
    logged_at: datetime = None

    def model_post_init(self, __context):
        if self.logged_at is None:
            self.logged_at = datetime.utcnow()


class AttentionLogCreate(BaseModel):
    user_id: str
    session_id: str
    video_id: str
    events: List[AttentionEvent]


class AttentionLogOut(AttentionLogCreate):
    id: str
