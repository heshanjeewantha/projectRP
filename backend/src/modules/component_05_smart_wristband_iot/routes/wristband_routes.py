"""
API routes for the smart haptic wristband module.
"""
from fastapi import APIRouter

from src.modules.component_05_smart_wristband_iot.models.wristband import (
    WristbandConfigModel,
    WristbandConfigRequestModel,
    WristbandDeviceModel,
    WristbandHistoryClearResponseModel,
    WristbandHistoryEventModel,
    WristbandNotificationModel,
    WristbandNotificationRequestModel,
)
from src.modules.component_05_smart_wristband_iot.services import wristband_service

router = APIRouter(prefix="/api/wristband", tags=["Wristband"])


@router.post("/config", response_model=WristbandConfigModel)
async def save_wristband_config(payload: WristbandConfigRequestModel):
    """Save or update a student's wristband configuration."""
    return await wristband_service.save_wristband_config(payload.model_dump())


@router.get("/config/{student_id}", response_model=WristbandConfigModel)
async def get_wristband_config(student_id: str):
    """Return the saved or default wristband configuration for a student."""
    return await wristband_service.get_wristband_config(student_id)


@router.post("/test", response_model=WristbandNotificationModel)
async def send_wristband_test(payload: WristbandNotificationRequestModel):
    """Trigger a test notification to the wristband."""
    return await wristband_service.send_wristband_notification(payload.model_dump(), source="test")


@router.post("/notify", response_model=WristbandNotificationModel)
async def send_wristband_notification(payload: WristbandNotificationRequestModel):
    """Trigger a system notification to the wristband."""
    return await wristband_service.send_wristband_notification(payload.model_dump(), source="system")


@router.get("/history/{student_id}", response_model=list[WristbandHistoryEventModel])
async def get_wristband_history(student_id: str):
    """Return wristband event history for a student."""
    return await wristband_service.get_wristband_history(student_id)


@router.delete("/history/{student_id}", response_model=WristbandHistoryClearResponseModel)
async def clear_wristband_history(student_id: str):
    """Clear wristband notification and event history for a student."""
    return await wristband_service.clear_wristband_history(student_id)


@router.get("/device/{student_id}", response_model=WristbandDeviceModel)
async def get_wristband_device(student_id: str):
    """Return the current wristband device summary for a student."""
    return await wristband_service.get_wristband_device(student_id)
