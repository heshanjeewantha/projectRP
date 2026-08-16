"""
routes/video_routes.py
API endpoints for uploading and retrieving videos.
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from typing import List

from src.modules.component_01_attention_monitoring.models.video import VideoOut
from src.modules.component_01_attention_monitoring.services import (
    transcription_service,
    video_service,
)

router = APIRouter(prefix="/api/videos", tags=["Videos"])


@router.post("/upload", response_model=VideoOut)
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
):
    """Upload a video and trigger background transcription."""
    if not file.filename.endswith(('.mp4', '.avi', '.mov')):
        raise HTTPException(status_code=400, detail="Invalid video format")

    doc = await video_service.save_video(file, title)

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
):
    """Directly converts a sign language video file into time-aligned transcript segments."""
    if not file.filename.endswith(('.mp4', '.avi', '.mov', '.webm')):
        raise HTTPException(status_code=400, detail="Invalid video format. Use MP4, WebM, AVI, or MOV.")

    doc = await video_service.save_video(file, title)
    result = await transcription_service.transcribe_sign_video_direct(
        video_path=doc["storage_path"],
        title=title,
    )
    result["video_id"] = doc["_id"]
    result["video_url"] = doc.get("video_url")
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
async def list_videos():
    """List all uploaded videos."""
    videos = await video_service.list_videos()
    return videos


@router.get("/{video_id}", response_model=VideoOut)
async def get_video(video_id: str):
    """Get metadata for a specific video."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video

