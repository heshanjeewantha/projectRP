"""
routes/attention_routes.py
REST endpoints for batch logging attention events and admin report generation.
"""
from fastapi import APIRouter
from src.modules.component_01_attention_monitoring.models.attention import (
    AttentionLogCreate,
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
        events=events,
    )

    return {"status": "success", "log_id": doc_id, "events_logged": len(events)}


@router.get("/admin/users")
async def get_admin_users():
    """
    Get a list of all students/users with attention data for Admin.
    """
    users = await attention_service.get_admin_users_summary()
    return {"users": users}


@router.get("/admin/report/{user_id}")
async def get_user_attention_report(user_id: str):
    """
    Get full attention report for a specific user.
    """
    report = await attention_service.get_user_full_attention_report(user_id)
    return report
