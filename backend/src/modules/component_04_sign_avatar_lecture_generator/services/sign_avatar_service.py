"""
Service layer for the text-to-3D sign language avatar prototype module.
"""
from __future__ import annotations

import asyncio
import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib import request as urllib_request
from uuid import uuid4

from src.common.config.settings import settings
from src.common.database.connection import get_db
from pymongo import ReturnDocument


SIGN_GESTURE_DATASET_COLLECTION = "signGestureDataset"
LEARNED_SIGN_PATTERN_COLLECTION = "learnedSignPatterns"
SIGN_AVATAR_SESSIONS_COLLECTION = "signAvatarSessions"
SIGN_AVATAR_HISTORY_COLLECTION = "signAvatarHistory"
MISSED_SIGN_SEGMENTS_COLLECTION = "missedSignSegments"
SIGN_LECTURES_COLLECTION = "signLectures"
SIGN_LECTURE_SEGMENTS_COLLECTION = "signLectureSegments"
SIGN_LECTURE_HISTORY_COLLECTION = "signLectureHistory"
KNOWLEDGE_GRAPH_COLLECTION = "knowledge_graph"
STUDENT_LEARNING_STATES_COLLECTION = "studentLearningStates"
ATTENTION_LOGS_COLLECTION = "attention_logs"

MODULE_DIR = Path(__file__).resolve().parents[1]
SIGN_GESTURE_DATASET = MODULE_DIR / "gestures" / "sign_gesture_dataset.json"

ENGLISH_FILLER_WORDS = {
    "a",
    "an",
    "the",
    "is",
    "are",
    "am",
    "was",
    "were",
    "to",
    "of",
    "for",
    "in",
    "on",
    "at",
    "this",
    "that",
    "these",
    "those",
    "with",
    "and",
    "or",
    "by",
    "be",
}

SEGMENT_ACTION_WORDS = {
    "accepts",
    "accept",
    "processes",
    "process",
    "stores",
    "store",
    "produces",
    "produce",
    "shows",
    "show",
    "sends",
    "send",
    "receives",
    "receive",
    "manages",
    "manage",
    "protects",
    "protect",
    "connects",
    "connect",
    "organizes",
    "organize",
    "keeps",
    "keep",
    "gives",
    "give",
    "uses",
    "use",
    "helps",
    "help",
}

SEMANTIC_PHRASE_GLOSS_MAP: list[tuple[tuple[str, ...], str]] = [
    (("computer", "system"), "COMPUTER"),
    (("input", "data"), "INPUT"),
    (("output", "information"), "OUTPUT"),
    (("storage", "device"), "MEMORY"),
    (("world", "wide", "web"), "INTERNET"),
    (("computer", "network"), "NETWORK"),
    (("information", "security"), "SECURITY"),
    (("data", "security"), "SECURITY"),
    (("computer", "program"), "PROGRAM"),
    (("database", "table"), "DATABASE"),
]

SEMANTIC_WORD_GLOSS_MAP = {
    "computer": "COMPUTER",
    "device": "DEVICE",
    "electronic": "ELECTRONIC",
    "pc": "COMPUTER",
    "system": "COMPUTER",
    "data": "DATA",
    "raw": "DATA",
    "information": "INFORMATION",
    "internet": "INTERNET",
    "web": "INTERNET",
    "online": "INTERNET",
    "email": "EMAIL",
    "mail": "EMAIL",
    "database": "DATABASE",
    "databases": "DATABASE",
    "table": "DATABASE",
    "tables": "DATABASE",
    "record": "DATABASE",
    "records": "DATABASE",
    "field": "DATABASE",
    "fields": "DATABASE",
    "query": "DATABASE",
    "queries": "DATABASE",
    "program": "PROGRAM",
    "programs": "PROGRAM",
    "programming": "PROGRAM",
    "code": "PROGRAM",
    "coding": "PROGRAM",
    "flowchart": "FLOWCHART",
    "algorithm": "FLOWCHART",
    "algorithms": "FLOWCHART",
    "security": "SECURITY",
    "secure": "SECURITY",
    "protection": "SECURITY",
    "protect": "SECURITY",
    "password": "SECURITY",
    "hardware": "HARDWARE",
    "software": "SOFTWARE",
    "application": "SOFTWARE",
    "applications": "SOFTWARE",
    "app": "SOFTWARE",
    "input": "INPUT",
    "enter": "INPUT",
    "insert": "INPUT",
    "output": "OUTPUT",
    "result": "OUTPUT",
    "results": "OUTPUT",
    "display": "OUTPUT",
    "memory": "MEMORY",
    "storage": "MEMORY",
    "store": "MEMORY",
    "stored": "MEMORY",
    "save": "MEMORY",
    "saved": "MEMORY",
    "network": "NETWORK",
    "networks": "NETWORK",
    "networking": "NETWORK",
    "connection": "NETWORK",
    "connections": "NETWORK",
}

LOGGER = logging.getLogger(__name__)

