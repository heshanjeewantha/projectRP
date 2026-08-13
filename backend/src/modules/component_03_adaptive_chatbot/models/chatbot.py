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
