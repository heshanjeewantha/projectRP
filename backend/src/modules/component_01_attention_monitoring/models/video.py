"""
models/video.py — Pydantic models for Video documents
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class VideoStatus(str, Enum):
    processing = "processing"
    ready = "ready"
    failed = "failed"


class VideoCreate(BaseModel):
    title: str
    uploaded_by: str = "admin"


class VideoOut(BaseModel):
    id: str
    title: str
    filename: str
    storage_path: str
    duration_seconds: Optional[float] = None
    status: VideoStatus
    uploaded_at: datetime
    uploaded_by: str
