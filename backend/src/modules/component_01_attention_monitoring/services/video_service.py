"""
services/video_service.py
Handles video upload, storage, and metadata persistence in MongoDB.
"""
import os
import uuid
from datetime import datetime
from pathlib import Path

import aiofiles
import cv2
from fastapi import UploadFile

from src.common.config.settings import settings
from src.common.database.connection import get_db


async def save_video(file: UploadFile, title: str, uploaded_by: str = "admin") -> dict:
    """
    Save uploaded video file to disk and insert metadata into MongoDB.
    Returns the created video document (with string _id).
    """
    ext = Path(file.filename).suffix or ".mp4"
    filename = f"{uuid.uuid4().hex}{ext}"
    storage_path = os.path.join(settings.UPLOAD_DIR, filename)

    # Write file to disk asynchronously
    async with aiofiles.open(storage_path, "wb") as out:
        while chunk := await file.read(1024 * 1024):  # 1MB chunks
            await out.write(chunk)

    # Get video duration using OpenCV
    duration = _get_duration(storage_path)

    doc = {
        "title": title,
        "filename": filename,
        "storage_path": storage_path,
        "duration_seconds": duration,
        "status": "processing",
        "uploaded_at": datetime.utcnow(),
        "uploaded_by": uploaded_by,
    }

    db = get_db()
    result = await db["videos"].insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc["_id"] = str(result.inserted_id)
    return doc


async def list_videos() -> list:
    """Return all videos sorted by upload date (newest first)."""
    db = get_db()
    print("Database name:", db.name)
    cursor = db["videos"].find().sort("uploaded_at", -1)
    videos = []
    async for v in cursor:
        v["id"] = str(v["_id"])
        v["_id"] = str(v["_id"])
        videos.append(v)
    print("Found videos:", len(videos))
    return videos


async def get_video(video_id: str) -> dict | None:
    """Fetch a single video by string ObjectId."""
    from bson import ObjectId
    db = get_db()
    v = await db["videos"].find_one({"_id": ObjectId(video_id)})
    if v:
        v["id"] = str(v["_id"])
        v["_id"] = str(v["_id"])
    return v


async def update_video_status(video_id: str, status: str):
    """Update the processing status of a video."""
    from bson import ObjectId
    db = get_db()
    await db["videos"].update_one(
        {"_id": ObjectId(video_id)},
        {"$set": {"status": status}}
    )


def _get_duration(path: str) -> float | None:
    """Use OpenCV to get video duration in seconds."""
    try:
        cap = cv2.VideoCapture(path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
        cap.release()
        if fps and fps > 0:
            return round(frame_count / fps, 2)
    except Exception:
        pass
    return None
