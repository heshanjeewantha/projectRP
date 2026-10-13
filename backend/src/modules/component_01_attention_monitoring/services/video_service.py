"""
services/video_service.py
Handles video upload, storage, metadata persistence, and O/L ICT syllabus categorization in MongoDB.
"""
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any

import aiofiles
import cv2
from fastapi import UploadFile

from src.common.config.settings import settings
from src.common.database.connection import get_db
from src.modules.component_01_attention_monitoring.constants.syllabus_constants import (
    generate_default_timeline,
    find_topic_for_timestamp,
)


def _enrich_syllabus_metadata(v: dict) -> dict:
    """Infer or backfill Grade 10/11 syllabus categorization if missing."""
    title_lower = (v.get("title") or "").lower()
    dur = v.get("duration_seconds") or 120.0

    if not v.get("grade"):
        if any(k in title_lower for k in ["program", "algorithm", "flowchart", "python", "loop"]):
            v["grade"] = "Grade 11"
            v["unit_number"] = 1
            v["unit_title"] = "Programming & Algorithms"
            v["topic"] = "Algorithms & Control Structures"
        elif any(k in title_lower for k in ["network", "internet", "topology", "ip", "protocol"]):
            v["grade"] = "Grade 11"
            v["unit_number"] = 3
            v["unit_title"] = "Computer Networks and the Internet"
            v["topic"] = "Network Topologies & Protocols"
        elif any(k in title_lower for k in ["web", "html", "css"]):
            v["grade"] = "Grade 11"
            v["unit_number"] = 2
            v["unit_title"] = "Web Development & Authoring"
            v["topic"] = "HTML5 & Web Architecture"
        elif any(k in title_lower for k in ["binary", "number", "octal", "hex", "radix"]):
            v["grade"] = "Grade 10"
            v["unit_number"] = 3
            v["unit_title"] = "Data Representation & Number Systems"
            v["topic"] = "Binary & Number Bases"
        elif any(k in title_lower for k in ["logic", "gate", "boolean", "nand", "nor"]):
            v["grade"] = "Grade 10"
            v["unit_number"] = 4
            v["unit_title"] = "Logic Gates and Boolean Logic"
            v["topic"] = "Basic & Universal Gates"
        elif any(k in title_lower for k in ["database", "dbms", "sql", "table"]):
            v["grade"] = "Grade 10"
            v["unit_number"] = 9
            v["unit_title"] = "Database Management Systems (DBMS)"
            v["topic"] = "Relational Tables & Keys"
        elif any(k in title_lower for k in ["hardware", "cpu", "memory", "ram", "storage"]):
            v["grade"] = "Grade 10"
            v["unit_number"] = 2
            v["unit_title"] = "Architecture of Computer Systems & Hardware"
            v["topic"] = "Von Neumann Architecture"
        else:
            v["grade"] = "Grade 10"
            v["unit_number"] = 1
            v["unit_title"] = "Introduction to Information and Communication Technology"
            v["topic"] = "Data and Information & IPO Cycle"

    if not v.get("difficulty"):
        v["difficulty"] = "intermediate"

    segments = v.get("timeline_segments")
    if not segments or len(segments) == 0:
        v["timeline_segments"] = generate_default_timeline(
            v["grade"], v["unit_number"], dur
        )
    return v


async def save_video(
    file: UploadFile,
    title: str,
    grade: Optional[str] = "Grade 10",
    unit_number: Optional[int] = 1,
    unit_title: Optional[str] = "Introduction to ICT",
    topic: Optional[str] = "Data & Information",
    difficulty: Optional[str] = "intermediate",
    timeline_segments: Optional[List[Dict[str, Any]]] = None,
    uploaded_by: str = "admin",
) -> dict:
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

    # Generate default topic timeline if not provided
    if not timeline_segments:
        timeline_segments = generate_default_timeline(
            grade or "Grade 10", unit_number or 1, duration or 120.0
        )

    # Relative web path for static file serving: uploads/<filename>
    web_storage_path = f"uploads/{filename}"

    doc = {
        "title": title,
        "grade": grade or "Grade 10",
        "unit_number": unit_number or 1,
        "unit_title": unit_title or "Introduction to ICT",
        "topic": topic or "Data & Information",
        "difficulty": difficulty or "intermediate",
        "timeline_segments": timeline_segments,
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


async def list_videos(grade: Optional[str] = None, unit_number: Optional[int] = None) -> list:
    """Return all videos in the database sorted by newest first, syncing missing local files."""
    db = get_db()
    query: Dict[str, Any] = {}
    if grade and grade != "ALL":
        query["grade"] = grade
    if unit_number is not None and unit_number > 0:
        query["unit_number"] = unit_number

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
            except Exception as e:
                print(f"[VideoService Warning] Could not copy sample video: {e}")

        v["filename"] = filename
        v["storage_path"] = f"uploads/{filename}"

        # Enrich syllabus categorization if missing
        v = _enrich_syllabus_metadata(v)

        # Apply in-memory filter if query was on enriched attributes
        if grade and grade != "ALL" and v.get("grade") != grade:
            continue
        if unit_number is not None and unit_number > 0 and v.get("unit_number") != unit_number:
            continue

        videos.append(v)

    return videos


async def get_video(video_id: str) -> dict | None:
    """Fetch a single video by string ObjectId, ensuring local file exists and syllabus is populated."""
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
        v = _enrich_syllabus_metadata(v)
    return v


async def update_video_syllabus(video_id: str, syllabus_data: dict) -> dict | None:
    """Update grade, unit, topic, and timeline segments for a video."""
    from bson import ObjectId
    db = get_db()
    
    update_fields = {}
    for key in ["grade", "unit_number", "unit_title", "topic", "difficulty", "timeline_segments"]:
        if key in syllabus_data:
            update_fields[key] = syllabus_data[key]

    if update_fields:
        await db["videos"].update_one(
            {"_id": ObjectId(video_id)},
            {"$set": update_fields}
        )

    return await get_video(video_id)


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