ICT_SIGN_DICTIONARY = [
    {"keyword": "computer", "sinhalaMeaning": "පරිගණකය", "englishMeaning": "Computer", "animationName": "computer_sign_animation", "fallbackGesture": "typing_pose", "subtitleText": "Computer", "glossWord": "COMPUTER", "duration": 2.0},
    {"keyword": "network", "sinhalaMeaning": "ජාලය", "englishMeaning": "Network", "animationName": "network_sign_animation", "fallbackGesture": "linked_hands_pose", "subtitleText": "Network", "glossWord": "NETWORK", "duration": 2.0},
    {"keyword": "database", "sinhalaMeaning": "දත්ත ගබඩාව", "englishMeaning": "Database", "animationName": "database_sign_animation", "fallbackGesture": "stacked_storage_pose", "subtitleText": "Database", "glossWord": "DATABASE", "duration": 2.0},
    {"keyword": "algorithm", "sinhalaMeaning": "අල්ගොරිතමය", "englishMeaning": "Algorithm", "animationName": "algorithm_sign_animation", "fallbackGesture": "step_path_pose", "subtitleText": "Algorithm", "glossWord": "ALGORITHM", "duration": 1.9},
    {"keyword": "software", "sinhalaMeaning": "මෘදුකාංග", "englishMeaning": "Software", "animationName": "software_sign_animation", "fallbackGesture": "logic_open_pose", "subtitleText": "Software", "glossWord": "SOFTWARE", "duration": 1.8},
    {"keyword": "hardware", "sinhalaMeaning": "දෘඩාංග", "englishMeaning": "Hardware", "animationName": "hardware_sign_animation", "fallbackGesture": "solid_component_pose", "subtitleText": "Hardware", "glossWord": "HARDWARE", "duration": 1.8},
    {"keyword": "internet", "sinhalaMeaning": "අන්තර්ජාලය", "englishMeaning": "Internet", "animationName": "internet_sign_animation", "fallbackGesture": "web_link_pose", "subtitleText": "Internet", "glossWord": "INTERNET", "duration": 2.0},
    {"keyword": "input", "sinhalaMeaning": "ආදානය", "englishMeaning": "Input", "animationName": "input_sign_animation", "fallbackGesture": "inward_point_pose", "subtitleText": "Input", "glossWord": "INPUT", "duration": 1.7},
    {"keyword": "output", "sinhalaMeaning": "ප්‍රතිදානය", "englishMeaning": "Output", "animationName": "output_sign_animation", "fallbackGesture": "outward_release_pose", "subtitleText": "Output", "glossWord": "OUTPUT", "duration": 1.7},
    {"keyword": "cpu", "sinhalaMeaning": "මධ්‍යම සැකසුම් ඒකකය", "englishMeaning": "CPU", "animationName": "cpu_sign_animation", "fallbackGesture": "center_focus_pose", "subtitleText": "CPU", "glossWord": "CPU", "duration": 1.8},
    {"keyword": "memory", "sinhalaMeaning": "මතකය", "englishMeaning": "Memory", "animationName": "memory_sign_animation", "fallbackGesture": "memory_hold_pose", "subtitleText": "Memory", "glossWord": "MEMORY", "duration": 1.8},
    {"keyword": "storage", "sinhalaMeaning": "ගබඩා කිරීම", "englishMeaning": "Storage", "animationName": "storage_sign_animation", "fallbackGesture": "memory_hold_pose", "subtitleText": "Storage", "glossWord": "STORAGE", "duration": 1.8},
    {"keyword": "keyboard", "sinhalaMeaning": "යතුරුපුවරුව", "englishMeaning": "Keyboard", "animationName": "keyboard_sign_animation", "fallbackGesture": "typing_pose", "subtitleText": "Keyboard", "glossWord": "KEYBOARD", "duration": 1.7},
    {"keyword": "mouse", "sinhalaMeaning": "මවුසය", "englishMeaning": "Mouse", "animationName": "mouse_sign_animation", "fallbackGesture": "point_click_pose", "subtitleText": "Mouse", "glossWord": "MOUSE", "duration": 1.6},
    {"keyword": "monitor", "sinhalaMeaning": "තිරය", "englishMeaning": "Monitor", "animationName": "monitor_sign_animation", "fallbackGesture": "screen_frame_pose", "subtitleText": "Monitor", "glossWord": "MONITOR", "duration": 1.7},
    {"keyword": "code", "sinhalaMeaning": "කේතය", "englishMeaning": "Code", "animationName": "code_sign_animation", "fallbackGesture": "code_entry_pose", "subtitleText": "Code", "glossWord": "CODE", "duration": 1.8},
    {"keyword": "program", "sinhalaMeaning": "වැඩසටහන", "englishMeaning": "Program", "animationName": "program_sign_animation", "fallbackGesture": "sequence_flow_pose", "subtitleText": "Program", "glossWord": "PROGRAM", "duration": 1.8},
    {"keyword": "data", "sinhalaMeaning": "දත්ත", "englishMeaning": "Data", "animationName": "data_sign_animation", "fallbackGesture": "data_cup_pose", "subtitleText": "Data", "glossWord": "DATA", "duration": 1.8},
    {"keyword": "information", "sinhalaMeaning": "තොරතුරු", "englishMeaning": "Information", "animationName": "information_sign_animation", "fallbackGesture": "present_information_pose", "subtitleText": "Information", "glossWord": "INFORMATION", "duration": 1.9},
    {"keyword": "security", "sinhalaMeaning": "ආරක්ෂාව", "englishMeaning": "Security", "animationName": "security_sign_animation", "fallbackGesture": "shield_pose", "subtitleText": "Security", "glossWord": "SECURITY", "duration": 1.9},
    {"keyword": "password", "sinhalaMeaning": "මුරපදය", "englishMeaning": "Password", "animationName": "password_sign_animation", "fallbackGesture": "shield_pose", "subtitleText": "Password", "glossWord": "PASSWORD", "duration": 1.8},
    {"keyword": "login", "sinhalaMeaning": "පිවිසුම", "englishMeaning": "Login", "animationName": "login_sign_animation", "fallbackGesture": "inward_point_pose", "subtitleText": "Login", "glossWord": "LOGIN", "duration": 1.7},
    {"keyword": "file", "sinhalaMeaning": "ගොනුව", "englishMeaning": "File", "animationName": "file_sign_animation", "fallbackGesture": "document_frame_pose", "subtitleText": "File", "glossWord": "FILE", "duration": 1.6},
    {"keyword": "folder", "sinhalaMeaning": "ෆෝල්ඩරය", "englishMeaning": "Folder", "animationName": "folder_sign_animation", "fallbackGesture": "document_frame_pose", "subtitleText": "Folder", "glossWord": "FOLDER", "duration": 1.6},
    {"keyword": "server", "sinhalaMeaning": "සර්වරය", "englishMeaning": "Server", "animationName": "server_sign_animation", "fallbackGesture": "stacked_storage_pose", "subtitleText": "Server", "glossWord": "SERVER", "duration": 1.9},
    {"keyword": "browser", "sinhalaMeaning": "වෙබ් බ්‍රව්සරය", "englishMeaning": "Browser", "animationName": "browser_sign_animation", "fallbackGesture": "web_link_pose", "subtitleText": "Browser", "glossWord": "BROWSER", "duration": 1.8},
    {"keyword": "website", "sinhalaMeaning": "වෙබ් අඩවිය", "englishMeaning": "Website", "animationName": "website_sign_animation", "fallbackGesture": "web_link_pose", "subtitleText": "Website", "glossWord": "WEBSITE", "duration": 1.8},
    {"keyword": "email", "sinhalaMeaning": "විද්‍යුත් තැපෑල", "englishMeaning": "Email", "animationName": "email_sign_animation", "fallbackGesture": "message_send_pose", "subtitleText": "Email", "glossWord": "EMAIL", "duration": 1.8},
    {"keyword": "cloud", "sinhalaMeaning": "ක්ලවුඩ්", "englishMeaning": "Cloud", "animationName": "cloud_sign_animation", "fallbackGesture": "web_link_pose", "subtitleText": "Cloud", "glossWord": "CLOUD", "duration": 1.8},
    {"keyword": "device", "sinhalaMeaning": "උපාංගය", "englishMeaning": "Device", "animationName": "device_sign_animation", "fallbackGesture": "device_frame_pose", "subtitleText": "Device", "glossWord": "DEVICE", "duration": 1.7},
]


async def initialize_sign_avatar_data() -> None:
    """Seed the gesture dataset and ensure indexes."""
    db = get_db()
    await _ensure_indexes()
    dataset = _read_json(SIGN_GESTURE_DATASET)
    seeded_at = datetime.now(timezone.utc)

    for sort_order, gesture in enumerate(dataset["gestures"], start=1):
        await db[SIGN_GESTURE_DATASET_COLLECTION].update_one(
            {"glossWord": gesture["glossWord"]},
            {
                "$set": {
                    **gesture,
                    "subject": dataset["subject"],
                    "datasetVersion": dataset["version"],
                    "sortOrder": sort_order,
                    "updatedAt": seeded_at,
                }
            },
            upsert=True,
        )

    # The lesson-note player also has a curated ICT vocabulary.  Keep every
    # vocabulary gloss available to the API even while the visual hand rig is
    # supplied by the frontend pose library.  This avoids incorrectly falling
    # back to fingerspelling for terms such as CPU, keyboard, or password.
    dataset_glosses = {gesture["glossWord"] for gesture in dataset["gestures"]}
    for sort_order, entry in enumerate(ICT_SIGN_DICTIONARY, start=len(dataset_glosses) + 1):
        gloss_word = entry["glossWord"]
        if gloss_word in dataset_glosses:
            continue
        await db[SIGN_GESTURE_DATASET_COLLECTION].update_one(
            {"glossWord": gloss_word},
            {
                "$set": {
                    "glossWord": gloss_word,
                    "animationFile": f"pose-library/{gloss_word.lower()}.json",
                    "description": f"Curated ICT visual gesture for {entry['englishMeaning']}.",
                    "fallbackType": "direct",
                    "animationDuration": int(entry.get("duration", 1.8) * 1000),
                    "subject": "O/L ICT",
                    "datasetVersion": "2.1.0",
                    "sortOrder": sort_order,
                    "updatedAt": seeded_at,
                }
            },
            upsert=True,
        )


