"""
services/attention_service.py
Handles storing and retrieving attention log batches from MongoDB.
"""
from datetime import datetime
from bson import ObjectId

from src.common.database.connection import get_db


async def save_attention_log(user_id: str, session_id: str, video_id: str, events: list) -> str:
    """
    Append attention events to an existing session log,
    or create a new log document if one doesn't exist yet.
    Returns the log document _id as string.
    """
    db = get_db()

    # Stamp each event with server-side logged_at
    for evt in events:
        evt["logged_at"] = datetime.utcnow()

    # Upsert log document keyed by session_id
    result = await db["attention_logs"].update_one(
        {"session_id": session_id},
        {
            "$setOnInsert": {
                "user_id": user_id,
                "video_id": ObjectId(video_id),
                "session_id": session_id,
            },
            "$push": {"events": {"$each": events}},
        },
        upsert=True,
    )

    if result.upserted_id:
        return str(result.upserted_id)

    doc = await db["attention_logs"].find_one({"session_id": session_id})
    return str(doc["_id"])


async def get_attention_log(session_id: str) -> dict | None:
    """Retrieve a complete attention log for a session."""
    db = get_db()
    doc = await db["attention_logs"].find_one({"session_id": session_id})
    if doc:
        doc["_id"] = str(doc["_id"])
        doc["video_id"] = str(doc["video_id"])
    return doc
