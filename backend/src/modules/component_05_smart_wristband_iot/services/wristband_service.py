"""
Service layer for the smart haptic wristband module.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from src.common.database.connection import get_db


WRISTBAND_DEVICES_COLLECTION = "wristbandDevices"
WRISTBAND_CONFIGS_COLLECTION = "wristbandConfigs"
WRISTBAND_NOTIFICATIONS_COLLECTION = "wristbandNotifications"
WRISTBAND_HISTORY_COLLECTION = "wristbandEventHistory"

MODULE_DIR = Path(__file__).resolve().parents[1]
WRISTBAND_ALERT_PRESETS = MODULE_DIR / "patterns" / "wristband_alert_presets.json"

DEFAULT_DEVICE_NAME = "SignLearn Smart Band"
DEFAULT_FIRMWARE_VERSION = "0.1.0-prototype"


async def initialize_wristband_data() -> None:
    db = get_db()
    await _ensure_indexes()
    await _seed_demo_device(db)


async def save_wristband_config(payload: dict[str, Any]) -> dict[str, Any]:
    db = get_db()
    preset = _resolve_alert_preset(payload["alertType"])
    created_at = datetime.now(timezone.utc)
    oled_message = _normalize_oled_message(payload.get("oledMessage") or preset["oledMessage"])

    await _ensure_device_record(
        db=db,
        student_id=payload["studentId"],
        device_id=payload["deviceId"],
        updated_at=created_at,
    )

    config_doc = {
        "studentId": payload["studentId"],
        "deviceId": payload["deviceId"],
        "alertType": payload["alertType"],
        "vibrationPattern": payload.get("vibrationPattern") or preset["vibrationPattern"],
        "oledMessage": oled_message,
        "intensity": payload.get("intensity") or preset["intensity"],
        "duration": payload.get("duration") or preset["duration"],
        "deviceStatus": "connected",
        "updatedAt": created_at,
    }

    await db[WRISTBAND_CONFIGS_COLLECTION].update_one(
        {"studentId": payload["studentId"]},
        {"$set": config_doc, "$setOnInsert": {"createdAt": created_at}},
        upsert=True,
    )

    await _append_history_event(
        db=db,
        student_id=payload["studentId"],
        device_id=payload["deviceId"],
        event_type="config_saved",
        alert_type=config_doc["alertType"],
        vibration_pattern=config_doc["vibrationPattern"],
        oled_message=config_doc["oledMessage"],
        status="saved",
        details=f"Configuration saved for {config_doc['alertType']}.",
        created_at=created_at,
    )

    saved_doc = await db[WRISTBAND_CONFIGS_COLLECTION].find_one({"studentId": payload["studentId"]})
    return _serialize_config(saved_doc)


async def get_wristband_config(student_id: str) -> dict[str, Any]:
    db = get_db()
    saved_doc = await db[WRISTBAND_CONFIGS_COLLECTION].find_one({"studentId": student_id})
    if saved_doc:
        return _serialize_config(saved_doc)

    device = await _ensure_device_record(
        db=db,
        student_id=student_id,
        device_id=f"band-{student_id}",
        updated_at=datetime.now(timezone.utc),
    )
    default_preset = _resolve_alert_preset("Distraction Alert")
    return {
        "id": f"default-{student_id}",
        "studentId": student_id,
        "deviceId": device["deviceId"],
        "alertType": default_preset["alertType"],
        "vibrationPattern": default_preset["vibrationPattern"],
        "oledMessage": default_preset["oledMessage"],
        "intensity": default_preset["intensity"],
        "duration": default_preset["duration"],
        "deviceStatus": device["connectionStatus"],
        "updatedAt": device["lastSeenAt"],
        "lastNotifiedAt": None,
    }


async def send_wristband_notification(payload: dict[str, Any], source: str = "system") -> dict[str, Any]:
    db = get_db()
    created_at = datetime.now(timezone.utc)
    device_id = payload.get("deviceId") or f"band-{payload['studentId']}"
    preset = _resolve_alert_preset(payload["alertType"])
    existing_config = await db[WRISTBAND_CONFIGS_COLLECTION].find_one({"studentId": payload["studentId"]})

    merged_pattern = payload.get("vibrationPattern") or (existing_config or {}).get("vibrationPattern") or preset["vibrationPattern"]
    merged_message = _normalize_oled_message(payload.get("oledMessage") or (existing_config or {}).get("oledMessage") or preset["oledMessage"])
    merged_intensity = payload.get("intensity") or (existing_config or {}).get("intensity") or preset["intensity"]
    merged_duration = payload.get("duration") or (existing_config or {}).get("duration") or preset["duration"]

    await _ensure_device_record(
        db=db,
        student_id=payload["studentId"],
        device_id=device_id,
        updated_at=created_at,
    )

    notification_doc = {
        "studentId": payload["studentId"],
        "deviceId": device_id,
        "alertType": payload["alertType"],
        "vibrationPattern": merged_pattern,
        "oledMessage": merged_message,
        "intensity": merged_intensity,
        "duration": merged_duration,
        "status": "queued",
        "source": source,
        "createdAt": created_at,
        "updatedAt": created_at,
    }

    result = await db[WRISTBAND_NOTIFICATIONS_COLLECTION].insert_one(notification_doc)
    await db[WRISTBAND_CONFIGS_COLLECTION].update_one(
        {"studentId": payload["studentId"]},
        {
            "$set": {
                "studentId": payload["studentId"],
                "deviceId": device_id,
                "alertType": payload["alertType"],
                "vibrationPattern": merged_pattern,
                "oledMessage": merged_message,
                "intensity": merged_intensity,
                "duration": merged_duration,
                "deviceStatus": "connected",
                "updatedAt": created_at,
                "lastNotifiedAt": created_at,
            },
            "$setOnInsert": {"createdAt": created_at},
        },
        upsert=True,
    )

    await _append_history_event(
        db=db,
        student_id=payload["studentId"],
        device_id=device_id,
        event_type="notification_sent" if source == "system" else "test_notification",
        alert_type=payload["alertType"],
        vibration_pattern=merged_pattern,
        oled_message=merged_message,
        status="queued",
        details=f"{source.title()} notification prepared for the ESP32 wristband.",
        created_at=created_at,
    )

    saved_doc = await db[WRISTBAND_NOTIFICATIONS_COLLECTION].find_one({"_id": result.inserted_id})
    return _serialize_notification(saved_doc)


async def get_wristband_history(student_id: str) -> list[dict[str, Any]]:
    db = get_db()
    cursor = db[WRISTBAND_HISTORY_COLLECTION].find({"studentId": student_id}).sort("createdAt", -1)
    history = []
    async for doc in cursor:
        history.append(_serialize_history_event(doc))
    return history


async def clear_wristband_history(student_id: str) -> dict[str, Any]:
    db = get_db()
    deleted_notifications = await db[WRISTBAND_NOTIFICATIONS_COLLECTION].delete_many({"studentId": student_id})
    deleted_history = await db[WRISTBAND_HISTORY_COLLECTION].delete_many({"studentId": student_id})
    return {
        "studentId": student_id,
        "deletedNotifications": deleted_notifications.deleted_count,
        "deletedHistoryEvents": deleted_history.deleted_count,
    }


async def get_wristband_device(student_id: str) -> dict[str, Any]:
    db = get_db()
    doc = await db[WRISTBAND_DEVICES_COLLECTION].find_one({"studentId": student_id})
    if not doc:
        doc = await _ensure_device_record(
            db=db,
            student_id=student_id,
            device_id=f"band-{student_id}",
            updated_at=datetime.now(timezone.utc),
        )
    return _serialize_device(doc)


async def _ensure_indexes() -> None:
    db = get_db()
    await db[WRISTBAND_DEVICES_COLLECTION].create_index("studentId", unique=True)
    await db[WRISTBAND_DEVICES_COLLECTION].create_index("deviceId", unique=True)
    await db[WRISTBAND_CONFIGS_COLLECTION].create_index("studentId", unique=True)
    await db[WRISTBAND_NOTIFICATIONS_COLLECTION].create_index([("studentId", 1), ("createdAt", -1)])
    await db[WRISTBAND_HISTORY_COLLECTION].create_index([("studentId", 1), ("createdAt", -1)])


async def _seed_demo_device(db) -> None:
    seeded_at = datetime.now(timezone.utc)
    await _ensure_device_record(
        db=db,
        student_id="student_demo_123",
        device_id="band-student_demo_123",
        updated_at=seeded_at,
    )


async def _ensure_device_record(db, student_id: str, device_id: str, updated_at: datetime) -> dict[str, Any]:
    await db[WRISTBAND_DEVICES_COLLECTION].update_one(
        {"studentId": student_id},
        {
            "$set": {
                "studentId": student_id,
                "deviceId": device_id,
                "deviceName": DEFAULT_DEVICE_NAME,
                "connectionStatus": "connected",
                "batteryLevel": 82,
                "firmwareVersion": DEFAULT_FIRMWARE_VERSION,
                "lastSeenAt": updated_at,
                "updatedAt": updated_at,
            },
            "$setOnInsert": {"createdAt": updated_at},
        },
        upsert=True,
    )
    return await db[WRISTBAND_DEVICES_COLLECTION].find_one({"studentId": student_id})


async def _append_history_event(
    db,
    student_id: str,
    device_id: str,
    event_type: str,
    alert_type: str | None,
    vibration_pattern: str | None,
    oled_message: str | None,
    status: str,
    details: str,
    created_at: datetime,
) -> None:
    await db[WRISTBAND_HISTORY_COLLECTION].insert_one(
        {
            "studentId": student_id,
            "deviceId": device_id,
            "eventType": event_type,
            "alertType": alert_type,
            "vibrationPattern": vibration_pattern,
            "oledMessage": oled_message,
            "status": status,
            "details": details,
            "createdAt": created_at,
        }
    )


def _resolve_alert_preset(alert_type: str) -> dict[str, Any]:
    presets = _read_json(WRISTBAND_ALERT_PRESETS)["alerts"]
    for preset in presets:
        if preset["alertType"] == alert_type:
            return preset
    return presets[0]


def _normalize_oled_message(message: str) -> str:
    compact = " ".join(str(message).upper().split())
    return compact[:18]


def _serialize_config(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc.get("_id", doc.get("id", "config"))),
        "studentId": doc["studentId"],
        "deviceId": doc["deviceId"],
        "alertType": doc["alertType"],
        "vibrationPattern": doc["vibrationPattern"],
        "oledMessage": doc["oledMessage"],
        "intensity": doc["intensity"],
        "duration": doc["duration"],
        "deviceStatus": doc.get("deviceStatus", "connected"),
        "updatedAt": doc["updatedAt"],
        "lastNotifiedAt": doc.get("lastNotifiedAt"),
    }


def _serialize_notification(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "studentId": doc["studentId"],
        "deviceId": doc["deviceId"],
        "alertType": doc["alertType"],
        "vibrationPattern": doc["vibrationPattern"],
        "oledMessage": doc["oledMessage"],
        "intensity": doc["intensity"],
        "duration": doc["duration"],
        "status": doc["status"],
        "source": doc["source"],
        "createdAt": doc["createdAt"],
    }


def _serialize_history_event(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "studentId": doc["studentId"],
        "deviceId": doc["deviceId"],
        "eventType": doc["eventType"],
        "alertType": doc.get("alertType"),
        "vibrationPattern": doc.get("vibrationPattern"),
        "oledMessage": doc.get("oledMessage"),
        "status": doc["status"],
        "details": doc["details"],
        "createdAt": doc["createdAt"],
    }


def _serialize_device(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "studentId": doc["studentId"],
        "deviceId": doc["deviceId"],
        "deviceName": doc["deviceName"],
        "connectionStatus": doc["connectionStatus"],
        "batteryLevel": doc["batteryLevel"],
        "firmwareVersion": doc["firmwareVersion"],
        "lastSeenAt": doc["lastSeenAt"],
    }


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))