async def generate_sign_avatar(payload: dict[str, Any]) -> dict[str, Any]:
    db = get_db()
    gesture_library = await _load_gesture_library(db)

    learning_state = _normalize_learning_state(payload.get("currentLearningState"))
    topic = await _resolve_topic_name(payload.get("currentTopic"), payload["inputText"])
    monitoring_status = await _resolve_monitoring_status(payload["studentId"])

    cleaned_words = _clean_input_text(payload["inputText"], payload.get("selectedLanguage", "English"))
    gloss_tokens = _build_semantic_gloss_tokens(cleaned_words, set(gesture_library))
    generated_gloss = _generate_gloss(gloss_tokens)
    gesture_sequence = _map_gestures(gloss_tokens, gesture_library)
    replay_suggestion = (
        "Student looks distracted. Replay this sequence in slow mode."
        if monitoring_status == "Distracted"
        else None
    )

    created_at = datetime.now(timezone.utc)
    history_doc = {
        "studentId": payload["studentId"],
        "inputText": payload["inputText"],
        "cleanedWords": cleaned_words,
        "generatedGloss": generated_gloss,
        "gestureSequence": gesture_sequence,
        "learningState": learning_state,
        "topic": topic,
        "selectedLanguage": payload.get("selectedLanguage", "English"),
        "monitoringStatus": monitoring_status,
        "createdAt": created_at,
        "updatedAt": created_at,
    }

    history_result = await db[SIGN_AVATAR_HISTORY_COLLECTION].insert_one(history_doc)
    await db[SIGN_AVATAR_SESSIONS_COLLECTION].update_one(
        {"studentId": payload["studentId"]},
        {
            "$set": {
                "studentId": payload["studentId"],
                "latestHistoryId": history_result.inserted_id,
                "generatedGloss": generated_gloss,
                "gestureSequence": gesture_sequence,
                "learningState": learning_state,
                "topic": topic,
                "monitoringStatus": monitoring_status,
                "updatedAt": created_at,
            },
            "$setOnInsert": {"createdAt": created_at},
            "$inc": {"sessionCount": 1},
        },
        upsert=True,
    )

    saved_doc = await db[SIGN_AVATAR_HISTORY_COLLECTION].find_one({"_id": history_result.inserted_id})
    return _serialize_generate_response(saved_doc, replay_suggestion)


async def generate_sign_avatar_sequence(payload: dict[str, Any]) -> dict[str, Any]:
    db = get_db()
    gesture_library = await _load_gesture_library(db)
    topic = await _resolve_topic_name(payload.get("currentTopic"), payload["lessonText"])
    learning_state = _normalize_learning_state(payload.get("currentLearningState"))
    extracted = await _extract_sign_keywords_and_text(
        lesson_text=payload["lessonText"],
        topic=topic,
        selected_language=payload.get("selectedLanguage", "English"),
    )
    sequence = _build_avatar_animation_sequence(extracted["keywords"], gesture_library)
    subtitle_segments = _build_subtitle_segments(sequence)

    return {
        "keywords": [item["keyword"] for item in sequence],
        "avatarAnimationSequence": sequence,
        "subtitleSegments": subtitle_segments,
        "sourceType": extracted["sourceType"],
        "simplifiedText": extracted["simplifiedText"],
        "llmAssisted": extracted["llmAssisted"],
    }


async def get_gestures() -> dict[str, Any]:
    db = get_db()
    gestures = []
    gesture_library = await _load_gesture_library(db)
    for gesture in sorted(gesture_library.values(), key=lambda item: item.get("sortOrder", 9999)):
        gestures.append(
            {
                "glossWord": gesture["glossWord"],
                "animationFile": gesture["animationFile"],
                "description": gesture["description"],
                "fallbackType": gesture["fallbackType"],
                "durationMs": gesture.get("animationDuration", gesture.get("durationMs", 1400)),
                "animationDuration": gesture.get("animationDuration", gesture.get("durationMs", 1400)),
                "leftHandPose": gesture.get("leftHandPose"),
                "rightHandPose": gesture.get("rightHandPose"),
                "boneRotationValues": gesture.get("boneRotationValues"),
            }
        )

    return {
        "count": len(gestures),
        "gestures": gestures,
    }


async def get_sign_avatar_history(student_id: str) -> list[dict[str, Any]]:
    db = get_db()
    cursor = db[SIGN_AVATAR_HISTORY_COLLECTION].find({"studentId": student_id}).sort("createdAt", -1)
    history = []
    async for doc in cursor:
        history.append(_serialize_history(doc))
    return history


async def clear_sign_avatar_history(student_id: str) -> dict[str, Any]:
    db = get_db()
    deleted_history = await db[SIGN_AVATAR_HISTORY_COLLECTION].delete_many({"studentId": student_id})
    deleted_sessions = await db[SIGN_AVATAR_SESSIONS_COLLECTION].delete_many({"studentId": student_id})
    deleted_missed = await db[MISSED_SIGN_SEGMENTS_COLLECTION].delete_many({"studentId": student_id})
    return {
        "studentId": student_id,
        "deletedHistory": deleted_history.deleted_count,
        "deletedSessions": deleted_sessions.deleted_count,
        "deletedMissedSegments": deleted_missed.deleted_count,
    }


async def generate_sign_lecture(payload: dict[str, Any]) -> dict[str, Any]:
    db = get_db()
    created_at = datetime.now(timezone.utc)
    lecture_id = f"lecture_{uuid4().hex[:12]}"
    gesture_library = await _load_gesture_library(db)

    normalized_notes = _normalize_notes_text(payload["notesText"])
    note_sentences = _split_notes_into_sentences(normalized_notes)
    key_words = await _extract_ict_keywords(normalized_notes, payload.get("topic", ""))
    generated_script = _generate_lecture_script(
        topic=payload["topic"],
        note_sentences=note_sentences,
        difficulty_level=payload.get("difficultyLevel", "beginner"),
        key_words=key_words,
    )

    segments: list[dict[str, Any]] = []
    warnings: list[str] = []

    for order_index, script_line in enumerate(generated_script, start=1):
        cleaned_words = _clean_input_text(script_line, payload.get("language", "English"))
        gloss_tokens = _build_semantic_gloss_tokens(cleaned_words, set(gesture_library))
        generated_gloss = _generate_gloss(gloss_tokens)
        gesture_sequence = _map_gestures(gloss_tokens, gesture_library)
        segment_warning = _build_segment_warning(gesture_sequence)
        if segment_warning:
            warnings.append(segment_warning)

        original_text = note_sentences[min(order_index - 1, max(0, len(note_sentences) - 1))] if note_sentences else script_line
        segment_keywords = await _extract_ict_keywords(script_line, payload.get("topic", ""))
        estimated_duration = _estimate_segment_duration(gesture_sequence, script_line)
        segments.append(
            {
                "lectureId": lecture_id,
                "segmentId": f"{lecture_id}_seg_{order_index:02d}",
                "originalText": original_text,
                "simplifiedScript": script_line,
                "generatedGloss": generated_gloss or "READY",
                "gestureSequence": gesture_sequence,
                "estimatedDuration": estimated_duration,
                "keyWords": segment_keywords,
                "orderIndex": order_index,
                "warning": segment_warning,
                "createdAt": created_at,
                "updatedAt": created_at,
            }
        )

    lecture_doc = {
        "lectureId": lecture_id,
        "teacherId": payload["teacherId"],
        "lessonTitle": payload["lessonTitle"].strip(),
        "subject": payload["subject"].strip(),
        "topic": payload["topic"].strip(),
        "language": payload.get("language", "English"),
        "difficultyLevel": payload.get("difficultyLevel", "beginner"),
        "notesText": normalized_notes,
        "generatedScript": generated_script,
        "status": "draft",
        "warnings": sorted(set(warnings)),
        "createdAt": created_at,
        "updatedAt": created_at,
    }

    await db[SIGN_LECTURES_COLLECTION].insert_one(lecture_doc)
    if segments:
        await db[SIGN_LECTURE_SEGMENTS_COLLECTION].insert_many(segments)

    await db[SIGN_LECTURE_HISTORY_COLLECTION].insert_one(
        {
            "lectureId": lecture_id,
            "teacherId": payload["teacherId"],
            "action": "generated",
            "lessonTitle": lecture_doc["lessonTitle"],
            "topic": lecture_doc["topic"],
            "createdAt": created_at,
        }
    )

    return _serialize_sign_lecture(lecture_doc, segments)


