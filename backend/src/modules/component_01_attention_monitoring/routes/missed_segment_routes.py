"""
routes/missed_segment_routes.py
API endpoints for computing and retrieving missed video segments.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from src.modules.component_01_attention_monitoring.services import missed_segment_service

router = APIRouter(prefix="/api/missed", tags=["Missed Segments"])


class ComputeRequest(BaseModel):
    user_id: str
    video_id: str
    session_id: str


@router.post("/compute")
async def compute_missed(payload: ComputeRequest):
    """Trigger computation of missed segments by comparing attention log vs transcript."""
    segments = await missed_segment_service.compute_missed_segments(
        user_id=payload.user_id,
        video_id=payload.video_id,
        session_id=payload.session_id
    )
    return {"status": "success", "missed_segments": segments}


@router.get("/history/{user_id}")
async def get_missed_history(user_id: str):
    """Get all missed segments across all videos for history dashboard."""
    docs = await missed_segment_service.get_all_missed_for_user(user_id)
    return {"data": docs}


@router.get("/{user_id}/{video_id}")
async def get_missed(user_id: str, video_id: str):
    """Get all missed segments for a user on a specific video."""
    docs = await missed_segment_service.get_missed_segments(user_id, video_id)
    return {"data": docs}


@router.patch("/{doc_id}/reviewed")
async def mark_reviewed(doc_id: str):
    """Mark all segments in a missed_segments document as reviewed."""
    await missed_segment_service.mark_segment_reviewed(doc_id)
    return {"status": "success"}
