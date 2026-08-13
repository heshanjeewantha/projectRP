"""
API routes for the text-to-sign avatar generator module.
"""
from fastapi import APIRouter, HTTPException

from src.modules.component_04_sign_avatar_lecture_generator.models.sign_avatar import (
    LearnedSignPatternCreateModel,
    LearnedSignPatternResponseModel,
    MissedSignSegmentCreateModel,
    MissedSignSegmentResponseModel,
    SignAvatarGenerateRequestModel,
    SignAvatarGenerateResponseModel,
    SignAvatarHistoryModel,
    SignAvatarSequenceRequestModel,
    SignAvatarSequenceResponseModel,
    SignLectureDeleteResponseModel,
    SignLectureGenerateRequestModel,
    SignLectureListItemModel,
    SignLectureModel,
    SignLectureSaveRequestModel,
)
from src.modules.component_04_sign_avatar_lecture_generator.services import (
    sign_avatar_service,
)

router = APIRouter(prefix="/api/sign-avatar", tags=["Sign Avatar"])
lecture_router = APIRouter(prefix="/api/sign-lecture", tags=["Sign Lecture"])


@router.post("/generate", response_model=SignAvatarGenerateResponseModel)
async def generate_sign_avatar(payload: SignAvatarGenerateRequestModel):
    """Generate sign gloss and gesture sequence for input text."""
    return await sign_avatar_service.generate_sign_avatar(payload.model_dump())


@router.post("/generate-sequence", response_model=SignAvatarSequenceResponseModel)
async def generate_sign_avatar_sequence(payload: SignAvatarSequenceRequestModel):
    """Generate a keyword-driven sign animation sequence from lesson text."""
    return await sign_avatar_service.generate_sign_avatar_sequence(payload.model_dump())


@router.get("/gestures")
async def get_sign_gestures():
    """Return the available placeholder sign gesture dataset."""
    return await sign_avatar_service.get_gestures()


@router.post("/learned-patterns", response_model=LearnedSignPatternResponseModel)
async def save_learned_sign_pattern(payload: LearnedSignPatternCreateModel):
    """Persist a teacher-corrected animation as a reusable local sign."""
    return await sign_avatar_service.save_learned_sign_pattern(payload.model_dump())


@router.get("/learned-patterns", response_model=list[LearnedSignPatternResponseModel])
async def get_learned_sign_patterns():
    """Return the teacher-verified signs learned by the local knowledge base."""
    return await sign_avatar_service.get_learned_sign_patterns()


@router.get("/history/{student_id}", response_model=list[SignAvatarHistoryModel])
async def get_sign_avatar_history(student_id: str):
    """Return sign avatar generation history for a student."""
    return await sign_avatar_service.get_sign_avatar_history(student_id)


@router.delete("/history/{student_id}")
async def clear_sign_avatar_history(student_id: str):
    """Clear sign avatar history for a student."""
    return await sign_avatar_service.clear_sign_avatar_history(student_id)


@router.post("/missed-segment", response_model=MissedSignSegmentResponseModel)
async def mark_missed_sign_segment(payload: MissedSignSegmentCreateModel):
    """Persist a missed sign segment when the student is distracted."""
    return await sign_avatar_service.mark_missed_sign_segment(payload.model_dump())


@lecture_router.post("/generate", response_model=SignLectureModel)
async def generate_sign_lecture(payload: SignLectureGenerateRequestModel):
    """Generate a sign-avatar lecture timeline from lesson notes."""
    return await sign_avatar_service.generate_sign_lecture(payload.model_dump())


@lecture_router.get("/list/{teacher_id}", response_model=list[SignLectureListItemModel])
async def list_sign_lectures(teacher_id: str):
    """Return saved/generated lecture list for one teacher."""
    return await sign_avatar_service.list_sign_lectures(teacher_id)


@lecture_router.get("/{lecture_id}", response_model=SignLectureModel)
async def get_sign_lecture(lecture_id: str):
    """Return one generated lecture and its timeline segments."""
    lecture = await sign_avatar_service.get_sign_lecture(lecture_id)
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return lecture


@lecture_router.post("/save", response_model=SignLectureModel)
async def save_sign_lecture(payload: SignLectureSaveRequestModel):
    """Mark a generated lecture as saved so it can be reopened later."""
    lecture = await sign_avatar_service.save_sign_lecture(payload.model_dump())
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return lecture


@lecture_router.delete("/{lecture_id}", response_model=SignLectureDeleteResponseModel)
async def delete_sign_lecture(lecture_id: str):
    """Delete one generated lecture and all of its stored segments."""
    return await sign_avatar_service.delete_sign_lecture(lecture_id)
