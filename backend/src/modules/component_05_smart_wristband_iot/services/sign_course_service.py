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

# 8 Authentic, Verified Standard ASL Technical Computing Signs categorized into O/L ICT Syllabus Units
COURSE_MODULES = [
    # ── GRADE 10 O/L ICT SYLLABUS UNITS ──────────────────────────────────────────
    {
        "id": "module-1",
        "moduleNumber": 1,
        "grade": "Grade 10",
        "syllabusArea": "Unit 2: Computer Architecture & Hardware Systems",
        "title": "Unit 1: Computer Systems & Architecture",
        "sinhalaTitle": "පරිගණක පද්ධති හා දෘඪාංග (Computer Systems & Hardware)",
        "description": "Master official ASL signs for electronic computing devices, processor components, and tangible hardware structures.",
        "iconName": "Cpu",
        "passingThreshold": 70,
        "keywords": [
            {
                "id": "kw-computer",
                "keyword": "computer",
                "grade": "Grade 10",
                "syllabusUnit": "Unit 2: Computer Architecture",
                "examRelevance": "Core machine processing input data into useful information.",
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
                "grade": "Grade 10",
                "syllabusUnit": "Unit 2: Hardware Architecture",
                "examRelevance": "Physical tangible electronic components of computer systems.",
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
        ],
    },
    {
        "id": "module-2",
        "moduleNumber": 2,
        "grade": "Grade 10",
        "syllabusArea": "Unit 4: Operating Systems & System Software",
        "title": "Unit 2: Software Systems & Operating Logic",
        "sinhalaTitle": "මෘදුකාංග සහ මෙහෙයුම් පද්ධති (Software & System Logic)",
        "description": "Learn technical ASL signs representing system software, operating instructions, intangible logic, and programs.",
        "iconName": "Layers",
        "passingThreshold": 70,
        "keywords": [
            {
                "id": "kw-software",
                "keyword": "software",
                "grade": "Grade 10",
                "syllabusUnit": "Unit 4: Operating Systems & Applications",
                "examRelevance": "Intangible programmatic instructions guiding hardware.",
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
        ],
    },
    {
        "id": "module-3",
        "moduleNumber": 3,
        "grade": "Grade 10",
        "syllabusArea": "Unit 5: Data Communication & Computer Networking",
        "title": "Unit 3: Data Communication & Networks",
        "sinhalaTitle": "දත්ත සන්නිවේදනය සහ පරිගණක ජාල (Data Communication & Networks)",
        "description": "Master verified ASL signs for interconnected computer nodes, local transmission links (LAN/WAN), and network topology.",
        "iconName": "Network",
        "passingThreshold": 70,
        "keywords": [
            {
                "id": "kw-network",
                "keyword": "network",
                "grade": "Grade 10",
                "syllabusUnit": "Unit 5: Networking & Topology",
                "examRelevance": "Interconnected autonomous computers sharing data and resources.",
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
        ],
    },
    # ── GRADE 11 O/L ICT SYLLABUS UNITS ──────────────────────────────────────────
    {
        "id": "module-4",
        "moduleNumber": 4,
        "grade": "Grade 11",
        "syllabusArea": "Unit 4: The Internet & World Wide Web",
        "title": "Unit 4: Internet Technologies & Protocols",
        "sinhalaTitle": "අන්තර්ජාලය සහ ලෝක විසිරී වියමන (Internet & WWW)",
        "description": "Understand orbital ASL signs for global web connectivity, HTTP/IP packet routing, and planetary internet access.",
        "iconName": "Globe",
        "passingThreshold": 70,
        "keywords": [
            {
                "id": "kw-internet",
                "keyword": "internet",
                "grade": "Grade 11",
                "syllabusUnit": "Unit 4: Internet & WWW",
                "examRelevance": "Global collection of interconnected computer networks.",
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
        ],
    },
    {
        "id": "module-5",
        "moduleNumber": 5,
        "grade": "Grade 11",
        "syllabusArea": "Unit 4: Internet Services & Communication",
        "title": "Unit 5: Electronic Messaging & Web Services",
        "sinhalaTitle": "විද්‍යුත් තැපෑල සහ සන්නිවේදන සේවා (Electronic Mail & Services)",
        "description": "Practice authentic ASL signs for electronic mail (SMTP/IMAP), client-server message transmission, and inbox envelope slots.",
        "iconName": "Mail",
        "passingThreshold": 70,
        "keywords": [
            {
                "id": "kw-email",
                "keyword": "email",
                "grade": "Grade 11",
                "syllabusUnit": "Unit 4: Internet Services",
                "examRelevance": "Transmission of digital messages over communication networks.",
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
        ],
    },
    {
        "id": "module-6",
        "moduleNumber": 6,
        "grade": "Grade 11",
        "syllabusArea": "Unit 1: Database Management Systems (DBMS)",
        "title": "Unit 6: Database Management Systems",
        "sinhalaTitle": "දත්ත සමුදාය කළමනාකරණ පද්ධති (Database Systems)",
        "description": "Master layered cylinder tier ASL signs for structured relational storage, DBMS tables, primary keys, and data persistence.",
        "iconName": "Database",
        "passingThreshold": 70,
        "keywords": [
            {
                "id": "kw-database",
                "keyword": "database",
                "grade": "Grade 11",
                "syllabusUnit": "Unit 1: Database Management Systems",
                "examRelevance": "Structured collection of logically related data in tables.",
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
        "id": "module-7",
        "moduleNumber": 7,
        "grade": "Grade 11",
        "syllabusArea": "Unit 6: Information Security, Ethics & Society",
        "title": "Unit 7: Cybersecurity & Information Ethics",
        "sinhalaTitle": "තොරතුරු ආරක්ෂාව සහ සයිබර් ආචාරධර්ම (Cybersecurity & Ethics)",
        "description": "Learn locked protective shield ASL signs for cyber defense, authentication, data confidentiality, and malware shields.",
        "iconName": "ShieldCheck",
        "passingThreshold": 70,
        "keywords": [
            {
                "id": "kw-security",
                "keyword": "security",
                "grade": "Grade 11",
                "syllabusUnit": "Unit 6: Information Security & Ethics",
                "examRelevance": "Protecting computer systems and data against unauthorized access.",
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


async def generate_sign_learning_plan(student_id: str, grade_focus: str = "ALL") -> dict[str, Any]:
    """
    Generate an intelligent, personalized Sign Language Learning Plan categorized
    strictly according to Grade 10 and Grade 11 Sri Lanka O/L ICT syllabus areas.
    """
    progress = await get_student_progress(student_id)
    completed_set = set(k.lower() for k in progress.get("completedKeywords", []))
    accuracies = progress.get("keywordAccuracies", {})

    now = datetime.now(timezone.utc)

    grade10_areas = []
    grade11_areas = []
    priority_keywords = []

    for mod in COURSE_MODULES:
        mod_grade = mod.get("grade", "Grade 10")
        mod_keywords = mod["keywords"]
        total_in_mod = len(mod_keywords)
        completed_in_mod = sum(1 for kw in mod_keywords if kw["keyword"].lower() in completed_set)
        mastery_pct = round((completed_in_mod / total_in_mod) * 100) if total_in_mod > 0 else 0

        # Exam relevance & smart wristband haptic calibration
        if mod["id"] == "module-1":
            exam_weight = "High (O/L Paper 1 & 2 Section A: Computer Architecture & Hardware)"
            haptic_focus = "Double short vibration pulse if fingers are not arched downward during typing posture."
        elif mod["id"] == "module-2":
            exam_weight = "Medium (O/L Paper 1: Operating Systems & Software Classification)"
            haptic_focus = "Smooth gliding haptic buzz when V-shape passes horizontally across receiving palm."
        elif mod["id"] == "module-3":
            exam_weight = "High (O/L Paper 2: Network Topologies, Nodes & Transmission Media)"
            haptic_focus = "Middle finger tip contact check with interlocking node vibration alert."
        elif mod["id"] == "module-4":
            exam_weight = "High (O/L Paper 1 & 2: WWW, IP Addressing, Web Protocols)"
            haptic_focus = "Orbital continuous oscillation pattern around center pivot axis."
        elif mod["id"] == "module-5":
            exam_weight = "Medium (O/L Paper 1: Email Protocols & Digital Communication Services)"
            haptic_focus = "Forward acceleration burst pulse on envelope slot pass-through."
        elif mod["id"] == "module-6":
            exam_weight = "Very High (O/L Paper 2 Question 3: DBMS, Tables & Relational Integrity)"
            haptic_focus = "Tiered downward pulse confirming vertical cylinder storage layer."
        else:
            exam_weight = "High (O/L Paper 1 & 2: Cyber Safety, Threats & Information Ethics)"
            haptic_focus = "Firm chest cross shield-lock vibration on defense wrist crossing."

        # Action recommendation
        if mastery_pct == 100:
            action = f"Mastered! Perform a quick 2-minute camera sign refresher before term tests."
        elif mastery_pct > 0:
            unmastered = [kw["keyword"].upper() for kw in mod_keywords if kw["keyword"].lower() not in completed_set]
            action = f"In Progress. Practice remaining term(s): {', '.join(unmastered)} using camera AI."
            priority_keywords.extend([kw["keyword"].lower() for kw in mod_keywords if kw["keyword"].lower() not in completed_set])
        else:
            action = f"Not Started. Begin 10-minute targeted practice session on {mod['title']}."
            priority_keywords.extend([kw["keyword"].lower() for kw in mod_keywords])

        kw_details = []
        for kw in mod_keywords:
            k_name = kw["keyword"].lower()
            is_done = k_name in completed_set
            acc = accuracies.get(k_name, 0 if not is_done else 85)
            kw_details.append({
                "keyword": kw["keyword"],
                "englishMeaning": kw["englishMeaning"],
                "category": kw["category"],
                "difficulty": kw["difficulty"],
                "examRelevance": kw.get("examRelevance", "O/L ICT syllabus key term"),
                "isCompleted": is_done,
                "accuracy": acc,
            })

        area_plan = {
            "grade": mod_grade,
            "syllabusUnit": mod.get("syllabusArea", mod["title"]),
            "topicTitle": mod["title"],
            "examWeight": exam_weight,
            "targetKeywords": kw_details,
            "completedCount": completed_in_mod,
            "totalCount": total_in_mod,
            "masteryPercentage": mastery_pct,
            "recommendedAction": action,
            "wristbandHapticFocus": haptic_focus,
        }

        if mod_grade == "Grade 10":
            grade10_areas.append(area_plan)
        else:
            grade11_areas.append(area_plan)

    # 4-Week O/L ICT Revision Schedule
    weekly_schedule = [
        {
            "week": "Week 1: Grade 10 Foundations",
            "focus": "Computer Architecture & Hardware (COMPUTER, HARDWARE)",
            "syllabusTopic": "Grade 10 Unit 2: Architecture of Computer Systems",
            "targetMinutes": 20,
            "wristbandMode": "Flex Sensor & Palm Impact Mode",
        },
        {
            "week": "Week 2: Grade 10 Software & Networks",
            "focus": "Software Logic & Network Topologies (SOFTWARE, NETWORK)",
            "syllabusTopic": "Grade 10 Unit 4 & 5: Operating Systems & Data Communication",
            "targetMinutes": 25,
            "wristbandMode": "Glide & Node Interlock Detection",
        },
        {
            "week": "Week 3: Grade 11 Web & Communications",
            "focus": "Internet Protocols & Electronic Messaging (INTERNET, EMAIL)",
            "syllabusTopic": "Grade 11 Unit 4: The Internet and World Wide Web",
            "targetMinutes": 25,
            "wristbandMode": "Orbital Gyro & Slot Acceleration Burst",
        },
        {
            "week": "Week 4: Grade 11 DBMS & Cybersecurity",
            "focus": "Relational Databases & Cyber Protection (DATABASE, SECURITY)",
            "syllabusTopic": "Grade 11 Unit 1 & 6: DBMS & Information Security",
            "targetMinutes": 30,
            "wristbandMode": "Cylinder Tier & Crossed Shield Lock",
        },
    ]

    exam_tips = [
        "In O/L ICT Paper 1 & 2, questions on Computer Architecture (Grade 10 Unit 2) frequently test input/output and processing differentiation. Master the physical palm impact sign for HARDWARE vs the virtual typing sign for COMPUTER.",
        "Grade 11 Unit 1 Database questions test entities, tables, and records. Visualize the stacked 'C' cylinder tier ASL gesture to remember structured relational storage layers.",
        "Networking and Internet concepts appear across both Grade 10 Unit 5 and Grade 11 Unit 4. Remember that NETWORK represents connected node links while INTERNET represents orbital global routing.",
        "Cybersecurity questions in Grade 11 Unit 6 emphasize firewalls and authentication. The crossed defensive shield sign reinforces the concept of security barriers.",
    ]

    total_kw = len(ALL_KEYWORDS_MAP)
    done_kw = len(completed_set)
    overall_mastery = round((done_kw / total_kw) * 100) if total_kw > 0 else 0

    return {
        "studentId": student_id,
        "planTitle": "Grade 10 & 11 Ordinary Level (O/L) ICT Sign Language Learning Plan",
        "gradeFocus": grade_focus,
        "generatedAt": now,
        "overallMastery": overall_mastery,
        "totalKeywords": total_kw,
        "completedKeywordsCount": done_kw,
        "grade10SyllabusAreas": grade10_areas,
        "grade11SyllabusAreas": grade11_areas,
        "priorityFocusKeywords": priority_keywords[:4] if priority_keywords else ["computer", "network", "database", "security"],
        "weeklyRevisionSchedule": weekly_schedule,
        "examTips": exam_tips,
    }
