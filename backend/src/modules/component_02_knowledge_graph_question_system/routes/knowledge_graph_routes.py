"""
API routes for the O/L ICT knowledge graph popup question system.
"""
from fastapi import APIRouter, HTTPException, Query

from src.modules.component_02_knowledge_graph_question_system.models.knowledge_graph import (
    LessonTimelineModel,
    PopupAnswerHistoryModel,
    PopupAnswerSubmissionModel,
    PopupQuestionResponseModel,
)
from src.modules.component_02_knowledge_graph_question_system.services import (
    knowledge_graph_service,
)

router = APIRouter(prefix="/api", tags=["Knowledge Graph"])


@router.get("/knowledge-graph")
async def get_knowledge_graph():
    """Return the full O/L ICT knowledge graph dataset."""
    return await knowledge_graph_service.get_knowledge_graph()


@router.get("/lesson-timeline", response_model=LessonTimelineModel)
async def get_lesson_timeline(
    lessonId: str = Query(..., min_length=1),
):
    """Return the resolved lesson timeline for the requested lesson or linked video."""
    timeline = await knowledge_graph_service.get_lesson_timeline(lessonId)
    if not timeline:
        raise HTTPException(status_code=404, detail="No lesson timeline is configured for this lesson.")
    return timeline


@router.get("/popup-question", response_model=PopupQuestionResponseModel)
async def get_popup_question(
    studentId: str = Query(..., min_length=1),
    lessonId: str = Query(..., min_length=1),
    currentTime: float = Query(..., ge=0),
):
    """Detect the current concept and return one suitable popup question."""
    return await knowledge_graph_service.get_popup_question(studentId, lessonId, currentTime)


@router.post("/submit-popup-answer", response_model=PopupAnswerHistoryModel)
async def submit_popup_answer(payload: PopupAnswerSubmissionModel):
    """Save a popup question answer for a student."""
    try:
        return await knowledge_graph_service.submit_popup_answer(payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/student-popup-answers/{student_id}", response_model=list[PopupAnswerHistoryModel])
async def get_student_popup_answers(student_id: str):
    """Return popup question answer history for a student."""
    return await knowledge_graph_service.get_student_popup_answers(student_id)
