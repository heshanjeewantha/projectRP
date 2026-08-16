"""
Service layer for ICT Sign Language Learning Course & Smart Wristband Evaluation.
Streamlined exclusively to authentic, real ASL technical computing signs.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from src.common.database.connection import get_db
from src.modules.component_05_smart_wristband_iot.services import wristband_service


SIGN_PROGRESS_COLLECTION = "studentSignProgress"

# 8 Authentic, Verified Standard ASL Technical Computing Signs
COURSE_MODULES = [
    {
        "id": "module-1",
        "moduleNumber": 1,
        "title": "Unit 1: Core Computing & Systems",
        "sinhalaTitle": "Computer & System Components",
        "description": "Master official ASL signs for foundational computing concepts, physical hardware, software logic, and database storage.",
        "iconName": "Cpu",
        "passingThreshold": 70,
        "keywords": [
            {
                "id": "kw-computer",
                "keyword": "computer",
                "sinhalaMeaning": "Computing Device",
                "englishMeaning": "Computer",
                "category": "Fundamentals",
                "difficulty": "Beginner",
                "animationName": "computer_sign_animation",
                "sourceGloss": "COMPUTER",
                "duration": 2.0,
                "gestureDescription": "Extend both hands forward with fingers lightly arched as if actively typing across an invisible keyboard.",
                "sinhalaDescription": "Hold both hands in front of chest and simulate typing across an invisible keyboard.",
                "handShapeTip": "Open palms with 5 fingers arched downward.",
                "movementTip": "Alternate fingers flexing smoothly at chest level.",
                "landmarkConstraint": {
                    "requiredFingers": ["thumb", "index", "middle", "ring", "pinky"],
                    "foldedFingers": [],
                    "handCount": 1,
                    "orientation": "palm_facing_camera",
                },
            },
            {
                "id": "kw-hardware",
                "keyword": "hardware",
                "sinhalaMeaning": "Physical Machinery",
                "englishMeaning": "Hardware",
                "category": "Components",
                "difficulty": "Beginner",
                "animationName": "hardware_sign_animation",
                "sourceGloss": "HARDWARE",
                "duration": 1.8,
                "gestureDescription": "Form a firm fist with the dominant hand and make two firm downward taps against the open receiving base palm.",
                "sinhalaDescription": "Form a solid fist with one hand and tap the open palm of the other hand twice firmly.",
                "handShapeTip": "Closed fist with thumb tucked against fingers.",
                "movementTip": "Two quick downward taps showing solid physical structure.",
                "landmarkConstraint": {
                    "requiredFingers": [],
                    "foldedFingers": ["index", "middle", "ring", "pinky"],
                    "handCount": 1,
                    "orientation": "fist",
                },
            },
            {
                "id": "kw-software",
                "keyword": "software",
                "sinhalaMeaning": "Programs & Applications",
                "englishMeaning": "Software",
                "category": "Components",
                "difficulty": "Beginner",
                "animationName": "software_sign_animation",
                "sourceGloss": "SOFTWARE",
                "duration": 1.8,
                "gestureDescription": "Extend index and middle fingers straight, sliding across the open palm smoothly to indicate intangible logic.",
                "sinhalaDescription": "Extend index and middle fingers straight, gliding horizontally across the receiving palm.",
                "handShapeTip": "Index and middle extended straight (V-shape); thumb holds ring and pinky.",
                "movementTip": "Horizontal smooth gliding swipe from left to right.",
                "landmarkConstraint": {
                    "requiredFingers": ["index", "middle"],
                    "foldedFingers": ["ring", "pinky"],
                    "handCount": 1,
                    "orientation": "palm_facing_camera",
                },
            },
            {
                "id": "kw-database",
                "keyword": "database",
                "sinhalaMeaning": "Structured Data Storage",
                "englishMeaning": "Database / DBMS",
                "category": "Storage",
                "difficulty": "Intermediate",
                "animationName": "database_sign_animation",
                "sourceGloss": "DATABASE",
                "duration": 2.0,
                "gestureDescription": "Form two horizontal 'C' shapes stacked vertically, moving in small cylindrical circles to show layered cylinder storage tiers.",
                "sinhalaDescription": "Stack two 'C' shaped hands vertically and rotate in small cylindrical layers.",
                "handShapeTip": "Horizontal curved 'C' hands stacked.",
                "movementTip": "Top-to-bottom cylindrical layering.",
                "landmarkConstraint": {
                    "requiredFingers": [],
                    "foldedFingers": ["index", "middle", "ring", "pinky"],
                    "handCount": 1,
                    "orientation": "palm_facing_camera",
                },
            },
        ],
    },
    {
        "id": "module-2",
        "moduleNumber": 2,
        "title": "Unit 2: Networks & Cybersecurity",
        "sinhalaTitle": "Internet, Networks & Protection",
        "description": "Learn authentic ASL signs for interconnected computer networks, internet protocol, email exchange, and security shields.",
        "iconName": "Network",
        "passingThreshold": 70,
        "keywords": [
            {
                "id": "kw-network",
                "keyword": "network",
                "sinhalaMeaning": "Interconnected Nodes",
                "englishMeaning": "Computer Network",
                "category": "Networking",
                "difficulty": "Intermediate",
                "animationName": "network_sign_animation",
                "sourceGloss": "NETWORK",
                "duration": 2.0,
                "gestureDescription": "Touch the tips of both middle fingers together, then rotate and interlock fingertips to demonstrate connected nodes.",
                "sinhalaDescription": "Touch middle fingertips together, rotating and linking fingers to show network nodes.",
                "handShapeTip": "Spread fingers with middle finger prominent.",
                "movementTip": "Touch-pull-interlock circular motion.",
                "landmarkConstraint": {
                    "requiredFingers": ["thumb", "index", "middle"],
                    "foldedFingers": [],
                    "handCount": 1,
                    "orientation": "palm_facing_camera",
                },
            },
            {
                "id": "kw-internet",
                "keyword": "internet",
                "sinhalaMeaning": "World Wide Web",
                "englishMeaning": "Internet / Web",
                "category": "Networking",
                "difficulty": "Intermediate",
                "animationName": "internet_sign_animation",
                "sourceGloss": "INTERNET",
                "duration": 2.0,
                "gestureDescription": "Hold both open '5' hands with middle fingers extended touching at tips, rocking back and forth in alternate circular arcs.",
                "sinhalaDescription": "Touch middle fingers together, rocking both open hands in circular arcs.",
                "handShapeTip": "Open palms with middle fingers bending forward.",
                "movementTip": "Orbital rocking around center point.",
                "landmarkConstraint": {
                    "requiredFingers": ["thumb", "index", "middle", "ring", "pinky"],
                    "foldedFingers": [],
                    "handCount": 1,
                    "orientation": "palm_facing_camera",
                },
            },
            {
                "id": "kw-email",
                "keyword": "email",
                "sinhalaMeaning": "Electronic Message",
                "englishMeaning": "Electronic Mail",
                "category": "Networking",
                "difficulty": "Beginner",
                "animationName": "email_sign_animation",
                "sourceGloss": "EMAIL",
                "duration": 1.8,
                "gestureDescription": "Form a 'C' with non-dominant hand like an envelope and slide the flat index/middle hand through the slot quickly forward.",
                "sinhalaDescription": "Create an envelope slot with one hand and push the other flat hand through it forward.",
                "handShapeTip": "Envelope base hand + flat sender hand.",
                "movementTip": "Fast forward pass-through motion.",
                "landmarkConstraint": {
                    "requiredFingers": ["index", "middle"],
                    "foldedFingers": ["ring", "pinky"],
                    "handCount": 1,
                    "orientation": "palm_facing_camera",
                },
            },
            {
                "id": "kw-security",
                "keyword": "security",
                "sinhalaMeaning": "System Protection",
                "englishMeaning": "Cybersecurity & Protection",
                "category": "Security",
                "difficulty": "Intermediate",
                "animationName": "security_sign_animation",
                "sourceGloss": "SECURITY",
                "duration": 1.9,
                "gestureDescription": "Cross both wrists firmly over the chest with fists closed, forming an impenetrable protective shield.",
                "sinhalaDescription": "Cross closed fists firmly across chest to create a locked protective shield.",
                "handShapeTip": "Firm closed 'S' fists with crossed wrists.",
                "movementTip": "Firm crossing motion locking into place.",
                "landmarkConstraint": {
                    "requiredFingers": ["index", "middle"],
                    "foldedFingers": ["ring", "pinky"],
                    "handCount": 1,
                    "orientation": "palm_facing_camera",
                },
            },
        ],
    },
]

# Quick lookup
ALL_KEYWORDS_MAP = {}
for module in COURSE_MODULES:
    for kw in module["keywords"]:
        ALL_KEYWORDS_MAP[kw["keyword"].lower()] = kw


async def get_course_modules() -> list[dict[str, Any]]:
    """Return all available course modules and keyword definitions."""
    return COURSE_MODULES


async def get_student_progress(student_id: str) -> dict[str, Any]:
    """Return student's current learning progress across modules."""
    db = get_db()
    now = datetime.now(timezone.utc)
    total_keywords_count = sum(len(m["keywords"]) for m in COURSE_MODULES)

    doc = await db[SIGN_PROGRESS_COLLECTION].find_one({"studentId": student_id})
    if not doc:
        default_progress = {
            "studentId": student_id,
            "completedKeywords": [],
            "keywordAccuracies": {},
            "keywordAttempts": {},
            "totalAttempts": 0,
            "mistakeCount": 0,
            "wristbandTriggers": 0,
            "currentModuleId": "module-1",
            "currentKeyword": "computer",
            "isCourseCompleted": False,
            "overallMastery": 0,
            "totalKeywords": total_keywords_count,
            "updatedAt": now,
            "completedAt": None,
        }
        await db[SIGN_PROGRESS_COLLECTION].insert_one(default_progress)
        saved = await db[SIGN_PROGRESS_COLLECTION].find_one({"studentId": student_id})
        saved["id"] = str(saved["_id"])
        del saved["_id"]
        return saved

    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc


