"""
services/missed_segment_service.py
---
Computes missed content by comparing attention logs vs transcript timestamps.
Algorithm:
  1. Fetch attention log for the session
  2. Fetch transcript segments for the video
  3. For each transcript segment [start, end]:
       - Count attention events in that window with status="not_attentive"
       - If >50% of sampled events are not_attentive → segment is MISSED
  4. Save/replace missed_segments document for (user_id, video_id, session_id)
"""

from datetime import datetime
from bson import ObjectId

from src.common.database.connection import get_db


NOT_ATTENTIVE_THRESHOLD = 0.50  # fraction of inattentive events to flag segment


async def compute_missed_segments(user_id: str, video_id: str, session_id: str) -> list:
    """
    Compute and persist missed segments. Returns list of missed segment dicts.
    """
    db = get_db()

    # ── Fetch attention log ───────────────────────────────────────────────────
    log_doc = await db["attention_logs"].find_one({"session_id": session_id})
    if not log_doc:
        return []
    events = log_doc.get("events", [])

    # ── Fetch transcript ──────────────────────────────────────────────────────
    transcript_doc = await db["transcripts"].find_one({"video_id": ObjectId(video_id)})
    if not transcript_doc:
        return []
    segments = transcript_doc.get("segments", [])

    # ── Diff ──────────────────────────────────────────────────────────────────
    missed = []
    for seg in segments:
        start, end = seg["start_time"], seg["end_time"]

        # Events that fall within this segment's time window
        window_events = [
            e for e in events
            if start <= e.get("timestamp", -1) <= end
        ]

        if not window_events:
            continue

        not_attentive_count = sum(
            1 for e in window_events if e.get("status") == "not_attentive"
        )
        fraction = not_attentive_count / len(window_events)

        if fraction >= NOT_ATTENTIVE_THRESHOLD:
            missed.append({
                "start_time": start,
                "end_time": end,
                "transcript_text": seg.get("text", ""),
                "reviewed": False,
            })

    # ── Persist ───────────────────────────────────────────────────────────────
    await db["missed_segments"].update_one(
        {"user_id": user_id, "video_id": ObjectId(video_id), "session_id": session_id},
        {
            "$set": {
                "segments": missed,
                "created_at": datetime.utcnow(),
            },
            "$setOnInsert": {
                "user_id": user_id,
                "video_id": ObjectId(video_id),
                "session_id": session_id,
            },
        },
        upsert=True,
    )

    return missed


async def get_missed_segments(user_id: str, video_id: str) -> list:
    """Return all missed segment records for a user+video (all sessions)."""
    db = get_db()
    cursor = db["missed_segments"].find(
        {"user_id": user_id, "video_id": ObjectId(video_id)}
    ).sort("created_at", -1)

    results = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        doc["video_id"] = str(doc["video_id"])
        results.append(doc)
    return results


async def get_all_missed_for_user(user_id: str) -> list:
    """Return all missed segment records for a user across all videos."""
    db = get_db()
    cursor = db["missed_segments"].find({"user_id": user_id}).sort("created_at", -1)
    results = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        doc["video_id"] = str(doc["video_id"])
        results.append(doc)
    return results


async def mark_segment_reviewed(doc_id: str):
    """Mark all segments in a missed_segments doc as reviewed."""
    db = get_db()
    await db["missed_segments"].update_one(
        {"_id": ObjectId(doc_id)},
        {"$set": {"segments.$[].reviewed": True}},
    )
