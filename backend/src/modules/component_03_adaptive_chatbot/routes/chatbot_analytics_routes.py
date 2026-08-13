"""
Routes for reinforcement quizzes, concept re-entry, repeated-query alerts,
and teacher analytics related to the adaptive chatbot.
"""
from fastapi import APIRouter
from fastapi.responses import Response

from src.modules.component_03_adaptive_chatbot.models.chatbot import (
    ConceptReEntryRequestModel,
    ConceptReEntryResponseModel,
    LoginQuizResponseModel,
    LoginQuizSubmitRequestModel,
    LoginQuizSubmitResponseModel,
    RepeatedQueryAlertModel,
    RepeatedQueryCheckRequestModel,
    RepeatedQueryCheckResponseModel,
)
from src.modules.component_03_adaptive_chatbot.services import chatbot_service

reinforcement_router = APIRouter(tags=["Reinforcement"])
concept_router = APIRouter(tags=["Concept Re-entry"])
repeated_query_router = APIRouter(tags=["Repeated Query"])
analytics_router = APIRouter(tags=["Analytics"])


@reinforcement_router.get("/api/reinforcement/login-quiz/{student_id}", response_model=LoginQuizResponseModel)
async def get_login_quiz(student_id: str):
    """Generate a forgetting-curve reinforcement quiz for a student."""
    return await chatbot_service.get_login_quiz(student_id)


@reinforcement_router.post("/api/reinforcement/submit-quiz", response_model=LoginQuizSubmitResponseModel)
async def submit_login_quiz(payload: LoginQuizSubmitRequestModel):
    """Save login quiz answers and return the reinforcement recommendation."""
    return await chatbot_service.submit_login_quiz(payload.model_dump())


@concept_router.post("/api/concept/reentry-check", response_model=ConceptReEntryResponseModel)
async def concept_reentry_check(payload: ConceptReEntryRequestModel):
    """Check whether a topic needs a quick refresh before continuing."""
    return await chatbot_service.check_concept_reentry(payload.model_dump())


@repeated_query_router.post("/api/repeated-query/check", response_model=RepeatedQueryCheckResponseModel)
async def repeated_query_check(payload: RepeatedQueryCheckRequestModel):
    """Check whether a similar question has been repeated across recent sessions."""
    return await chatbot_service.check_repeated_query(payload.model_dump(), persist_alert=True)


@repeated_query_router.get("/api/teacher/repeated-query-alerts", response_model=list[RepeatedQueryAlertModel])
async def get_repeated_query_alerts():
    """Return active repeated-query alerts for teacher review."""
    return await chatbot_service.get_repeated_query_alerts()


@analytics_router.get("/api/analytics/student/{student_id}")
async def get_student_analytics(student_id: str):
    """Return per-student understanding analytics."""
    return await chatbot_service.get_student_analytics(student_id)


@analytics_router.get("/api/analytics/topic/{topic_id}")
async def get_topic_analytics(topic_id: str):
    """Return topic-specific understanding analytics."""
    return await chatbot_service.get_topic_analytics(topic_id)


@analytics_router.get("/api/analytics/teacher-dashboard")
async def get_teacher_dashboard():
    """Return the aggregated teacher analytics dashboard payload."""
    return await chatbot_service.get_teacher_dashboard()


@analytics_router.get("/api/analytics/download-report")
async def download_analytics_report(
    format: str = "pdf",
    studentId: str | None = None,
    topicId: str | None = None,
):
    """Download an analytics report in CSV or PDF format."""
    report = await chatbot_service.get_report_file(format, studentId, topicId)
    headers = {"Content-Disposition": f"attachment; filename={report['filename']}"}
    return Response(content=report["content"], media_type=report["mediaType"], headers=headers)
