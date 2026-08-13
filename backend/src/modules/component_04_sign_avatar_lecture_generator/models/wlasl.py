"""Pydantic models for the WLASL dataset pipeline and sign recognition APIs."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, model_validator


class WlaslLabelRecordModel(BaseModel):
    video_id: str
    gloss: str
    video_path: str
    landmark_path: str
    split: str
    signer_id: str | int | None = None


class WlaslLabelsResponseModel(BaseModel):
    count: int
    items: list[WlaslLabelRecordModel]


class WlaslStatusModel(BaseModel):
    repoReady: bool
    metadataReady: bool
    rawVideoCount: int
    rawVideoMp4Count: int
    processedVideoCount: int
    landmarkCount: int
    sequenceCount: int
    labelCount: int
    modelReady: bool
    latestStatus: dict[str, Any]
    directories: dict[str, str]


class WlaslTrainRequestModel(BaseModel):
    epochs: int = Field(10, ge=1, le=200)
    batchSize: int = Field(16, ge=1, le=256)
    sequenceLength: int = Field(48, ge=8, le=300)
    validationSplit: float = Field(0.2, gt=0, lt=0.5)
    forceRetrain: bool = False


class WlaslTrainResponseModel(BaseModel):
    status: str
    message: str
    command: str
    startedAt: datetime


class WlaslPredictionCandidateModel(BaseModel):
    sign: str
    confidence: float


class WlaslPredictRequestModel(BaseModel):
    landmarkPath: str | None = None
    sequence: list[list[float]] | None = None
    topK: int = Field(3, ge=1, le=10)

    @model_validator(mode="after")
    def validate_inputs(self):
        if not self.landmarkPath and not self.sequence:
            raise ValueError("Provide either landmarkPath or sequence.")
        return self


class WlaslPredictResponseModel(BaseModel):
    predictedSign: str
    confidence: float
    candidates: list[WlaslPredictionCandidateModel]
    avatarMotionData: dict[str, Any]


class WlaslModelInfoModel(BaseModel):
    modelPath: str | None = None
    labelMapPath: str | None = None
    metricsPath: str | None = None
    confusionMatrixPath: str | None = None
    classCount: int = 0
    sequenceLength: int | None = None
    featureDimension: int | None = None
    lastTrainedAt: str | None = None
    trainingStatus: str | None = None
