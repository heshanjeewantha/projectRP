"""
Pydantic models for the text-to-sign avatar generator module.
"""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class SignAvatarGenerateRequestModel(BaseModel):
    studentId: str = Field(..., min_length=1)
    inputText: str = Field(..., min_length=1)
    selectedLanguage: Literal["Sinhala", "English"] = "English"
    currentLearningState: str | None = "understanding"
    currentTopic: str | None = None


class SignAvatarSequenceRequestModel(BaseModel):
    lessonText: str = Field(..., min_length=1)
    studentId: str | None = None
    currentTopic: str | None = None
    currentLearningState: str | None = "understanding"
    selectedLanguage: Literal["Sinhala", "English"] = "English"


class HandPointModel(BaseModel):
    x: float
    y: float
    z: float = 0


class FingerCurlModel(BaseModel):
    thumb: float = 0.28
    index: float = 0.2
    middle: float = 0.22
    ring: float = 0.24
    pinky: float = 0.28


class HandPoseModel(BaseModel):
    position: HandPointModel
    scale: float = 1.0
    wristAngle: float = 0
    palmAngle: float = 0
    fingerSpread: float = 1.0
    thumbSpread: float = 26
    fingerCurls: FingerCurlModel = Field(default_factory=FingerCurlModel)


class BoneRotationSideModel(BaseModel):
    wrist: float = 0
    thumb: float = 0
    index: float = 0
    middle: float = 0
    ring: float = 0
    pinky: float = 0


class BoneRotationValuesModel(BaseModel):
    left: BoneRotationSideModel = Field(default_factory=BoneRotationSideModel)
    right: BoneRotationSideModel = Field(default_factory=BoneRotationSideModel)


class GestureMappingModel(BaseModel):
    glossWord: str
    animationFile: str
    description: str
    fallbackType: str
    durationMs: int = 1400
    animationDuration: int | None = None
    leftHandPose: HandPoseModel | None = None
    rightHandPose: HandPoseModel | None = None
    boneRotationValues: BoneRotationValuesModel | None = None


class SignAvatarGenerateResponseModel(BaseModel):
    studentId: str
    inputText: str
    cleanedWords: list[str]
    generatedGloss: str
    gestureSequence: list[GestureMappingModel]
    learningState: str
    topic: str
    monitoringStatus: str
    replaySuggestion: str | None = None
    createdAt: datetime


class SignAvatarSequenceItemModel(BaseModel):
    keyword: str
    animationName: str
    subtitle: str
    duration: float
    fallbackGesture: str
    sourceGloss: str | None = None
    isFallback: bool = False
    # WLASL BiLSTM model enrichment fields (populated when model is trained)
    wlaslModelClass: bool = False
    wlaslValAccuracy: float | None = None
    wlaslArchitecture: str | None = None
    wlaslLandmarkEndpoint: str | None = None


class SubtitleSegmentModel(BaseModel):
    keyword: str
    subtitle: str
    startMs: int
    endMs: int


class SignAvatarSequenceResponseModel(BaseModel):
    keywords: list[str] = Field(default_factory=list)
    avatarAnimationSequence: list[SignAvatarSequenceItemModel] = Field(default_factory=list)
    subtitleSegments: list[SubtitleSegmentModel] = Field(default_factory=list)
    sourceType: str = "LOCAL_KEYWORD_MATCHER"
    simplifiedText: str
    llmAssisted: bool = False
    # WLASL model metadata summary for the whole response
    wlaslModelMeta: dict | None = None
    wlaslEnrichedCount: int = 0


class SignAvatarHistoryModel(BaseModel):
    id: str
    studentId: str
    inputText: str
    generatedGloss: str
    gestureSequence: list[GestureMappingModel]
    learningState: str
    topic: str
    selectedLanguage: str
    createdAt: datetime


class SignMotionFrameModel(BaseModel):
    timestampMs: int = Field(..., ge=0)
    joints: dict[str, list[float]] = Field(default_factory=dict)


class LearnedSignPatternCreateModel(BaseModel):
    word: str = Field(..., min_length=1, max_length=80)
    teacherId: str = Field(..., min_length=1, max_length=120)
    meaning: str | None = Field(default=None, max_length=240)
    category: str = Field(default="ICT")
    facialExpression: str = Field(default="neutral")
    sourceGloss: str | None = Field(default=None, max_length=80)
    frames: list[SignMotionFrameModel] = Field(..., min_length=2, max_length=720)


class LearnedSignPatternResponseModel(BaseModel):
    word: str
    teacherId: str
    meaning: str | None = None
    category: str
    facialExpression: str
    frameCount: int
    durationMs: int
    trajectory: dict[str, list[list[float]]]
    version: int
    createdAt: datetime
    updatedAt: datetime


class SignLectureGenerateRequestModel(BaseModel):
    teacherId: str = Field(..., min_length=1)
    lessonTitle: str = Field(..., min_length=1)
    subject: str = Field(..., min_length=1)
    topic: str = Field(..., min_length=1)
    notesText: str = Field(..., min_length=1)
    language: Literal["Sinhala", "English"] = "English"
    difficultyLevel: str = "beginner"


class SignLectureSaveRequestModel(BaseModel):
    lectureId: str = Field(..., min_length=1)
    teacherId: str = Field(..., min_length=1)


class SignLectureSegmentModel(BaseModel):
    segmentId: str
    originalText: str
    simplifiedScript: str
    generatedGloss: str
    gestureSequence: list[GestureMappingModel]
    estimatedDuration: int
    keyWords: list[str] = Field(default_factory=list)
    orderIndex: int
    warning: str | None = None


class SignLectureModel(BaseModel):
    lectureId: str
    teacherId: str
    lessonTitle: str
    subject: str
    topic: str
    language: str
    difficultyLevel: str
    notesText: str
    generatedScript: list[str]
    segments: list[SignLectureSegmentModel]
    status: str
    warnings: list[str] = Field(default_factory=list)
    createdAt: datetime
    updatedAt: datetime


class SignLectureListItemModel(BaseModel):
    lectureId: str
    lessonTitle: str
    subject: str
    topic: str
    language: str
    difficultyLevel: str
    segmentCount: int
    status: str
    createdAt: datetime
    updatedAt: datetime


class SignLectureDeleteResponseModel(BaseModel):
    lectureId: str
    deletedLecture: bool
    deletedSegments: int
    deletedHistory: int


class MissedSignSegmentCreateModel(BaseModel):
    studentId: str
    sessionId: str | None = None
    glossWord: str
    sequenceIndex: int
    timeSeconds: float = 0
    learningState: str | None = None
    topic: str | None = None


class MissedSignSegmentResponseModel(BaseModel):
    id: str
    studentId: str
    sessionId: str | None = None
    glossWord: str
    sequenceIndex: int
    timeSeconds: float
    learningState: str | None = None
    topic: str | None = None
    createdAt: datetime