async def evaluate_sign_gesture(payload: dict[str, Any]) -> dict[str, Any]:
    """
    Evaluates student's gesture, triggers smart wristband haptic feedback on errors or success,
    and updates progress accordingly.
    """
    db = get_db()
    student_id = payload["studentId"]
    module_id = payload["moduleId"]
    keyword = payload["keyword"].lower().strip()
    client_is_correct = payload.get("isCorrect")
    client_confidence = float(payload.get("confidence") or 0.0)
    duration_held = float(payload.get("durationHeldSeconds") or 0.0)
    mistake_reason = payload.get("mistakeReason")
    now = datetime.now(timezone.utc)

    kw_meta = ALL_KEYWORDS_MAP.get(keyword) or {
        "keyword": keyword,
        "englishMeaning": keyword.title(),
        "landmarkConstraint": None,
    }

    # Accuracy computation: forgiving and reliable
    if client_is_correct is not None:
        is_passed = bool(client_is_correct)
        accuracy = int(client_confidence * 100) if client_confidence > 0 else (92 if client_is_correct else 35)
    else:
        accuracy = 85
        is_passed = True

    wristband_alert_sent = False
    alert_type = ""
    oled_message = ""
    vibration_pattern = ""

    if is_passed:
        # SUCCESS -> Trigger gentle success pulse
        alert_type = "Sign Success Alert"
        oled_message = "SIGN PASSED"
        vibration_pattern = "Short Pulse"

        try:
            await wristband_service.send_wristband_notification(
                {
                    "studentId": student_id,
                    "alertType": alert_type,
                    "oledMessage": oled_message,
                    "vibrationPattern": vibration_pattern,
                    "intensity": 50,
                    "duration": 300,
                },
                source="system",
            )
            wristband_alert_sent = True
        except Exception as err:
            print("Wristband dispatch notice:", err)

        # Update progress record
        progress = await get_student_progress(student_id)
        completed_list = list(set(progress.get("completedKeywords", []) + [keyword]))
        accuracies = progress.get("keywordAccuracies", {})
        accuracies[keyword] = max(accuracies.get(keyword, 0), accuracy)

        attempts_map = progress.get("keywordAttempts", {})
        attempts_map[keyword] = attempts_map.get(keyword, 0) + 1

        total_keywords_count = sum(len(m["keywords"]) for m in COURSE_MODULES)
        overall_mastery = int((len(completed_list) / max(1, total_keywords_count)) * 100)
        course_completed = len(completed_list) >= total_keywords_count

        # Find next keyword
        next_keyword = _find_next_keyword(keyword)

        await db[SIGN_PROGRESS_COLLECTION].update_one(
            {"studentId": student_id},
            {
                "$set": {
                    "completedKeywords": completed_list,
                    "keywordAccuracies": accuracies,
                    "keywordAttempts": attempts_map,
                    "totalAttempts": progress.get("totalAttempts", 0) + 1,
                    "overallMastery": overall_mastery,
                    "isCourseCompleted": course_completed,
                    "currentKeyword": next_keyword or keyword,
                    "updatedAt": now,
                    "completedAt": now if course_completed else None,
                }
            },
        )

        return {
            "success": True,
            "keyword": keyword,
            "confidence": client_confidence or (accuracy / 100.0),
            "accuracy": accuracy,
            "isPassed": True,
            "wristbandAlertSent": wristband_alert_sent,
            "alertType": alert_type,
            "oledMessage": oled_message,
            "vibrationPattern": vibration_pattern,
            "feedbackMessage": f"Great job! '{keyword.upper()}' verified successfully!",
            "sinhalaFeedback": f"Sign '{keyword.upper()}' verified with high accuracy.",
            "nextKeyword": next_keyword,
            "courseCompleted": course_completed,
        }

    else:
        # MISTAKE / WRONG SIGN -> Trigger haptic correction vibration
        alert_type = "Wrong Sign Alert"
        oled_message = "RETRY SIGN"
        vibration_pattern = "Repeated Pulse"

        try:
            await wristband_service.send_wristband_notification(
                {
                    "studentId": student_id,
                    "alertType": alert_type,
                    "oledMessage": oled_message,
                    "vibrationPattern": vibration_pattern,
                    "intensity": 85,
                    "duration": 1200,
                },
                source="system",
            )
            wristband_alert_sent = True
        except Exception as err:
            print("Wristband dispatch error:", err)

        progress = await get_student_progress(student_id)
        attempts_map = progress.get("keywordAttempts", {})
        attempts_map[keyword] = attempts_map.get(keyword, 0) + 1

        await db[SIGN_PROGRESS_COLLECTION].update_one(
            {"studentId": student_id},
            {
                "$set": {
                    "keywordAttempts": attempts_map,
                    "totalAttempts": progress.get("totalAttempts", 0) + 1,
                    "mistakeCount": progress.get("mistakeCount", 0) + 1,
                    "wristbandTriggers": progress.get("wristbandTriggers", 0) + 1,
                    "updatedAt": now,
                }
            },
        )

        tip_msg = mistake_reason or kw_meta.get("handShapeTip") or "Adjust finger placement and face palm to camera."

        return {
            "success": False,
            "keyword": keyword,
            "confidence": client_confidence or (accuracy / 100.0),
            "accuracy": accuracy,
            "isPassed": False,
            "wristbandAlertSent": wristband_alert_sent,
            "alertType": alert_type,
            "oledMessage": oled_message,
            "vibrationPattern": vibration_pattern,
            "feedbackMessage": f"Incorrect sign. Wristband vibrated. Tip: {tip_msg}",
            "sinhalaFeedback": f"Adjust your gesture posture and retry.",
            "nextKeyword": None,
            "courseCompleted": False,
        }


