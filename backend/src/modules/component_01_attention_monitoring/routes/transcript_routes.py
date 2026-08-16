"""
routes/transcript_routes.py
API endpoints for fetching and generating time-synced video transcripts.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from bson import ObjectId
from src.common.database.connection import get_db
from src.modules.component_01_attention_monitoring.models.transcript import TranscriptOut
from src.modules.component_01_attention_monitoring.services import transcription_service, video_service

router = APIRouter(prefix="/api/transcripts", tags=["Transcripts"])


@router.get("/{video_id}", response_model=TranscriptOut)
async def get_transcript(video_id: str):
    """
    Get the time-synced transcript for a video.
    If transcript document does not exist yet, generates and saves one on-the-fly
    so no video ever returns 404 Transcript Not Found.
    """
    db = get_db()
    
    # Try finding by ObjectId or string
    try:
        query_id = ObjectId(video_id)
    except Exception:
        query_id = video_id

    doc = await db["transcripts"].find_one({"$or": [{"video_id": query_id}, {"video_id": video_id}]})

    if not doc:
        # Auto-generate transcript document for this video
        video_doc = await video_service.get_video(video_id)
        storage_path = video_doc.get("storage_path", "") if video_doc else ""
        
        await transcription_service.transcribe_video(video_id, storage_path)
        doc = await db["transcripts"].find_one({"$or": [{"video_id": query_id}, {"video_id": video_id}]})

    if not doc:
        raise HTTPException(status_code=500, detail="Failed to generate transcript")

    doc["id"] = str(doc["_id"])
    doc["video_id"] = str(doc["video_id"])
    return doc


@router.post("/generate/{video_id}")
async def force_generate_transcript(video_id: str, background_tasks: BackgroundTasks):
    """
    Force re-generate a time-synced transcript for a video.
    """
    video_doc = await video_service.get_video(video_id)
    if not video_doc:
        raise HTTPException(status_code=404, detail="Video not found")

    storage_path = video_doc.get("storage_path", "")
    background_tasks.add_task(
        transcription_service.transcribe_video,
        video_id=video_id,
        storage_path=storage_path
    )

    return {"status": "success", "message": f"Transcript generation started for video {video_id}"}
