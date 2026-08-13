"""
models/missed_segment.py — Pydantic models for Missed Segment documents
"""
from pydantic import BaseModel
from typing import List
from datetime import datetime


class MissedSegmentItem(BaseModel):
    start_time: float
    end_time: float
    transcript_text: str
    reviewed: bool = False


class MissedSegmentOut(BaseModel):
    id: str
    user_id: str
    video_id: str
    session_id: str
    segments: List[MissedSegmentItem]
    created_at: datetime
