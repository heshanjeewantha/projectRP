"""
routes/video_routes.py
API endpoints for uploading, categorizing, and retrieving videos aligned with O/L ICT syllabus.
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Query
from typing import List, Optional

from src.modules.component_01_attention_monitoring.models.video import VideoOut
from src.modules.component_01_attention_monitoring.services import (
    transcription_service,
    video_service,
)
from src.modules.component_01_attention_monitoring.constants.syllabus_constants import (
    get_full_syllabus_taxonomy,
)

router = APIRouter(prefix="/api/videos", tags=["Videos"])


@router.get("/syllabus/taxonomy")
async def get_syllabus_taxonomy():
    """Retrieve full Grade 10 & 11 O/L ICT curriculum taxonomy."""
    return get_full_syllabus_taxonomy()


@router.post("/upload", response_model=VideoOut)
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    grade: Optional[str] = Form("Grade 10"),
    unit_number: Optional[int] = Form(1),
    unit_title: Optional[str] = Form("Introduction to ICT"),
    topic: Optional[str] = Form("Data & Information"),
    difficulty: Optional[str] = Form("intermediate"),
):
    """Upload a video and trigger background transcription with syllabus categorization."""
    if not file.filename.endswith(('.mp4', '.avi', '.mov')):
        raise HTTPException(status_code=400, detail="Invalid video format")

    doc = await video_service.save_video(
        file=file,
        title=title,
        grade=grade,
        unit_number=unit_number,
        unit_title=unit_title,
        topic=topic,
        difficulty=difficulty,
    )

    # Fire background job to transcribe video and generate segments
    background_tasks.add_task(
        transcription_service.transcribe_video,
        video_id=doc["_id"],
        storage_path=doc["storage_path"]
    )

    return doc


@router.post("/convert-sign-video")
async def convert_sign_video_to_transcript(
    file: UploadFile = File(...),
    title: str = Form("Sign Language Video"),
    grade: Optional[str] = Form("Grade 10"),
    unit_number: Optional[int] = Form(1),
    unit_title: Optional[str] = Form("Introduction to ICT"),
    topic: Optional[str] = Form("Data & Information"),
):
    """Directly converts a sign language video file into time-aligned transcript segments."""
    if not file.filename.endswith(('.mp4', '.avi', '.mov', '.webm')):
        raise HTTPException(status_code=400, detail="Invalid video format. Use MP4, WebM, AVI, or MOV.")

    doc = await video_service.save_video(
        file=file,
        title=title,
        grade=grade,
        unit_number=unit_number,
        unit_title=unit_title,
        topic=topic,
    )
    result = await transcription_service.transcribe_sign_video_direct(
        video_path=doc["storage_path"],
        title=title,
    )
    result["video_id"] = doc["_id"]
    result["video_url"] = doc.get("video_url")

    # Persist transcript in database and update video status to ready
    from datetime import datetime
    from bson import ObjectId
    from src.common.database.connection import get_db
    try:
        db = get_db()
        v_id = ObjectId(doc["_id"])
        await db["transcripts"].update_one(
            {"$or": [{"video_id": v_id}, {"video_id": doc["_id"]}]},
            {"$set": {
                "video_id": v_id,
                "segments": result.get("segments", []),
                "generated_at": datetime.utcnow(),
                "source": "sign_classifier_cv",
            }},
            upsert=True,
        )
        await video_service.update_video_status(doc["_id"], "ready")
    except Exception as err:
        print(f"[Warning] Failed to persist converted sign transcript: {err}")

    return result


@router.post("/{video_id}/convert-transcript")
async def convert_existing_video_to_transcript(video_id: str, background_tasks: BackgroundTasks):
    """Trigger on-demand sign video transcription for an existing video."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    background_tasks.add_task(
        transcription_service.transcribe_video,
        video_id=video["_id"],
        storage_path=video["storage_path"],
    )
    return {"message": "Transcription initiated", "video_id": video["_id"], "status": "processing"}


@router.get("", response_model=List[VideoOut])
async def list_videos(
    grade: Optional[str] = Query(None, description="Filter by Grade 10 or Grade 11"),
    unit_number: Optional[int] = Query(None, description="Filter by syllabus unit number"),
):
    """List all uploaded videos with optional Grade and Unit filtering."""
    videos = await video_service.list_videos(grade=grade, unit_number=unit_number)
    return videos


@router.get("/{video_id}", response_model=VideoOut)
async def get_video(video_id: str):
    """Get metadata for a specific video including syllabus topic segments."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video


@router.put("/{video_id}/syllabus", response_model=VideoOut)
async def update_video_syllabus(video_id: str, syllabus_data: dict):
    """Update syllabus categorization (grade, unit, topic, timeline segments) for a video."""
    video = await video_service.update_video_syllabus(video_id, syllabus_data)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video