async def get_sign_lecture(lecture_id: str) -> dict[str, Any] | None:
    db = get_db()
    lecture_doc = await db[SIGN_LECTURES_COLLECTION].find_one({"lectureId": lecture_id})
    if not lecture_doc:
        return None
    segments = await db[SIGN_LECTURE_SEGMENTS_COLLECTION].find({"lectureId": lecture_id}).sort("orderIndex", 1).to_list(length=None)
    return _serialize_sign_lecture(lecture_doc, segments)


async def list_sign_lectures(teacher_id: str) -> list[dict[str, Any]]:
    db = get_db()
    cursor = db[SIGN_LECTURES_COLLECTION].find({"teacherId": teacher_id}).sort("updatedAt", -1)
    lectures: list[dict[str, Any]] = []
    async for doc in cursor:
        segment_count = await db[SIGN_LECTURE_SEGMENTS_COLLECTION].count_documents({"lectureId": doc["lectureId"]})
        lectures.append(
            {
                "lectureId": doc["lectureId"],
                "lessonTitle": doc["lessonTitle"],
                "subject": doc["subject"],
                "topic": doc["topic"],
                "language": doc["language"],
                "difficultyLevel": doc.get("difficultyLevel", "beginner"),
                "segmentCount": segment_count,
                "status": doc.get("status", "draft"),
                "createdAt": doc["createdAt"],
                "updatedAt": doc["updatedAt"],
            }
        )
    return lectures


async def save_sign_lecture(payload: dict[str, Any]) -> dict[str, Any] | None:
    db = get_db()
    updated_at = datetime.now(timezone.utc)
    lecture_doc = await db[SIGN_LECTURES_COLLECTION].find_one_and_update(
        {"lectureId": payload["lectureId"], "teacherId": payload["teacherId"]},
        {
            "$set": {
                "status": "saved",
                "updatedAt": updated_at,
            }
        },
        return_document=ReturnDocument.AFTER,
    )
    if not lecture_doc:
        return None

    await db[SIGN_LECTURE_HISTORY_COLLECTION].insert_one(
        {
            "lectureId": payload["lectureId"],
            "teacherId": payload["teacherId"],
            "action": "saved",
            "lessonTitle": lecture_doc["lessonTitle"],
            "topic": lecture_doc["topic"],
            "createdAt": updated_at,
        }
    )
    segments = await db[SIGN_LECTURE_SEGMENTS_COLLECTION].find({"lectureId": payload["lectureId"]}).sort("orderIndex", 1).to_list(length=None)
    return _serialize_sign_lecture(lecture_doc, segments)


async def delete_sign_lecture(lecture_id: str) -> dict[str, Any]:
    db = get_db()
    deleted_lecture = await db[SIGN_LECTURES_COLLECTION].delete_one({"lectureId": lecture_id})
    deleted_segments = await db[SIGN_LECTURE_SEGMENTS_COLLECTION].delete_many({"lectureId": lecture_id})
    deleted_history = await db[SIGN_LECTURE_HISTORY_COLLECTION].delete_many({"lectureId": lecture_id})
    return {
        "lectureId": lecture_id,
        "deletedLecture": deleted_lecture.deleted_count > 0,
        "deletedSegments": deleted_segments.deleted_count,
        "deletedHistory": deleted_history.deleted_count,
    }


async def mark_missed_sign_segment(payload: dict[str, Any]) -> dict[str, Any]:
    db = get_db()
    created_at = datetime.now(timezone.utc)
    doc = {
        "studentId": payload["studentId"],
        "sessionId": payload.get("sessionId"),
        "glossWord": payload["glossWord"],
        "sequenceIndex": payload["sequenceIndex"],
        "timeSeconds": payload.get("timeSeconds", 0),
        "learningState": _normalize_learning_state(payload.get("learningState")),
        "topic": payload.get("topic"),
        "createdAt": created_at,
    }
    result = await db[MISSED_SIGN_SEGMENTS_COLLECTION].insert_one(doc)
    saved_doc = await db[MISSED_SIGN_SEGMENTS_COLLECTION].find_one({"_id": result.inserted_id})
    return _serialize_missed_segment(saved_doc)


async def save_learned_sign_pattern(payload: dict[str, Any]) -> dict[str, Any]:
    """Save a teacher-verified correction as the preferred reusable sign pattern."""
    db = get_db()
    word = re.sub(r"\s+", "_", payload["word"].strip().upper())
    frames = _normalize_learned_motion_frames(payload["frames"])
    trajectory = _extract_motion_trajectory(frames)
    now = datetime.now(timezone.utc)
    duration_ms = frames[-1]["timestampMs"] - frames[0]["timestampMs"]

    existing = await db[LEARNED_SIGN_PATTERN_COLLECTION].find_one({"word": word})
    version = int(existing.get("version", 0)) + 1 if existing else 1
    pattern = {
        "word": word,
        "teacherId": payload["teacherId"],
        "meaning": payload.get("meaning"),
        "category": payload.get("category", "ICT"),
        "facialExpression": payload.get("facialExpression", "neutral"),
        "sourceGloss": payload.get("sourceGloss") or word,
        "frames": frames,
        "trajectory": trajectory,
        "frameCount": len(frames),
        "durationMs": duration_ms,
        "version": version,
        "approved": True,
        "updatedAt": now,
    }
    if not existing:
        pattern["createdAt"] = now

    await db[LEARNED_SIGN_PATTERN_COLLECTION].update_one(
        {"word": word},
        {"$set": pattern, "$setOnInsert": {"createdAt": now}},
        upsert=True,
    )

    # Mirror a compact reference into the active gesture library.  The full
    # sampled frames remain in learnedSignPatterns; the generator can now
    # resolve this word as a direct, teacher-approved local sign.
    await db[SIGN_GESTURE_DATASET_COLLECTION].update_one(
        {"glossWord": word},
        {
            "$set": {
                "glossWord": word,
                "animationFile": f"learned-patterns/{word.lower()}-v{version}.json",
                "description": f"Teacher-verified learned sign pattern for {word}.",
                "fallbackType": "direct",
                "animationDuration": max(600, duration_ms),
                "learnedPattern": {
                    "word": word,
                    "version": version,
                    "trajectory": trajectory,
                    "frameCount": len(frames),
                    "teacherId": payload["teacherId"],
                    "updatedAt": now,
                },
                "updatedAt": now,
            },
            "$setOnInsert": {"subject": "O/L ICT", "datasetVersion": "learned", "sortOrder": 999},
        },
        upsert=True,
    )
    saved = await db[LEARNED_SIGN_PATTERN_COLLECTION].find_one({"word": word})
    return _serialize_learned_sign_pattern(saved)


