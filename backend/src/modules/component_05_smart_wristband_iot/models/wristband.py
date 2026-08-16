"""
Pydantic models for the smart haptic wristband module.
"""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


AlertTypeLiteral = Literal[
    "Distraction Alert",
    "Chatbot Reply",
    "Missed Lesson Segment",
    "Popup Question",
    "Exam Reminder",
    "Sign Avatar Replay",
    "Wrong Sign Alert",
    "Sign Success Alert",
    "Sign Practice Reminder",
]

VibrationPatternLiteral = Literal[
    "Short Pulse",
    "Double Pulse",
    "Long Pulse",
    "Short + Long",
    "Repeated Pulse",
    "Emergency Pulse",
]


class WristbandConfigRequestModel(BaseModel):
    studentId: str = Field(..., min_length=1)
    deviceId: str = Field(..., min_length=1)
    alertType: AlertTypeLiteral
    vibrationPattern: VibrationPatternLiteral
    oledMessage: str = Field(..., min_length=1, max_length=24)
    intensity: int = Field(70, ge=10, le=100)
    duration: int = Field(1000, ge=100, le=5000)


class WristbandConfigModel(BaseModel):
    id: str
    studentId: str
    deviceId: str
    alertType: str
    vibrationPattern: str
    oledMessage: str
    intensity: int
    duration: int
    deviceStatus: str
    updatedAt: datetime
    lastNotifiedAt: datetime | None = None


class WristbandNotificationRequestModel(BaseModel):
    studentId: str = Field(..., min_length=1)
    deviceId: str | None = None
    alertType: AlertTypeLiteral
    vibrationPattern: VibrationPatternLiteral | None = None
    oledMessage: str | None = Field(default=None, max_length=24)
    intensity: int | None = Field(default=None, ge=10, le=100)
    duration: int | None = Field(default=None, ge=100, le=5000)


class WristbandNotificationModel(BaseModel):
    id: str
    studentId: str
    deviceId: str
    alertType: str
    vibrationPattern: str
    oledMessage: str
    intensity: int
    duration: int
    status: str
    source: str
    createdAt: datetime


class WristbandHistoryEventModel(BaseModel):
    id: str
    studentId: str
    deviceId: str
    eventType: str
    alertType: str | None = None
    vibrationPattern: str | None = None
    oledMessage: str | None = None
    status: str
    details: str
    createdAt: datetime


class WristbandHistoryClearResponseModel(BaseModel):
    studentId: str
    deletedNotifications: int
    deletedHistoryEvents: int


class WristbandDeviceModel(BaseModel):
    id: str
    studentId: str
    deviceId: str
    deviceName: str
    connectionStatus: str
    batteryLevel: int
    firmwareVersion: str
    lastSeenAt: datetime
