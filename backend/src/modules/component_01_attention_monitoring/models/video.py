"""
models/video.py — Pydantic models for Video documents
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class VideoStatus(str, Enum):
    processing = "processing"
    ready = "ready"
    failed = "failed"


class TopicTimelineSegment(BaseModel):
    start_time: float
    end_time: float
    subtopic_id: str
    subtopic_title: str
    concept_id: Optional[str] = None
    key_terms: List[str] = Field(default_factory=list)
    summary_hint: str = ""
    sample_checkpoint_mcq: Optional[dict] = None


class VideoCreate(BaseModel):
    title: str
    grade: Optional[str] = "Grade 10"
    unit_number: Optional[int] = 1
    unit_title: Optional[str] = "Introduction to ICT"
    topic: Optional[str] = "Data & Information"
    difficulty: Optional[str] = "intermediate"
    timeline_segments: Optional[List[TopicTimelineSegment]] = None
    uploaded_by: str = "admin"


class VideoOut(BaseModel):
    id: str
    title: str
    grade: Optional[str] = "Grade 10"
    unit_number: Optional[int] = 1
    unit_title: Optional[str] = "Introduction to ICT"
    topic: Optional[str] = "Data & Information"
    difficulty: Optional[str] = "intermediate"
    filename: str
    storage_path: str
    duration_seconds: Optional[float] = None
    timeline_segments: List[TopicTimelineSegment] = Field(default_factory=list)
    status: VideoStatus = VideoStatus.ready
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    uploaded_by: str = "admin"
