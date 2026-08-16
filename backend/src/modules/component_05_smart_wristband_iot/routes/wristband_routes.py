"""
API routes for the smart haptic wristband module and ICT sign language learning course.
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
from src.modules.component_05_smart_wristband_iot.models.sign_course import (
    CompleteKeywordRequest,
    GestureEvaluationRequest,
    GestureEvaluationResponse,
    ResetProgressRequest,
    SignModuleModel,
    StudentCourseProgressModel,
)
from src.modules.component_05_smart_wristband_iot.services import (
    sign_course_service,
    wristband_service,
)

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


# ── Component 5: ICT Sign Language Course & Real-Time Evaluation Routes ─────────

@router.get("/course/modules", response_model=list[SignModuleModel])
async def get_sign_course_modules():
    """Return all structured ICT sign language learning modules."""
    return await sign_course_service.get_course_modules()


@router.get("/course/progress/{student_id}", response_model=StudentCourseProgressModel)
async def get_sign_course_progress(student_id: str):
    """Return student learning progress and keyword mastery in ICT sign language course."""
    return await sign_course_service.get_student_progress(student_id)


@router.post("/course/evaluate", response_model=GestureEvaluationResponse)
async def evaluate_sign_attempt(payload: GestureEvaluationRequest):
    """
    Evaluate student's camera sign attempt against keyword rule.
    Triggers wristband haptic correction on failure or success buzz on pass.
    """
    return await sign_course_service.evaluate_sign_gesture(payload.model_dump())


@router.post("/course/complete-keyword", response_model=StudentCourseProgressModel)
async def complete_course_keyword(payload: CompleteKeywordRequest):
    """Explicitly mark an ICT keyword as completed in student's course record."""
    return await sign_course_service.complete_keyword(payload.model_dump())


@router.post("/course/reset-progress", response_model=StudentCourseProgressModel)
async def reset_sign_course_progress(payload: ResetProgressRequest):
    """Reset course progress to restart the ICT sign language curriculum."""
    return await sign_course_service.reset_student_progress(payload.studentId)
