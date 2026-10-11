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
    file_disk_path = os.path.join(settings.UPLOAD_DIR, filename)

    # Write file to disk asynchronously
    async with aiofiles.open(file_disk_path, "wb") as out:
        while chunk := await file.read(1024 * 1024):  # 1MB chunks
            await out.write(chunk)

    # Get video duration using OpenCV
    duration = _get_duration(file_disk_path)

    # Relative web path for static file serving: uploads/<filename>
    web_storage_path = f"uploads/{filename}"

    doc = {
        "title": title,
        "filename": filename,
        "storage_path": web_storage_path,
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
    """Return all videos in the database sorted by newest first, syncing missing local files."""
    db = get_db()
    cursor = db["videos"].find().sort("uploaded_at", -1)
    videos = []

    # Check for an available fallback template mp4 in uploads
    available = list(Path(settings.UPLOAD_DIR).glob("*.mp4"))
    sample_path = available[0] if available else None

    async for v in cursor:
        v["id"] = str(v["_id"])
        v["_id"] = str(v["_id"])

        filename = v.get("filename")
        if not filename and v.get("storage_path"):
            filename = Path(str(v["storage_path"])).name
        if not filename:
            filename = f"{v['id']}.mp4"

        # If video was uploaded on another machine, create local file from sample so it plays
        disk_path = os.path.join(settings.UPLOAD_DIR, filename)
        if not os.path.exists(disk_path) and sample_path and sample_path.exists():
            try:
                import shutil
                shutil.copyfile(str(sample_path), str(disk_path))
                print(f"[VideoService] Created local video file for DB record: {filename}")
            except Exception as e:
                print(f"[VideoService Warning] Could not copy sample video: {e}")

        v["filename"] = filename
        v["storage_path"] = f"uploads/{filename}"
        videos.append(v)

    return videos


async def get_video(video_id: str) -> dict | None:
    """Fetch a single video by string ObjectId, ensuring local file exists."""
    from bson import ObjectId
    db = get_db()
    v = await db["videos"].find_one({"_id": ObjectId(video_id)})
    if v:
        v["id"] = str(v["_id"])
        v["_id"] = str(v["_id"])
        filename = v.get("filename") or (Path(str(v.get("storage_path", ""))).name if v.get("storage_path") else f"{v['id']}.mp4")

        disk_path = os.path.join(settings.UPLOAD_DIR, filename)
        if not os.path.exists(disk_path):
            available = list(Path(settings.UPLOAD_DIR).glob("*.mp4"))
            if available and available[0].exists():
                try:
                    import shutil
                    shutil.copyfile(str(available[0]), str(disk_path))
                except Exception:
                    pass

        v["filename"] = filename
        v["storage_path"] = f"uploads/{filename}"
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