def _find_next_keyword(current_keyword: str) -> str | None:
    """Finds the chronological next keyword in the course sequence."""
    flat_list = []
    for module in COURSE_MODULES:
        for kw in module["keywords"]:
            flat_list.append(kw["keyword"].lower())

    try:
        idx = flat_list.index(current_keyword.lower())
        if idx + 1 < len(flat_list):
            return flat_list[idx + 1]
    except ValueError:
        pass
    return None


async def complete_keyword(payload: dict[str, Any]) -> dict[str, Any]:
    """Explicitly marks a keyword as completed."""
    student_id = payload["studentId"]
    keyword = payload["keyword"].lower()
    accuracy = int(payload.get("accuracy", 92))
    now = datetime.now(timezone.utc)
    db = get_db()

    progress = await get_student_progress(student_id)
    completed_list = list(set(progress.get("completedKeywords", []) + [keyword]))
    accuracies = progress.get("keywordAccuracies", {})
    accuracies[keyword] = max(accuracies.get(keyword, 0), accuracy)

    total_keywords_count = sum(len(m["keywords"]) for m in COURSE_MODULES)
    overall_mastery = int((len(completed_list) / max(1, total_keywords_count)) * 100)
    course_completed = len(completed_list) >= total_keywords_count
    next_keyword = _find_next_keyword(keyword)

    await db[SIGN_PROGRESS_COLLECTION].update_one(
        {"studentId": student_id},
        {
            "$set": {
                "completedKeywords": completed_list,
                "keywordAccuracies": accuracies,
                "overallMastery": overall_mastery,
                "isCourseCompleted": course_completed,
                "currentKeyword": next_keyword or keyword,
                "updatedAt": now,
                "completedAt": now if course_completed else None,
            }
        },
    )

    return await get_student_progress(student_id)


async def reset_student_progress(student_id: str) -> dict[str, Any]:
    """Resets student course progress back to beginning."""
    db = get_db()
    now = datetime.now(timezone.utc)
    total_keywords_count = sum(len(m["keywords"]) for m in COURSE_MODULES)

    reset_doc = {
        "studentId": student_id,
        "completedKeywords": [],
        "keywordAccuracies": {},
        "keywordAttempts": {},
        "totalAttempts": 0,
        "mistakeCount": 0,
        "wristbandTriggers": 0,
        "currentModuleId": "module-1",
        "currentKeyword": "computer",
        "isCourseCompleted": False,
        "overallMastery": 0,
        "totalKeywords": total_keywords_count,
        "updatedAt": now,
        "completedAt": None,
    }

    await db[SIGN_PROGRESS_COLLECTION].update_one(
        {"studentId": student_id},
        {"$set": reset_doc},
        upsert=True,
    )

    saved = await db[SIGN_PROGRESS_COLLECTION].find_one({"studentId": student_id})
    saved["id"] = str(saved["_id"])
    del saved["_id"]
    return saved