async def get_learned_sign_patterns() -> list[dict[str, Any]]:
    db = get_db()
    patterns = await db[LEARNED_SIGN_PATTERN_COLLECTION].find({"approved": True}).sort("updatedAt", -1).to_list(length=None)
    return [_serialize_learned_sign_pattern(pattern) for pattern in patterns]


async def _ensure_indexes() -> None:
    db = get_db()
    await db[SIGN_GESTURE_DATASET_COLLECTION].create_index("glossWord", unique=True)
    await db[LEARNED_SIGN_PATTERN_COLLECTION].create_index("word", unique=True)
    await db[LEARNED_SIGN_PATTERN_COLLECTION].create_index([("teacherId", 1), ("updatedAt", -1)])
    await db[SIGN_AVATAR_HISTORY_COLLECTION].create_index([("studentId", 1), ("createdAt", -1)])
    await db[SIGN_AVATAR_SESSIONS_COLLECTION].create_index("studentId", unique=True)
    await db[MISSED_SIGN_SEGMENTS_COLLECTION].create_index([("studentId", 1), ("createdAt", -1)])
    await db[SIGN_LECTURES_COLLECTION].create_index("lectureId", unique=True)
    await db[SIGN_LECTURES_COLLECTION].create_index([("teacherId", 1), ("updatedAt", -1)])
    await db[SIGN_LECTURE_SEGMENTS_COLLECTION].create_index([("lectureId", 1), ("orderIndex", 1)])
    await db[SIGN_LECTURE_HISTORY_COLLECTION].create_index([("teacherId", 1), ("createdAt", -1)])


def _clean_input_text(input_text: str, selected_language: str) -> list[str]:
    normalized = re.sub(r"[^\w\s]", " ", input_text, flags=re.UNICODE)
    tokens = [token.strip() for token in normalized.split() if token.strip()]
    if selected_language == "Sinhala":
        return tokens[:8]
    filtered = [token for token in tokens if token.lower() not in ENGLISH_FILLER_WORDS]
    return filtered[:8] if filtered else tokens[:8]


def _generate_gloss(cleaned_words: list[str]) -> str:
    return " ".join(word.upper() for word in cleaned_words)


def _match_semantic_phrase(lowered_words: list[str], start_index: int) -> tuple[str, int] | None:
    for phrase_tokens, gloss_word in SEMANTIC_PHRASE_GLOSS_MAP:
        phrase_length = len(phrase_tokens)
        if tuple(lowered_words[start_index : start_index + phrase_length]) == phrase_tokens:
            return gloss_word, phrase_length
    return None


def _build_semantic_gloss_tokens(cleaned_words: list[str], available_glosses: set[str]) -> list[str]:
    lowered_words = [word.lower() for word in cleaned_words]
    gloss_tokens: list[str] = []
    index = 0

    while index < len(lowered_words):
        phrase_match = _match_semantic_phrase(lowered_words, index)
        if phrase_match:
            gloss_word, phrase_length = phrase_match
            if gloss_word in available_glosses and gloss_word not in gloss_tokens:
                gloss_tokens.append(gloss_word)
            index += phrase_length
            continue

        lowered_word = lowered_words[index]
        direct_word = cleaned_words[index].upper()
        mapped_gloss = SEMANTIC_WORD_GLOSS_MAP.get(lowered_word, direct_word if direct_word in available_glosses else None)
        if mapped_gloss in available_glosses and mapped_gloss not in gloss_tokens:
            gloss_tokens.append(mapped_gloss)
        index += 1

    if gloss_tokens:
        return gloss_tokens[:8]
    return [word.upper() for word in cleaned_words[:8]]


