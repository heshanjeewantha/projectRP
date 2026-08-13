"""
Pydantic models for the O/L ICT knowledge graph popup question system.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class PopupQuestionModel(BaseModel):
    questionId: str
    questionText: str
    options: List[str]
    correctAnswer: str
    explanation: str
    difficultyLevel: str
    conceptId: str


class PopupQuestionPromptModel(BaseModel):
    questionId: str
    questionText: str
    options: List[str]
    difficultyLevel: str
    conceptId: str


class DiagramNodePositionModel(BaseModel):
    col: int
    row: int


class DiagramNodeModel(BaseModel):
    nodeId: str
    label: str
    text: str
    accent: str
    position: DiagramNodePositionModel


class DiagramEdgeModel(BaseModel):
    from_: str = Field(alias="from")
    to: str
    label: str

    model_config = {"populate_by_name": True}


class DiagramLayoutModel(BaseModel):
    columns: int
    rows: int


class ConceptDiagramModel(BaseModel):
    diagramId: str
    title: str
    subtitle: str
    layout: DiagramLayoutModel
    nodes: List[DiagramNodeModel]
    edges: List[DiagramEdgeModel]
    summaryPoints: List[str]


class KnowledgeGraphConceptModel(BaseModel):
    conceptId: str
    conceptName: str
    grade: str
    unit: str
    description: str
    prerequisites: List[str]
    relatedConcepts: List[str]
    difficultyLevel: str
    keywords: List[str]
    diagram: Optional[ConceptDiagramModel] = None
    questions: List[PopupQuestionModel]


class TimelineSegmentModel(BaseModel):
    startTime: float
    endTime: float
    conceptId: str
    conceptName: str


class LessonTimelineModel(BaseModel):
    lessonId: str
    videoTitle: str
    videoUrl: str
    isDefault: bool = False
    timeline: List[TimelineSegmentModel]


class PopupAnswerSubmissionModel(BaseModel):
    studentId: str
    lessonId: str
    questionId: str
    selectedAnswer: str
    conceptId: Optional[str] = None
    correctAnswer: Optional[str] = None
    isCorrect: Optional[bool] = None
    answeredAt: Optional[datetime] = None


class PopupAnswerHistoryModel(BaseModel):
    id: str
    studentId: str
    lessonId: str
    conceptId: str
    conceptName: str
    questionId: str
    questionText: str
    selectedAnswer: str
    correctAnswer: str
    isCorrect: bool
    difficultyLevel: str
    explanation: str
    answeredAt: datetime


class CurrentConceptContextModel(BaseModel):
    conceptId: str
    conceptName: str
    unit: str
    description: str
    difficultyLevel: str
    prerequisites: List[str]
    relatedConcepts: List[str]
    keywords: List[str]
    diagram: Optional[ConceptDiagramModel] = None


class PopupQuestionResponseModel(BaseModel):
    lessonId: str
    requestedLessonId: str
    currentConcept: Optional[CurrentConceptContextModel] = None
    timelineWindow: Optional[TimelineSegmentModel] = None
    question: Optional[PopupQuestionPromptModel] = None
    weights: dict[str, float] = Field(default_factory=dict)
    selectionReason: Optional[str] = None
    message: Optional[str] = None
