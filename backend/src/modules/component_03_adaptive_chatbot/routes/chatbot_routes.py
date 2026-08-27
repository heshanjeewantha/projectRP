"""
API routes for the emotion-aware, intent-aware adaptive chatbot.
"""
from fastapi import APIRouter

from src.modules.component_03_adaptive_chatbot.models.chatbot import (
    AttentionRecommendationsResponse,
    ChatbotAskRequestModel,
    ChatbotAskResponseModel,
    ChatbotHistoryClearResponseModel,
    ChatbotMessageModel,
    ChatbotTopicModel,
    FlashcardDeckResponse,
    FlashcardReviewRequest,
    FlashcardReviewResponse,
    KnowledgeGrowthResponse,
    LessonSummaryModel,
    MicroChallengeCheckRequestModel,
    MicroChallengeCheckResponseModel,
    MicroChallengeRequestModel,
    MicroChallengeResponseModel,
    MockExamResultResponse,
    MockExamStartResponse,
    MockExamSubmission,
    PastPaperEvaluationRequest,
    PastPaperEvaluationResponse,
    PastPaperQuestionModel,
    ShortNoteModel,
)
from src.modules.component_03_adaptive_chatbot.services import chatbot_service

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])


@router.post("/ask", response_model=ChatbotAskResponseModel)
async def ask_chatbot(payload: ChatbotAskRequestModel):
    """Ask the adaptive chatbot an O/L ICT question."""
    return await chatbot_service.ask_chatbot(payload.model_dump())


@router.post("/micro-challenge", response_model=MicroChallengeResponseModel)
async def get_micro_challenge(payload: MicroChallengeRequestModel):
    """Return an optional prerequisite micro-challenge before the main answer."""
    return await chatbot_service.get_micro_challenge(payload.model_dump())


@router.post("/check-challenge", response_model=MicroChallengeCheckResponseModel)
async def check_micro_challenge(payload: MicroChallengeCheckRequestModel):
    """Check a student's micro-challenge answer and return revision guidance."""
    return await chatbot_service.check_micro_challenge(payload.model_dump())


@router.get("/history/{student_id}", response_model=list[ChatbotMessageModel])
async def get_chatbot_history(student_id: str):
    """Return chatbot history for a student."""
    return await chatbot_service.get_chatbot_history(student_id)


@router.delete("/history/{student_id}", response_model=ChatbotHistoryClearResponseModel)
async def clear_chatbot_history(student_id: str):
    """Delete chatbot history for a student."""
    return await chatbot_service.clear_chatbot_history(student_id)


@router.get("/topics", response_model=list[ChatbotTopicModel])
async def get_chatbot_topics():
    """Return available chatbot topics, including uploaded dataset topics."""
    return await chatbot_service.get_chatbot_topics()


@router.get("/lesson-summary/{topic_id}", response_model=LessonSummaryModel | None)
async def get_lesson_summary(topic_id: str):
    """Return the saved lesson summary for a topic."""
    return await chatbot_service.get_lesson_summary(topic_id)


@router.get("/attention-recommendations/{student_id}", response_model=AttentionRecommendationsResponse)
async def get_attention_recommendations(student_id: str):
    """Return low-attention lesson segment remediation recommendations."""
    return await chatbot_service.get_attention_recommendations(student_id)


@router.get("/short-notes/{topic_id}", response_model=ShortNoteModel)
async def get_short_notes(topic_id: str):
    """Return high-yield revision short notes for a topic."""
    return await chatbot_service.get_short_notes(topic_id)


@router.get("/knowledge-growth/{student_id}", response_model=KnowledgeGrowthResponse)
async def get_knowledge_growth(student_id: str):
    """Return student knowledge mastery scores, growth history, and attention correlation."""
    return await chatbot_service.get_knowledge_growth(student_id)


# ── Feature 1: Past Paper Auto-Grader Routes ─────────────────────────────────

@router.get("/past-paper/questions", response_model=list[PastPaperQuestionModel])
async def list_past_paper_questions(topicId: str | None = None):
    """Return list of standard O/L ICT past paper structured questions, sorted by topic."""
    return await chatbot_service.list_past_paper_questions(topic_id=topicId)


@router.post("/past-paper/evaluate", response_model=PastPaperEvaluationResponse)
async def evaluate_past_paper(payload: PastPaperEvaluationRequest):
    """Evaluate student past paper response against marking scheme criteria."""
    return await chatbot_service.evaluate_past_paper_answer(
        student_id=payload.studentId,
        question_id=payload.questionId,
        student_answer=payload.studentAnswer,
    )


# ── Feature 2: Flashcards & SM-2 Spaced Repetition Routes ───────────────────

@router.get("/flashcards/{topic_id}", response_model=FlashcardDeckResponse)
async def get_flashcards(topic_id: str, studentId: str = "student_demo_123"):
    """Return flashcard deck for topic."""
    return await chatbot_service.get_flashcards_deck(studentId, topic_id)


@router.post("/flashcards/review", response_model=FlashcardReviewResponse)
async def review_flashcard_item(payload: FlashcardReviewRequest):
    """Submit SM-2 spaced repetition review rating."""
    return await chatbot_service.review_flashcard(
        student_id=payload.studentId,
        card_id=payload.cardId,
        rating=payload.rating,
    )


# ── Feature 5: Mock Exam Simulator Routes ────────────────────────────────────

@router.get("/mock-exam/start", response_model=MockExamStartResponse)
async def start_mock_exam(studentId: str = "student_demo_123", topicId: str | None = None):
    """Initialize a 10-minute rapid fire O/L ICT mock exam for a specific topic or full syllabus."""
    return await chatbot_service.start_mock_exam(studentId, topic_id=topicId)


@router.post("/mock-exam/submit", response_model=MockExamResultResponse)
async def submit_mock_exam(payload: MockExamSubmission):
    """Grade mock exam submission and predict O/L grade (A-W)."""
    return await chatbot_service.submit_mock_exam(
        exam_id=payload.examId,
        student_id=payload.studentId,
        answers=payload.answers,
        time_spent_seconds=payload.timeSpentSeconds,
    )