def _map_gestures(gloss_tokens: list[str], gesture_library: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    gesture_sequence: list[dict[str, Any]] = []

    for index, word in enumerate(gloss_tokens):
        matched = gesture_library.get(word)
        if matched:
            gesture_sequence.append(
                {
                    "glossWord": word,
                    "animationFile": matched["animationFile"],
                    "description": matched["description"],
                    "fallbackType": matched["fallbackType"],
                    "durationMs": matched.get("animationDuration", matched.get("durationMs", 1400)),
                    "animationDuration": matched.get("animationDuration", matched.get("durationMs", 1400)),
                    "leftHandPose": matched.get("leftHandPose"),
                    "rightHandPose": matched.get("rightHandPose"),
                    "boneRotationValues": matched.get("boneRotationValues"),
                    "sequenceIndex": index,
                }
            )
            continue

        fallback_type = "fingerspelling" if word.isalpha() else "gesture_not_available"
        left_hand_pose, right_hand_pose, bone_rotation_values = _build_fallback_pose(
            word,
            fallback_type,
            index,
        )
        gesture_sequence.append(
            {
                "glossWord": word,
                "animationFile": f"placeholder/{fallback_type}.glb",
                "description": f"Placeholder {fallback_type.replace('_', ' ')} for {word}",
                "fallbackType": fallback_type,
                "durationMs": 1100,
                "animationDuration": 1100,
                "leftHandPose": left_hand_pose,
                "rightHandPose": right_hand_pose,
                "boneRotationValues": bone_rotation_values,
                "sequenceIndex": index,
            }
        )

    if not gesture_sequence:
        left_hand_pose, right_hand_pose, bone_rotation_values = _build_fallback_pose(
            "NO_GLOSS",
            "gesture_not_available",
            0,
        )
        gesture_sequence.append(
            {
                "glossWord": "NO_GLOSS",
                "animationFile": "placeholder/gesture_not_available.glb",
                "description": "No gesture available for the current input.",
                "fallbackType": "gesture_not_available",
                "durationMs": 1000,
                "animationDuration": 1000,
                "leftHandPose": left_hand_pose,
                "rightHandPose": right_hand_pose,
                "boneRotationValues": bone_rotation_values,
                "sequenceIndex": 0,
            }
        )

    return gesture_sequence


async def _load_gesture_library(db: Any) -> dict[str, dict[str, Any]]:
    dataset = _read_json(SIGN_GESTURE_DATASET)
    file_gestures = {
        gesture["glossWord"]: {
            **gesture,
            "subject": dataset.get("subject"),
            "datasetVersion": dataset.get("version"),
            "sortOrder": sort_order,
            "fallbackType": gesture.get("fallbackType", "direct"),
            "animationDuration": gesture.get("animationDuration", gesture.get("durationMs", 1400)),
        }
        for sort_order, gesture in enumerate(dataset.get("gestures", []), start=1)
    }
    gesture_docs = await db[SIGN_GESTURE_DATASET_COLLECTION].find().sort("sortOrder", 1).to_list(length=None)
    db_gestures = {doc["glossWord"]: doc for doc in gesture_docs}
    return {
        **file_gestures,
        **db_gestures,
    }


def _normalize_learned_motion_frames(frames: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Keep ordered, bounded numeric skeletal samples suitable for reuse."""
    normalized: list[dict[str, Any]] = []
    previous_timestamp = -1
    for frame in frames:
        timestamp = int(frame["timestampMs"])
        if timestamp <= previous_timestamp:
            continue
        joints = {}
        for joint_name, values in (frame.get("joints") or {}).items():
            if not isinstance(values, list) or len(values) not in {3, 4}:
                continue
            numeric_values = [round(float(value), 6) for value in values]
            if any(abs(value) > 1000 for value in numeric_values):
                continue
            joints[str(joint_name)[:80]] = numeric_values
        normalized.append({"timestampMs": timestamp, "joints": joints})
        previous_timestamp = timestamp

    if len(normalized) < 2:
        raise ValueError("A learned sign needs at least two ordered motion frames.")

    # Preserve trajectory shape while bounding MongoDB document size.
    if len(normalized) > 180:
        step = (len(normalized) - 1) / 179
        normalized = [normalized[round(index * step)] for index in range(180)]
    return normalized


def _extract_motion_trajectory(frames: list[dict[str, Any]]) -> dict[str, list[list[float]]]:
    tracked_joints = ["leftWrist", "rightWrist", "head", "hips"]
    trajectory = {joint: [] for joint in tracked_joints}
    for frame in frames:
        for joint in tracked_joints:
            values = frame["joints"].get(joint)
            if values and len(values) >= 3:
                trajectory[joint].append([frame["timestampMs"], *values[:3]])
    return {joint: points for joint, points in trajectory.items() if points}


def _serialize_learned_sign_pattern(pattern: dict[str, Any]) -> dict[str, Any]:
    return {
        "word": pattern["word"],
        "teacherId": pattern["teacherId"],
        "meaning": pattern.get("meaning"),
        "category": pattern.get("category", "ICT"),
        "facialExpression": pattern.get("facialExpression", "neutral"),
        "frameCount": pattern.get("frameCount", len(pattern.get("frames", []))),
        "durationMs": pattern.get("durationMs", 0),
        "trajectory": pattern.get("trajectory", {}),
        "version": pattern.get("version", 1),
        "createdAt": pattern.get("createdAt"),
        "updatedAt": pattern.get("updatedAt"),
    }


async def _resolve_topic_name(current_topic: str | None, input_text: str) -> str:
    db = get_db()
    if current_topic:
        return current_topic

    concepts = [doc async for doc in db[KNOWLEDGE_GRAPH_COLLECTION].find()]
    lowered = input_text.lower()
    for concept in concepts:
        if concept["conceptName"].lower() in lowered:
            return concept["conceptName"]
        for keyword in concept.get("keywords", []):
            if keyword.lower() in lowered:
                return concept["conceptName"]
    return "General O/L ICT"


async def _resolve_monitoring_status(student_id: str) -> str:
    db = get_db()
    saved_state = await db[STUDENT_LEARNING_STATES_COLLECTION].find_one({"studentId": student_id})
    if saved_state and saved_state.get("learningState") == "distracted":
        return "Distracted"

    latest_attention = await db[ATTENTION_LOGS_COLLECTION].find_one(
        {"user_id": student_id},
        sort=[("_id", -1)],
    )
    if latest_attention:
        recent_events = latest_attention.get("events", [])[-8:]
        distracted_count = sum(1 for item in recent_events if item.get("status") == "not_attentive")
        if distracted_count >= max(1, len(recent_events) // 2):
            return "Distracted"
    return "Focused"


def _normalize_learning_state(state: str | None) -> str:
    if not state:
        return "understanding"
    lowered = state.lower().replace(" ", "_")
    valid = {"understanding", "not_understanding", "bored", "distracted"}
    return lowered if lowered in valid else "understanding"


def _normalize_notes_text(notes_text: str) -> str:
    normalized = re.sub(r"\s+", " ", notes_text.replace("\r", " ").replace("\n", " ")).strip()
    normalized = re.sub(r"([.!?])\1+", r"\1", normalized)
    return normalized


def _split_notes_into_sentences(notes_text: str) -> list[str]:
    raw_sentences = re.split(r"(?<=[.!?])\s+", notes_text)
    deduped: list[str] = []
    seen: set[str] = set()
    for sentence in raw_sentences:
        cleaned = sentence.strip(" .")
        if not cleaned:
            continue
        normalized_key = cleaned.lower()
        if normalized_key in seen:
            continue
        seen.add(normalized_key)
        deduped.append(_ensure_sentence(cleaned))
    return deduped


def _generate_lecture_script(
    topic: str,
    note_sentences: list[str],
    difficulty_level: str,
    key_words: list[str],
) -> list[str]:
    script_lines = [f"Today we are learning about {topic}."]

    for sentence in note_sentences:
        script_lines.extend(_expand_sentence_for_teaching(sentence))

    if key_words:
        summary_points = ", ".join(key_words[:4])
        script_lines.append(f"Key idea: remember {summary_points}.")

    if difficulty_level.lower() in {"beginner", "easy"}:
        script_lines.append(f"In simple words, {topic} is an important idea in ICT.")

    script_lines.append(f"That is the quick summary of {topic}.")

    compact_lines: list[str] = []
    seen: set[str] = set()
    for line in script_lines:
        cleaned = _ensure_sentence(line)
        lowered = cleaned.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        compact_lines.append(cleaned)

    return compact_lines[:10]


def _expand_sentence_for_teaching(sentence: str) -> list[str]:
    base = sentence.strip(" .")
    if not base:
        return []

    clauses = [item.strip(" .") for item in re.split(r",|;|\band\b", base, flags=re.IGNORECASE) if item.strip(" .")]
    if len(clauses) <= 1:
        return [_ensure_sentence(base)]

    expanded: list[str] = []
    first_clause = clauses[0]
    expanded.append(_ensure_sentence(first_clause))

    for clause in clauses[1:]:
        words = clause.split()
        if not words:
            continue
        first_word = words[0].lower()
        if first_word in SEGMENT_ACTION_WORDS:
            clause = f"It {clause}"
        expanded.append(_ensure_sentence(clause))

    return expanded


async def _extract_ict_keywords(text: str, topic: str) -> list[str]:
    db = get_db()
    cleaned_words = _clean_input_text(text, "English")
    gesture_library = await _load_gesture_library(db)
    candidate_words = _build_semantic_gloss_tokens(cleaned_words, set(gesture_library))
    keywords: list[str] = []

    for word in candidate_words:
        if word in gesture_library and word not in keywords:
            keywords.append(word.title())

    if topic and topic.title() not in keywords:
        keywords.insert(0, topic.title())

    return keywords[:5]


async def _extract_sign_keywords_and_text(
    lesson_text: str,
    topic: str,
    selected_language: str,
) -> dict[str, Any]:
    llm_result = await _try_llm_keyword_extraction(lesson_text, topic)
    if llm_result:
        keywords = _normalize_sign_keywords(llm_result.get("keywords", []))
        simplified_text = _normalize_sequence_text(llm_result.get("simplifiedText") or lesson_text)
        if keywords:
            return {
                "keywords": keywords,
                "simplifiedText": simplified_text,
                "sourceType": "LLM_KEYWORD_EXTRACTION",
                "llmAssisted": True,
            }

    local_keywords = _local_extract_sign_keywords(lesson_text, topic, selected_language)
    return {
        "keywords": local_keywords,
        "simplifiedText": _local_simplify_text(lesson_text, local_keywords),
        "sourceType": "LOCAL_KEYWORD_MATCHER",
        "llmAssisted": False,
    }


def _local_extract_sign_keywords(lesson_text: str, topic: str, selected_language: str) -> list[str]:
    normalized_words = _clean_input_text(lesson_text, selected_language)
    lowered_words = [_normalize_keyword_token(word) for word in normalized_words]
    dictionary_lookup = _get_sign_dictionary_lookup()
    matched_keywords: list[str] = []

    if topic:
        topic_key = _normalize_keyword_token(topic)
        if topic_key in dictionary_lookup:
            matched_keywords.append(topic_key)

    for index, lowered_word in enumerate(lowered_words):
        if lowered_word in dictionary_lookup and lowered_word not in matched_keywords:
            matched_keywords.append(lowered_word)
            continue

        if index < len(lowered_words) - 1:
            phrase = f"{lowered_word} {lowered_words[index + 1]}"
            if phrase in dictionary_lookup and phrase not in matched_keywords:
                matched_keywords.append(phrase)

    if matched_keywords:
        return matched_keywords[:10]

    semantic_keywords = []
    for gloss_word in _build_semantic_gloss_tokens(normalized_words, {item["glossWord"] for item in ICT_SIGN_DICTIONARY}):
        for entry in ICT_SIGN_DICTIONARY:
            if entry["glossWord"] == gloss_word and entry["keyword"] not in semantic_keywords:
                semantic_keywords.append(entry["keyword"])
    if semantic_keywords:
        return semantic_keywords[:10]

    return [entry["keyword"] for entry in ICT_SIGN_DICTIONARY[:5]]


def _local_simplify_text(lesson_text: str, keywords: list[str]) -> str:
    sentences = _split_notes_into_sentences(_normalize_notes_text(lesson_text))
    if not sentences:
        if not keywords:
            return "Ready to sign the lesson keywords."
        return " ".join([f"{keyword.title()} is important in ICT." for keyword in keywords[:3]])

    simple_sentences = []
    for sentence in sentences[:3]:
        simple_sentences.append(_ensure_sentence(re.sub(r"\b(which|that|because|therefore|however)\b", "", sentence, flags=re.IGNORECASE)))
    if keywords:
        simple_sentences.append(_ensure_sentence(f"Key words: {', '.join(keyword.title() for keyword in keywords[:4])}"))
    return " ".join(simple_sentences[:4])


def _build_avatar_animation_sequence(
    keywords: list[str],
    gesture_library: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    dictionary_lookup = _get_sign_dictionary_lookup()
    sequence = []
    for keyword in keywords:
        entry = dictionary_lookup.get(_normalize_keyword_token(keyword))
        if not entry:
            continue
        source_gloss = entry.get("glossWord")
        has_direct_sign = bool(source_gloss and gesture_library.get(source_gloss))
        sequence.append(
            {
                "keyword": entry["keyword"],
                "animationName": entry["animationName"],
                "subtitle": entry["subtitleText"],
                "duration": entry.get("duration", 1.8),
                "fallbackGesture": entry["fallbackGesture"],
                "sourceGloss": source_gloss,
                "isFallback": not has_direct_sign,
            }
        )

    if sequence:
        return sequence

    default_entry = ICT_SIGN_DICTIONARY[0]
    return [
        {
            "keyword": default_entry["keyword"],
            "animationName": default_entry["animationName"],
            "subtitle": default_entry["subtitleText"],
            "duration": default_entry.get("duration", 1.8),
            "fallbackGesture": default_entry["fallbackGesture"],
            "sourceGloss": default_entry.get("glossWord"),
            "isFallback": False,
        }
    ]


def _build_subtitle_segments(sequence: list[dict[str, Any]]) -> list[dict[str, Any]]:
    start_ms = 0
    subtitles = []
    for item in sequence:
        duration_ms = int(float(item.get("duration", 1.8)) * 1000)
        subtitles.append(
            {
                "keyword": item["keyword"],
                "subtitle": item["subtitle"],
                "startMs": start_ms,
                "endMs": start_ms + duration_ms,
            }
        )
        start_ms += duration_ms
    return subtitles


def _get_sign_dictionary_lookup() -> dict[str, dict[str, Any]]:
    return {entry["keyword"]: entry for entry in ICT_SIGN_DICTIONARY}


def _normalize_keyword_token(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9\s]", " ", str(value).lower())
    normalized = re.sub(r"\s+", " ", normalized).strip()
    singular_map = {
        "databases": "database",
        "networks": "network",
        "devices": "device",
        "programs": "program",
        "files": "file",
        "folders": "folder",
        "websites": "website",
    }
    return singular_map.get(normalized, normalized)


def _normalize_sign_keywords(values: list[str]) -> list[str]:
    dictionary_lookup = _get_sign_dictionary_lookup()
    keywords = []
    for value in values:
        normalized = _normalize_keyword_token(value)
        if normalized in dictionary_lookup and normalized not in keywords:
            keywords.append(normalized)
    return keywords[:10]


def _normalize_sequence_text(value: str) -> str:
    return _normalize_notes_text(value) if value else ""


async def _try_llm_keyword_extraction(lesson_text: str, topic: str) -> dict[str, Any] | None:
    provider = str(settings.LLM_PROVIDER or "").strip().lower()
    api_key = str(settings.LLM_API_KEY or "").strip()
    model = str(settings.LLM_MODEL or "").strip()
    timeout_ms = max(1000, int(settings.LLM_TIMEOUT_MS or 10000))
    if not provider or not api_key or not model:
        return None

    request_payload = _build_llm_sequence_request(provider, api_key, model, lesson_text, topic)
    if not request_payload:
        return None

    try:
        payload = await asyncio.to_thread(
            _post_llm_json_request,
            request_payload["url"],
            request_payload["headers"],
            request_payload["body"],
            timeout_ms,
        )
        text = _extract_llm_text(provider, payload)
        parsed = _parse_llm_keyword_payload(text)
        return parsed
    except Exception as exc:
        LOGGER.warning("Sign avatar keyword extraction fell back to local matching: %s", exc)
        return None


def _build_llm_sequence_request(
    provider: str,
    api_key: str,
    model: str,
    lesson_text: str,
    topic: str,
) -> dict[str, Any] | None:
    prompt = (
        "Extract only ICT teaching keywords that map cleanly to sign animations. "
        "Return valid JSON with keys keywords and simplifiedText. "
        "keywords must be a short array of lowercase ICT words. "
        "simplifiedText must be brief sign-friendly phrases. "
        f"Topic: {topic or 'General O/L ICT'}. "
        f"Lesson text: {lesson_text}"
    )

    if provider == "openai":
        return {
            "url": "https://api.openai.com/v1/responses",
            "headers": {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            "body": {
                "model": model,
                "input": prompt,
                "temperature": 0.2,
                "max_output_tokens": 220,
            },
        }
    if provider == "openrouter":
        return {
            "url": "https://openrouter.ai/api/v1/chat/completions",
            "headers": {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            "body": {
                "model": model,
                "temperature": 0.2,
                "messages": [{"role": "user", "content": prompt}],
            },
        }
    if provider == "gemini":
        return {
            "url": f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
            "headers": {"Content-Type": "application/json"},
            "body": {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.2, "maxOutputTokens": 220},
            },
        }
    return None


def _post_llm_json_request(
    url: str,
    headers: dict[str, str],
    body: dict[str, Any],
    timeout_ms: int,
) -> dict[str, Any]:
    request = urllib_request.Request(
        url=url,
        data=json.dumps(body).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urllib_request.urlopen(request, timeout=timeout_ms / 1000) as response:
        return json.loads(response.read().decode("utf-8"))


def _extract_llm_text(provider: str, payload: dict[str, Any]) -> str:
    if provider == "openai":
        if payload.get("output_text"):
            return str(payload["output_text"])
        for item in payload.get("output", []):
            for content in item.get("content", []):
                if content.get("text"):
                    return str(content["text"])
        return ""
    if provider == "openrouter":
        choices = payload.get("choices", [])
        return str((((choices[0] if choices else {}).get("message") or {}).get("content")) or "")
    if provider == "gemini":
        candidates = payload.get("candidates", [])
        for candidate in candidates:
            for part in candidate.get("content", {}).get("parts", []):
                if part.get("text"):
                    return str(part["text"])
    return ""


def _parse_llm_keyword_payload(text: str) -> dict[str, Any] | None:
    if not text.strip():
        return None
    json_match = re.search(r"\{.*\}", text, flags=re.DOTALL)
    candidate = json_match.group(0) if json_match else text
    try:
        parsed = json.loads(candidate)
    except json.JSONDecodeError:
        return None
    return {
        "keywords": parsed.get("keywords", []),
        "simplifiedText": parsed.get("simplifiedText", ""),
    }


def _estimate_segment_duration(gesture_sequence: list[dict[str, Any]], text: str) -> int:
    gesture_duration = sum(item.get("animationDuration", item.get("durationMs", 1200)) for item in gesture_sequence)
    reading_buffer = min(2200, max(700, len(text) * 18))
    return gesture_duration + reading_buffer


def _build_segment_warning(gesture_sequence: list[dict[str, Any]]) -> str | None:
    fallback_words = [item["glossWord"] for item in gesture_sequence if item.get("fallbackType") != "direct"]
    if not fallback_words:
        return None
    return f"Gesture not available for {', '.join(fallback_words[:3])}. Using spelling fallback."


def _ensure_sentence(text: str) -> str:
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return ""
    if cleaned[-1] not in ".!?":
        cleaned = f"{cleaned}."
    return cleaned[0].upper() + cleaned[1:]


def _serialize_generate_response(doc: dict[str, Any], replay_suggestion: str | None) -> dict[str, Any]:
    return {
        "studentId": doc["studentId"],
        "inputText": doc["inputText"],
        "cleanedWords": doc["cleanedWords"],
        "generatedGloss": doc["generatedGloss"],
        "gestureSequence": _serialize_gesture_sequence(doc["gestureSequence"]),
        "learningState": doc["learningState"],
        "topic": doc["topic"],
        "monitoringStatus": doc["monitoringStatus"],
        "replaySuggestion": replay_suggestion,
        "createdAt": doc["createdAt"],
    }


def _serialize_sign_lecture(lecture_doc: dict[str, Any], segments: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "lectureId": lecture_doc["lectureId"],
        "teacherId": lecture_doc["teacherId"],
        "lessonTitle": lecture_doc["lessonTitle"],
        "subject": lecture_doc["subject"],
        "topic": lecture_doc["topic"],
        "language": lecture_doc["language"],
        "difficultyLevel": lecture_doc.get("difficultyLevel", "beginner"),
        "notesText": lecture_doc["notesText"],
        "generatedScript": lecture_doc.get("generatedScript", []),
        "segments": [
            {
                "segmentId": segment["segmentId"],
                "originalText": segment["originalText"],
                "simplifiedScript": segment["simplifiedScript"],
                "generatedGloss": segment["generatedGloss"],
                "gestureSequence": _serialize_gesture_sequence(segment["gestureSequence"]),
                "estimatedDuration": segment["estimatedDuration"],
                "keyWords": segment.get("keyWords", []),
                "orderIndex": segment["orderIndex"],
                "warning": segment.get("warning"),
            }
            for segment in segments
        ],
        "status": lecture_doc.get("status", "draft"),
        "warnings": lecture_doc.get("warnings", []),
        "createdAt": lecture_doc["createdAt"],
        "updatedAt": lecture_doc["updatedAt"],
    }


def _serialize_history(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "studentId": doc["studentId"],
        "inputText": doc["inputText"],
        "generatedGloss": doc["generatedGloss"],
        "gestureSequence": _serialize_gesture_sequence(doc["gestureSequence"]),
        "learningState": doc["learningState"],
        "topic": doc["topic"],
        "selectedLanguage": doc["selectedLanguage"],
        "createdAt": doc["createdAt"],
    }


def _serialize_missed_segment(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "studentId": doc["studentId"],
        "sessionId": doc.get("sessionId"),
        "glossWord": doc["glossWord"],
        "sequenceIndex": doc["sequenceIndex"],
        "timeSeconds": doc["timeSeconds"],
        "learningState": doc.get("learningState"),
        "topic": doc.get("topic"),
        "createdAt": doc["createdAt"],
    }


def _serialize_gesture_sequence(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "glossWord": item["glossWord"],
            "animationFile": item["animationFile"],
            "description": item["description"],
            "fallbackType": item["fallbackType"],
            "durationMs": item.get("durationMs", 1400),
            "animationDuration": item.get("animationDuration", item.get("durationMs", 1400)),
            "leftHandPose": item.get("leftHandPose"),
            "rightHandPose": item.get("rightHandPose"),
            "boneRotationValues": item.get("boneRotationValues"),
        }
        for item in items
    ]


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _build_fallback_pose(word: str, fallback_type: str, sequence_index: int) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    letter_bias = len(word) % 5
    position_shift = min(18, sequence_index * 4)
    right_index_curl = 0.12 if fallback_type == "fingerspelling" else 0.2
    right_middle_curl = 0.84 if fallback_type == "fingerspelling" else 0.22
    right_ring_curl = 0.9 if fallback_type == "fingerspelling" else 0.24
    right_pinky_curl = 0.92 if fallback_type == "fingerspelling" else 0.28

    left_hand_pose = {
        "position": {"x": 340 - position_shift, "y": 304, "z": 0},
        "scale": 1,
        "wristAngle": -10,
        "palmAngle": -6,
        "fingerSpread": 1,
        "thumbSpread": 26,
        "fingerCurls": {
            "thumb": 0.3,
            "index": 0.24,
            "middle": 0.26,
            "ring": 0.28,
            "pinky": 0.32,
        },
    }
    right_hand_pose = {
        "position": {"x": 560 + position_shift, "y": 302 - letter_bias * 2, "z": 0},
        "scale": 1,
        "wristAngle": 10,
        "palmAngle": 8 if fallback_type == "fingerspelling" else 4,
        "fingerSpread": 1,
        "thumbSpread": 24,
        "fingerCurls": {
            "thumb": 0.2,
            "index": right_index_curl,
            "middle": right_middle_curl,
            "ring": right_ring_curl,
            "pinky": right_pinky_curl,
        },
    }
    bone_rotation_values = {
        "left": {
            "wrist": left_hand_pose["wristAngle"],
            "thumb": left_hand_pose["fingerCurls"]["thumb"],
            "index": left_hand_pose["fingerCurls"]["index"],
            "middle": left_hand_pose["fingerCurls"]["middle"],
            "ring": left_hand_pose["fingerCurls"]["ring"],
            "pinky": left_hand_pose["fingerCurls"]["pinky"],
        },
        "right": {
            "wrist": right_hand_pose["wristAngle"],
            "thumb": right_hand_pose["fingerCurls"]["thumb"],
            "index": right_hand_pose["fingerCurls"]["index"],
            "middle": right_hand_pose["fingerCurls"]["middle"],
            "ring": right_hand_pose["fingerCurls"]["ring"],
            "pinky": right_hand_pose["fingerCurls"]["pinky"],
        },
    }
    return left_hand_pose, right_hand_pose, bone_rotation_values
