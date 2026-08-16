"""
Pydantic models for the ICT sign language learning course and evaluation system.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class LandmarkConstraint(BaseModel):
    requiredFingers: list[str] = Field(default_factory=list) # e.g. ["thumb", "index", "middle"]
    foldedFingers: list[str] = Field(default_factory=list)   # e.g. ["ring", "pinky"]
    handCount: int = 1
    orientation: str = "palm_facing_camera" # "palm_facing_camera", "fist", "palm_down", "side"
    wristAngleRange: tuple[float, float] = (-45.0, 45.0)


class SignKeywordModel(BaseModel):
    id: str
    keyword: str
    sinhalaMeaning: str
    englishMeaning: str
    category: str
    difficulty: str = "Beginner" # Beginner, Intermediate, Advanced
    animationName: str
    sourceGloss: str
    duration: float = 2.0
    gestureDescription: str
    sinhalaDescription: str
    handShapeTip: str
    movementTip: str
    landmarkConstraint: LandmarkConstraint | None = None


class SignModuleModel(BaseModel):
    id: str
    moduleNumber: int
    title: str
    sinhalaTitle: str
    description: str
    iconName: str
    keywords: list[SignKeywordModel]
    passingThreshold: int = 75 # percentage


class GestureEvaluationRequest(BaseModel):
    studentId: str = Field(..., min_length=1)
    moduleId: str
    keyword: str
    landmarks: list[Any] | None = None
    isCorrect: bool | None = None
    confidence: float = 0.0
    durationHeldSeconds: float = 0.0
    mistakeReason: str | None = None


class GestureEvaluationResponse(BaseModel):
    success: bool
    keyword: str
    confidence: float
    accuracy: int
    isPassed: bool
    wristbandAlertSent: bool
    alertType: str
    oledMessage: str
    vibrationPattern: str
    feedbackMessage: str
    sinhalaFeedback: str
    nextKeyword: str | None = None
    moduleCompleted: bool = False
    courseCompleted: bool = False


class CompleteKeywordRequest(BaseModel):
    studentId: str = Field(..., min_length=1)
    moduleId: str
    keyword: str
    accuracy: int = Field(..., ge=0, le=100)
    attempts: int = Field(1, ge=1)


class StudentCourseProgressModel(BaseModel):
    studentId: str
    completedKeywords: list[str] = Field(default_factory=list)
    keywordAccuracies: dict[str, int] = Field(default_factory=dict)
    keywordAttempts: dict[str, int] = Field(default_factory=dict)
    totalAttempts: int = 0
    mistakeCount: int = 0
    wristbandTriggers: int = 0
    currentModuleId: str = "module-1"
    currentKeyword: str = "computer"
    isCourseCompleted: bool = False
    overallMastery: int = 0
    totalKeywords: int = 15
    updatedAt: datetime
    completedAt: datetime | None = None


class ResetProgressRequest(BaseModel):
    studentId: str = Field(..., min_length=1)
