"""
routes/transcript_routes.py
API endpoints for fetching generated transcripts.
"""
from fastapi import APIRouter, HTTPException
from bson import ObjectId
from src.common.database.connection import get_db
from src.modules.component_01_attention_monitoring.models.transcript import TranscriptOut

router = APIRouter(prefix="/api/transcripts", tags=["Transcripts"])


@router.get("/{video_id}", response_model=TranscriptOut)
async def get_transcript(video_id: str):
    """Get the time-synced transcript for a video."""
    db = get_db()
    doc = await db["transcripts"].find_one({"video_id": ObjectId(video_id)})

    if not doc:
        raise HTTPException(status_code=404, detail="Transcript not found or still processing")

    doc["id"] = str(doc["_id"])
    doc["video_id"] = str(doc["video_id"])
    return doc
