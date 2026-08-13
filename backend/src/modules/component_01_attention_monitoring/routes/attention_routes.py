"""
routes/attention_routes.py
REST endpoints for batch logging attention events (Fallback to WebSocket).
"""
from fastapi import APIRouter
from src.modules.component_01_attention_monitoring.models.attention import (
    AttentionLogCreate,
    AttentionLogOut,
)
from src.modules.component_01_attention_monitoring.services import attention_service

router = APIRouter(prefix="/api/attention", tags=["Attention"])


@router.post("/log")
async def log_attention_batch(payload: AttentionLogCreate):
    """
    Save a batch of attention events via REST.
    (Used by frontend every 5 seconds to batch save events).
    """
    events = [evt.model_dump() for evt in payload.events]

    doc_id = await attention_service.save_attention_log(
        user_id=payload.user_id,
        session_id=payload.session_id,
        video_id=payload.video_id,
        events=events
    )

    return {"status": "success", "log_id": doc_id, "events_logged": len(events)}
