"""
models/transcript.py — Pydantic models for Transcript documents
"""
from pydantic import BaseModel
from typing import List
from datetime import datetime


class TranscriptSegment(BaseModel):
    start_time: float   # seconds
    end_time: float     # seconds
    text: str
    confidence: float = 1.0


class TranscriptOut(BaseModel):
    id: str
    video_id: str
    segments: List[TranscriptSegment]
    generated_at: datetime
