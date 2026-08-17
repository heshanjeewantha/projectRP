"""
Pydantic models for the advanced adaptive chatbot, reinforcement quiz,
lesson summaries, repeated-query alerts, and analytics flows.
"""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ChatMode = Literal["learning", "exam"]
LearningState = Literal["understanding", "not_understanding", "bored", "distracted"]


class ChatbotAskRequestModel(BaseModel):
    studentId: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1)
    selectedMode: ChatMode | None = "learning"
    currentLearningState: str | None = "understanding"
    currentTopic: str | None = None
    prerequisiteTopics: list[str] = Field(default_factory=list)


class MicroChallengeRequestModel(BaseModel):
    studentId: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1)
    selectedMode: ChatMode | None = "learning"
    currentLearningState: str | None = "understanding"
    currentTopic: str | None = None
    prerequisiteTopics: list[str] = Field(default_factory=list)


class MicroChallengeCheckRequestModel(BaseModel):
    studentId: str = Field(..., min_length=1)
    challengeId: str = Field(..., min_length=1)
    selectedAnswer: str = Field(..., min_length=1)
    topicId: str | None = None


class RepeatedQueryCheckRequestModel(BaseModel):
    studentId: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1)
    currentTopic: str | None = None


class ConceptReEntryRequestModel(BaseModel):
    studentId: str = Field(..., min_length=1)
    topicId: str = Field(..., min_length=1)
    currentQuestion: str | None = None


class LoginQuizSubmitRequestModel(BaseModel):
    studentId: str = Field(..., min_length=1)
    quizId: str = Field(..., min_length=1)
    answers: list[dict] = Field(default_factory=list)
    skipped: bool = False


class ChallengeOptionModel(BaseModel):
    challengeId: str
    topicId: str
    topicName: str
    questionText: str
    options: list[str] = Field(default_factory=list)
    correctAnswer: str
    explanation: str
    prerequisiteTopics: list[str] = Field(default_factory=list)
    difficultyLevel: int = 1


class LessonSummaryModel(BaseModel):
    topicId: str
    topicName: str
    summary: str
    keyPoints: list[str] = Field(default_factory=list)
    prerequisites: list[str] = Field(default_factory=list)
    sampleQuestions: list[str] = Field(default_factory=list)
    examQuestions: list[str] = Field(default_factory=list)


class ChatbotTopicModel(BaseModel):
    topicId: str
    topicName: str
    prerequisites: list[str] = Field(default_factory=list)
    sourceType: str = "syllabus"
    questionCount: int = 0


class ChatbotMessageModel(BaseModel):
    id: str
    studentId: str
    question: str
    answer: str
    mode: str
    detectedIntent: str
    intent: str | None = None
    learningState: str
    topic: str
    prerequisiteTopics: list[str] = Field(default_factory=list)
    prerequisites: list[str] = Field(default_factory=list)
    prompt: str
    createdAt: datetime
    inferredTopic: str | None = None
    suggestedNextTopic: str | None = None
    repeatedQueryStatus: str | None = None
    repeatedQueryCount: int = 0
    difficultyLevel: int = 1
    compressedAnswer: bool = False
    summaryRecommendation: str | None = None
    summaryTopicId: str | None = None
    microChallengeAvailable: bool = False
    conceptReEntry: bool = False
    modeBadge: str | None = None
    learningStateBadge: str | None = None
    nextDifficultyPrompt: str | None = None
    conceptRefreshPoints: list[str] = Field(default_factory=list)
    sourceType: str = "LOCAL_DATASET"
    fallbackReason: str | None = None
    confidence: float = 0.0


class ChatbotAskResponseModel(ChatbotMessageModel):
    pass


class ChatbotHistoryClearResponseModel(BaseModel):
    studentId: str
    deletedMessages: int
    deletedSessions: int
    deletedLearningStates: int


class MicroChallengeResponseModel(BaseModel):
    shouldOfferChallenge: bool
    prompt: str
    topicId: str | None = None
    topicName: str | None = None
    challenge: ChallengeOptionModel | None = None
    summaryTopicId: str | None = None


class MicroChallengeCheckResponseModel(BaseModel):
    challengeId: str
    isCorrect: bool
    feedback: str
    explanation: str
    summaryRecommendation: str | None = None
    summaryTopicId: str | None = None
    nextDifficultyLevel: int = 1


class LoginQuizQuestionModel(BaseModel):
    questionId: str
    topicId: str
    topicName: str
    questionText: str
    options: list[str] = Field(default_factory=list)
    correctAnswer: str
    explanation: str
    priority: str


class LoginQuizResponseModel(BaseModel):
    quizId: str
    studentId: str
    shouldShowQuiz: bool
    message: str
    questions: list[LoginQuizQuestionModel] = Field(default_factory=list)
    weakTopics: list[str] = Field(default_factory=list)


class LoginQuizSubmitResponseModel(BaseModel):
    quizId: str
    score: float
    totalQuestions: int
    correctAnswers: int
    recommendation: str
    recommendedTopics: list[str] = Field(default_factory=list)


class ConceptReEntryResponseModel(BaseModel):
    refreshRequired: bool
    topicId: str
    topicName: str
    keyPoints: list[str] = Field(default_factory=list)
    prerequisites: list[str] = Field(default_factory=list)
    message: str


