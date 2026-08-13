"""Pydantic models for the Sign MNIST alphabet training pipeline."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class SignMnistStatusModel(BaseModel):
    datasetReady: bool
    trainCsvReady: bool
    testCsvReady: bool
    trainSampleCount: int
    testSampleCount: int
    classCount: int
    supportedLetters: list[str]
    unsupportedLetters: list[str]
    modelReady: bool
    latestStatus: dict[str, Any]
    directories: dict[str, str]


class SignMnistTrainRequestModel(BaseModel):
    epochs: int = Field(20, ge=1, le=300)
    batchSize: int = Field(128, ge=16, le=512)
    hiddenLayerSizes: list[int] = Field(default_factory=lambda: [256, 128], min_length=1, max_length=4)
    learningRate: float = Field(0.001, gt=0, le=1)
    forceRetrain: bool = False


class SignMnistTrainResponseModel(BaseModel):
    status: str
    message: str
    command: str
    startedAt: datetime


class SignMnistPredictionCandidateModel(BaseModel):
    sign: str
    confidence: float


class SignMnistPredictRequestModel(BaseModel):
    pixels: list[float] = Field(..., min_length=784, max_length=784)
    topK: int = Field(3, ge=1, le=10)


class SignMnistPredictResponseModel(BaseModel):
    predictedSign: str
    confidence: float
    candidates: list[SignMnistPredictionCandidateModel]
    avatarMotionData: dict[str, Any]


class SignMnistModelInfoModel(BaseModel):
    modelPath: str | None = None
    labelMapPath: str | None = None
    metricsPath: str | None = None
    confusionMatrixPath: str | None = None
    classCount: int = 0
    inputSize: int | None = None
    supportedLetters: list[str] = Field(default_factory=list)
    unsupportedLetters: list[str] = Field(default_factory=list)
    lastTrainedAt: str | None = None
    trainingStatus: str | None = None