class RepeatedQueryAlertModel(BaseModel):
    id: str
    studentId: str
    studentName: str
    topic: str
    repeatedQuestionCount: int
    exampleQuestions: list[str] = Field(default_factory=list)
    createdAt: datetime
    status: str = "active"


class RepeatedQueryCheckResponseModel(BaseModel):
    repeatedQueryStatus: str
    repeatedQueryCount: int
    alertCreated: bool
    topic: str | None = None
    exampleQuestions: list[str] = Field(default_factory=list)


# ── Attention & Knowledge Growth Extensions ──────────────────────────────────

class AttentionRecommendationItem(BaseModel):
    lessonId: str
    lessonTitle: str
    conceptId: str
    conceptName: str
    averageAttention: float
    distractionReason: str
    recommendedAction: str
    suggestedPrompt: str
    timestamp: float | None = 0.0


class AttentionRecommendationsResponse(BaseModel):
    studentId: str
    hasLowAttentionAlerts: bool
    summaryMessage: str
    recommendations: list[AttentionRecommendationItem] = Field(default_factory=list)


class ShortNoteSection(BaseModel):
    title: str
    bullets: list[str] = Field(default_factory=list)


class ShortNoteModel(BaseModel):
    topicId: str
    topicName: str
    summary: str
    keyConcepts: list[str] = Field(default_factory=list)
    realWorldAnalogy: str
    examTip: str
    commonMistakes: list[str] = Field(default_factory=list)
    memoryHook: str
    sections: list[ShortNoteSection] = Field(default_factory=list)


class KnowledgeGrowthTopicModel(BaseModel):
    topicId: str
    topicName: str
    masteryScore: int            # 0 to 100
    attentionCorrelation: int    # 0 to 100
    level: str                   # 'Novice' | 'Developing' | 'Proficient' | 'Master'
    questionsAnswered: int
    accuracyRate: int            # 0 to 100
    lastReviewed: str | None = None


class KnowledgeGrowthResponse(BaseModel):
    studentId: str
    overallMastery: int          # 0 to 100
    overallAttention: int        # 0 to 100
    growthStreakDays: int
    strongestTopic: str
    needsAttentionTopic: str
    topics: list[KnowledgeGrowthTopicModel] = Field(default_factory=list)
    growthHistory: list[dict] = Field(default_factory=list)


# ── Feature 1: O/L Past Paper Auto-Grader Models ─────────────────────────────

class PastPaperQuestionModel(BaseModel):
    id: str
    year: str
    topicId: str
    topicName: str
    questionText: str
    maxMarks: int
    markingRubric: list[str] = Field(default_factory=list)
    sampleModelAnswer: str


class PastPaperEvaluationRequest(BaseModel):
    studentId: str
    questionId: str
    studentAnswer: str


class PastPaperEvaluationResponse(BaseModel):
    questionId: str
    awardedMarks: int
    maxMarks: int
    percentage: int
    gradeBadge: str              # 'Full Marks' | 'Good Attempt' | 'Needs Improvement'
    feedback: str
    matchedKeyPoints: list[str] = Field(default_factory=list)
    missingKeyPoints: list[str] = Field(default_factory=list)
    modelAnswer: str


# ── Feature 2: Flashcards & SM-2 Spaced Repetition Models ───────────────────

class FlashcardItem(BaseModel):
    id: str
    topicId: str
    front: str
    back: str
    category: str                # 'Definition' | 'Exam Rule' | 'Mnemonic' | 'Protocol'
    mnemonic: str | None = None
    easeFactor: float = 2.5
    intervalDays: int = 1
    repetitionCount: int = 0


class FlashcardDeckResponse(BaseModel):
    topicId: str
    topicName: str
    totalCards: int
    cards: list[FlashcardItem] = Field(default_factory=list)


class FlashcardReviewRequest(BaseModel):
    studentId: str
    cardId: str
    rating: str                  # 'hard' | 'good' | 'easy'


class FlashcardReviewResponse(BaseModel):
    cardId: str
    newIntervalDays: int
    nextReviewDate: str
    message: str


# ── Feature 5: Rapid-Fire Mock Exam Simulator Models ─────────────────────────

class MockExamQuestion(BaseModel):
    id: str
    questionText: str
    options: list[str] = Field(default_factory=list)
    topicId: str
    topicName: str
    difficulty: str


class MockExamStartResponse(BaseModel):
    examId: str
    title: str
    durationMinutes: int
    totalQuestions: int
    questions: list[MockExamQuestion] = Field(default_factory=list)


class MockExamSubmission(BaseModel):
    examId: str
    studentId: str
    answers: dict[str, str] = Field(default_factory=dict)
    timeSpentSeconds: int = 0


class MockExamTopicBreakdown(BaseModel):
    topicName: str
    correct: int
    total: int
    percentage: int


class MockExamResultResponse(BaseModel):
    examId: str
    score: int
    totalQuestions: int
    percentage: int
    predictedGrade: str          # 'A (Distinction)' | 'B (Very Good)' | 'C (Credit)' | 'S (Pass)' | 'W (Weak)'
    feedback: str
    topicBreakdown: list[MockExamTopicBreakdown] = Field(default_factory=list)
    timeTakenFormatted: str
    studyPrescription: list[str] = Field(default_factory=list)


