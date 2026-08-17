"""
Service layer for the O/L ICT knowledge graph popup question system.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from src.common.database.connection import get_db


KNOWLEDGE_GRAPH_COLLECTION = "knowledge_graph"
POPUP_QUESTIONS_COLLECTION = "popup_questions"
LESSON_TIMELINES_COLLECTION = "lesson_timelines"
STUDENT_ANSWERS_COLLECTION = "student_popup_answers"

MODULE_DIR = Path(__file__).resolve().parents[1]
KNOWLEDGE_GRAPH_DATASET = MODULE_DIR / "datasets" / "ol_ict_knowledge_graph.json"
LESSON_TIMELINE_DATASET = MODULE_DIR / "seed" / "sample_lesson_timeline.json"
CONCEPT_DIAGRAM_DATASET = MODULE_DIR / "datasets" / "ol_ict_concept_diagrams.json"

CURRENT_CONCEPT_WEIGHT = 0.60
PREREQUISITE_WEIGHT = 0.25
RELATED_CONCEPT_WEIGHT = 0.15


async def initialize_knowledge_graph() -> None:
    """Seed the knowledge graph, popup questions, and sample timeline if needed."""
    db = get_db()
    await _ensure_indexes()

    dataset = _read_json(KNOWLEDGE_GRAPH_DATASET)
    diagrams = _read_json(CONCEPT_DIAGRAM_DATASET)
    diagram_map = {
        item["conceptId"]: item["diagram"]
        for item in diagrams.get("diagrams", [])
    }
    seeded_at = datetime.now(timezone.utc)

    for sort_order, concept in enumerate(dataset["concepts"], start=1):
        concept_doc = {
            **concept,
            "diagram": diagram_map.get(concept["conceptId"]),
            "subject": dataset["subject"],
            "datasetVersion": dataset["version"],
            "sortOrder": sort_order,
            "updatedAt": seeded_at,
        }
        await db[KNOWLEDGE_GRAPH_COLLECTION].update_one(
            {"conceptId": concept["conceptId"]},
            {"$set": concept_doc},
            upsert=True,
        )

        for question_order, question in enumerate(concept["questions"], start=1):
            question_doc = {
                **question,
                "conceptName": concept["conceptName"],
                "grade": concept["grade"],
                "unit": concept["unit"],
                "subject": dataset["subject"],
                "datasetVersion": dataset["version"],
                "sortOrder": question_order,
                "updatedAt": seeded_at,
            }
            await db[POPUP_QUESTIONS_COLLECTION].update_one(
                {"questionId": question["questionId"]},
                {"$set": question_doc},
                upsert=True,
            )

    lesson_timeline = _read_json(LESSON_TIMELINE_DATASET)
    lesson_timeline["updatedAt"] = seeded_at
    await db[LESSON_TIMELINES_COLLECTION].update_one(
        {"lessonId": lesson_timeline["lessonId"]},
        {"$set": lesson_timeline},
        upsert=True,
    )


async def get_knowledge_graph() -> dict[str, Any]:
    """Return the full O/L ICT knowledge graph dataset from MongoDB."""
    db = get_db()
    concepts = []
    cursor = db[KNOWLEDGE_GRAPH_COLLECTION].find().sort("sortOrder", 1)
    async for concept in cursor:
        concepts.append(_serialize_concept(concept))

    return {
        "subject": "O/L ICT",
        "conceptCount": len(concepts),
        "concepts": concepts,
    }


async def get_lesson_timeline(lesson_id: str) -> dict[str, Any] | None:
    """Return the resolved lesson timeline for a lesson or linked video id."""
    timeline = await _resolve_lesson_timeline(lesson_id)
    if not timeline:
        return None
    return timeline


async def get_popup_question(student_id: str, lesson_id: str, current_time: float) -> dict[str, Any]:
    """
    Select one popup question using the Graph-Based Question Selection Algorithm.
    """
    db = get_db()
    lesson_timeline = await _resolve_lesson_timeline(lesson_id)
    if not lesson_timeline:
        return {
            "lessonId": lesson_id,
            "requestedLessonId": lesson_id,
            "currentConcept": None,
            "timelineWindow": None,
            "question": None,
            "weights": _weight_map(),
            "selectionReason": None,
            "message": "No lesson timeline is configured for this lesson yet.",
        }

    timeline_window = _find_timeline_segment(lesson_timeline.get("timeline", []), current_time)
    if not timeline_window:
        return {
            "lessonId": lesson_timeline["lessonId"],
            "requestedLessonId": lesson_id,
            "currentConcept": None,
            "timelineWindow": None,
            "question": None,
            "weights": _weight_map(),
            "selectionReason": None,
            "message": "The current playback time is outside the configured lesson timeline.",
        }

    current_concept = None
    try:
        current_concept = await db[KNOWLEDGE_GRAPH_COLLECTION].find_one(
            {"conceptId": timeline_window["conceptId"]}
        )
    except Exception as e:
        print(f"[KnowledgeGraph] DB concept find error: {e}")

    # Fallback to local dataset if DB is unreachable or concept is missing
    if not current_concept:
        try:
            dataset = _read_json(KNOWLEDGE_GRAPH_DATASET)
            matched = next((c for c in dataset.get("concepts", []) if c.get("conceptId") == timeline_window.get("conceptId")), None)
            if not matched and dataset.get("concepts"):
                matched = dataset["concepts"][0]
            current_concept = matched
        except Exception:
            current_concept = None

    if not current_concept:
        return {
            "lessonId": lesson_timeline.get("lessonId", lesson_id),
            "requestedLessonId": lesson_id,
            "currentConcept": None,
            "timelineWindow": timeline_window,
            "question": None,
            "weights": _weight_map(),
            "selectionReason": None,
            "message": "The timeline points to a concept that is missing from the knowledge graph.",
        }

    concept_scope = _build_concept_scope(current_concept)
    student_profile = {"overallAccuracy": None, "conceptAccuracy": {}, "totalAnswers": 0}
    try:
        student_profile = await _build_student_profile(student_id)
    except Exception:
        pass

    all_scope_questions = []
    try:
        cursor = db[POPUP_QUESTIONS_COLLECTION].find(
            {
                "conceptId": {"$in": list(concept_scope.keys())},
            }
        )
        async for question in cursor:
            question["selectionScore"] = _score_question(question, concept_scope, student_profile)
            all_scope_questions.append(question)
    except Exception as e:
        print(f"[KnowledgeGraph] DB questions query error: {e}")

    # Fallback to concept embedded questions from dataset
    if not all_scope_questions and current_concept.get("questions"):
        for q in current_concept["questions"]:
            q_copy = dict(q)
            q_copy["conceptId"] = current_concept["conceptId"]
            q_copy["conceptName"] = current_concept["conceptName"]
            q_copy["grade"] = current_concept.get("grade", "O/L")
            q_copy["unit"] = current_concept.get("unit", "ICT")
            q_copy["selectionScore"] = 1.0
            all_scope_questions.append(q_copy)

    answered_lookup = {}
    try:
        answered_docs = await db[STUDENT_ANSWERS_COLLECTION].find(
            {
                "studentId": student_id,
                "questionId": {"$in": [question["questionId"] for question in all_scope_questions]},
            }
        ).to_list(length=None)
        answered_lookup = {doc["questionId"]: doc for doc in answered_docs}
    except Exception:
        answered_lookup = {}

    unanswered_candidates = [
        question
        for question in all_scope_questions
        if question["questionId"] not in answered_lookup
    ]

    if unanswered_candidates:
        unanswered_candidates.sort(
            key=lambda item: (
                item.get("selectionScore", 1.0),
                concept_scope.get(item.get("conceptId"), 0),
                _difficulty_rank(item.get("difficultyLevel", "medium")),
                item.get("questionId", ""),
            ),
            reverse=True,
        )
        selected_question = unanswered_candidates[0]
        selection_reason = _build_selection_reason(selected_question, concept_scope)
    else:
        review_candidates = []
        for question in all_scope_questions:
            answer_doc = answered_lookup.get(question["questionId"])
            if not answer_doc:
                continue
            question["reviewPriority"] = _review_priority(question, answer_doc, concept_scope)
            review_candidates.append(question)

        if not review_candidates:
            # If all were answered but we have candidates, pick the first
            if all_scope_questions:
                selected_question = all_scope_questions[0]
                selection_reason = "Selected for concept reinforcement."
            else:
                return {
                    "lessonId": lesson_timeline.get("lessonId", lesson_id),
                    "requestedLessonId": lesson_id,
                    "currentConcept": _serialize_current_concept(current_concept),
                    "timelineWindow": timeline_window,
                    "question": None,
                    "weights": _weight_map(),
                    "selectionReason": "No popup questions are configured for the current graph neighborhood.",
                    "message": "No popup question is available for this lesson segment yet.",
                }
        else:
            review_candidates.sort(
                key=lambda item: (
                    item["reviewPriority"],
                    item.get("selectionScore", 1.0),
                    concept_scope.get(item.get("conceptId"), 0),
                    _difficulty_rank(item.get("difficultyLevel", "medium")),
                    item.get("questionId", ""),
                ),
                reverse=True,
            )
            selected_question = review_candidates[0]
            selection_reason = _build_review_selection_reason(selected_question, concept_scope, answered_lookup.get(selected_question["questionId"], {}))

    return {
        "lessonId": lesson_timeline.get("lessonId", lesson_id),
        "requestedLessonId": lesson_id,
        "currentConcept": _serialize_current_concept(current_concept),
        "timelineWindow": timeline_window,
        "question": _serialize_question_prompt(selected_question),
        "weights": _weight_map(),
        "selectionReason": selection_reason,
        "message": None,
    }


async def submit_popup_answer(payload: dict[str, Any]) -> dict[str, Any]:
    """Persist a popup answer using the authoritative question metadata."""
    db = get_db()
    question = await db[POPUP_QUESTIONS_COLLECTION].find_one({"questionId": payload["questionId"]})
    if not question:
        raise ValueError("Question not found in popup_questions collection.")

    answered_at = payload.get("answeredAt") or datetime.now(timezone.utc)
    is_correct = payload["selectedAnswer"] == question["correctAnswer"]
    answer_doc = {
        "studentId": payload["studentId"],
        "lessonId": payload["lessonId"],
        "conceptId": question["conceptId"],
        "conceptName": question["conceptName"],
        "questionId": question["questionId"],
        "questionText": question["questionText"],
        "selectedAnswer": payload["selectedAnswer"],
        "correctAnswer": question["correctAnswer"],
        "isCorrect": is_correct,
        "difficultyLevel": question["difficultyLevel"],
        "explanation": question["explanation"],
        "answeredAt": answered_at,
        "updatedAt": datetime.now(timezone.utc),
    }

    await db[STUDENT_ANSWERS_COLLECTION].update_one(
        {
            "studentId": answer_doc["studentId"],
            "questionId": answer_doc["questionId"],
        },
        {
            "$set": answer_doc,
            "$setOnInsert": {"createdAt": answered_at},
        },
        upsert=True,
    )

    saved_doc = await db[STUDENT_ANSWERS_COLLECTION].find_one(
        {"studentId": answer_doc["studentId"], "questionId": answer_doc["questionId"]}
    )
    return _serialize_answer(saved_doc)


async def get_student_popup_answers(student_id: str) -> list[dict[str, Any]]:
    """Return popup answer history for a student."""
    db = get_db()
    cursor = db[STUDENT_ANSWERS_COLLECTION].find({"studentId": student_id}).sort("answeredAt", -1)
    answers = []
    async for doc in cursor:
        answers.append(_serialize_answer(doc))
    return answers


async def _resolve_lesson_timeline(lesson_id: str) -> dict[str, Any] | None:
    try:
        db = get_db()
        timeline = await db[LESSON_TIMELINES_COLLECTION].find_one({"lessonId": lesson_id})
        if timeline:
            return _serialize_timeline(timeline)

        timeline = await db[LESSON_TIMELINES_COLLECTION].find_one({"linkedVideoId": lesson_id})
        if timeline:
            return _serialize_timeline(timeline)

        timeline = await db[LESSON_TIMELINES_COLLECTION].find_one({"isDefault": True})
        if timeline:
            return _serialize_timeline(timeline)
    except Exception as e:
        print(f"[KnowledgeGraph] DB timeline lookup error: {e}")

    try:
        sample_timeline = _read_json(LESSON_TIMELINE_DATASET)
        return _serialize_timeline(sample_timeline)
    except Exception:
        return None


async def _build_student_profile(student_id: str) -> dict[str, Any]:
    db = get_db()
    cursor = db[STUDENT_ANSWERS_COLLECTION].find({"studentId": student_id})

    total_answers = 0
    total_correct = 0
    per_concept: dict[str, dict[str, int]] = {}

    async for answer in cursor:
        total_answers += 1
        total_correct += 1 if answer.get("isCorrect") else 0
        concept_id = answer.get("conceptId")
        if not concept_id:
            continue
        concept_stats = per_concept.setdefault(concept_id, {"total": 0, "correct": 0})
        concept_stats["total"] += 1
        concept_stats["correct"] += 1 if answer.get("isCorrect") else 0

    concept_accuracy = {
        concept_id: stats["correct"] / stats["total"]
        for concept_id, stats in per_concept.items()
        if stats["total"]
    }

    overall_accuracy = None
    if total_answers:
        overall_accuracy = total_correct / total_answers

    return {
        "overallAccuracy": overall_accuracy,
        "conceptAccuracy": concept_accuracy,
        "totalAnswers": total_answers,
    }


async def _ensure_indexes() -> None:
    db = get_db()
    await db[KNOWLEDGE_GRAPH_COLLECTION].create_index("conceptId", unique=True)
    await db[POPUP_QUESTIONS_COLLECTION].create_index("questionId", unique=True)
    await db[POPUP_QUESTIONS_COLLECTION].create_index("conceptId")
    await db[LESSON_TIMELINES_COLLECTION].create_index("lessonId", unique=True)
    await db[LESSON_TIMELINES_COLLECTION].create_index("linkedVideoId")
    await db[STUDENT_ANSWERS_COLLECTION].create_index(
        [("studentId", 1), ("questionId", 1)],
        unique=True,
    )
    await db[STUDENT_ANSWERS_COLLECTION].create_index([("studentId", 1), ("answeredAt", -1)])


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _serialize_concept(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "conceptId": doc["conceptId"],
        "conceptName": doc["conceptName"],
        "grade": doc["grade"],
        "unit": doc["unit"],
        "description": doc["description"],
        "prerequisites": doc.get("prerequisites", []),
        "relatedConcepts": doc.get("relatedConcepts", []),
        "difficultyLevel": doc["difficultyLevel"],
        "keywords": doc.get("keywords", []),
        "diagram": doc.get("diagram"),
        "questions": [_serialize_question(question) for question in doc.get("questions", [])],
    }


def _serialize_current_concept(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "conceptId": doc["conceptId"],
        "conceptName": doc["conceptName"],
        "unit": doc["unit"],
        "description": doc["description"],
        "difficultyLevel": doc["difficultyLevel"],
        "prerequisites": doc.get("prerequisites", []),
        "relatedConcepts": doc.get("relatedConcepts", []),
        "keywords": doc.get("keywords", []),
        "diagram": doc.get("diagram"),
    }


def _serialize_question(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "questionId": doc["questionId"],
        "questionText": doc["questionText"],
        "options": doc["options"],
        "correctAnswer": doc["correctAnswer"],
        "explanation": doc["explanation"],
        "difficultyLevel": doc["difficultyLevel"],
        "conceptId": doc["conceptId"],
    }


def _serialize_question_prompt(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "questionId": doc["questionId"],
        "questionText": doc["questionText"],
        "options": doc["options"],
        "difficultyLevel": doc["difficultyLevel"],
        "conceptId": doc["conceptId"],
    }


def _serialize_answer(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "studentId": doc["studentId"],
        "lessonId": doc["lessonId"],
        "conceptId": doc["conceptId"],
        "conceptName": doc["conceptName"],
        "questionId": doc["questionId"],
        "questionText": doc["questionText"],
        "selectedAnswer": doc["selectedAnswer"],
        "correctAnswer": doc["correctAnswer"],
        "isCorrect": doc["isCorrect"],
        "difficultyLevel": doc["difficultyLevel"],
        "explanation": doc["explanation"],
        "answeredAt": doc["answeredAt"],
    }


def _serialize_timeline(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "lessonId": doc["lessonId"],
        "videoTitle": doc["videoTitle"],
        "videoUrl": doc["videoUrl"],
        "isDefault": doc.get("isDefault", False),
        "timeline": doc.get("timeline", []),
    }


def _find_timeline_segment(timeline: list[dict[str, Any]], current_time: float) -> dict[str, Any] | None:
    for segment in timeline:
        if segment["startTime"] <= current_time <= segment["endTime"]:
            return segment
    return None


def _build_concept_scope(current_concept: dict[str, Any]) -> dict[str, float]:
    scope: dict[str, float] = {current_concept["conceptId"]: CURRENT_CONCEPT_WEIGHT}

    for prerequisite in current_concept.get("prerequisites", []):
        scope[prerequisite] = max(scope.get(prerequisite, 0), PREREQUISITE_WEIGHT)

    for related in current_concept.get("relatedConcepts", []):
        scope[related] = max(scope.get(related, 0), RELATED_CONCEPT_WEIGHT)

    return scope


def _score_question(
    question: dict[str, Any],
    concept_scope: dict[str, float],
    student_profile: dict[str, Any],
) -> float:
    concept_weight = concept_scope.get(question["conceptId"], 0)
    concept_accuracy = student_profile["conceptAccuracy"].get(question["conceptId"])
    difficulty_weight = _difficulty_weight(
        question["difficultyLevel"],
        student_profile.get("overallAccuracy"),
        concept_accuracy,
    )
    mastery_boost = _mastery_boost(concept_accuracy)
    return round(concept_weight * difficulty_weight * mastery_boost, 6)


def _difficulty_weight(
    difficulty_level: str,
    overall_accuracy: float | None,
    concept_accuracy: float | None,
) -> float:
    reference_accuracy = concept_accuracy
    if reference_accuracy is None:
        reference_accuracy = overall_accuracy

    if reference_accuracy is None:
        weights = {"easy": 1.10, "medium": 1.00, "hard": 0.90}
    elif reference_accuracy < 0.50:
        weights = {"easy": 1.20, "medium": 1.00, "hard": 0.80}
    elif reference_accuracy < 0.80:
        weights = {"easy": 0.95, "medium": 1.10, "hard": 1.00}
    else:
        weights = {"easy": 0.85, "medium": 1.00, "hard": 1.15}

    return weights.get(difficulty_level, 1.00)


def _mastery_boost(concept_accuracy: float | None) -> float:
    if concept_accuracy is None:
        return 1.00
    if concept_accuracy < 0.50:
        return 1.15
    if concept_accuracy < 0.80:
        return 1.05
    return 0.95


def _difficulty_rank(difficulty_level: str) -> int:
    return {"easy": 1, "medium": 2, "hard": 3}.get(difficulty_level, 0)


def _weight_map() -> dict[str, float]:
    return {
        "currentConcept": CURRENT_CONCEPT_WEIGHT,
        "prerequisites": PREREQUISITE_WEIGHT,
        "relatedConcepts": RELATED_CONCEPT_WEIGHT,
    }


def _build_selection_reason(question: dict[str, Any], concept_scope: dict[str, float]) -> str:
    concept_weight = concept_scope.get(question["conceptId"], 0)
    if concept_weight == CURRENT_CONCEPT_WEIGHT:
        concept_label = "current concept"
    elif concept_weight == PREREQUISITE_WEIGHT:
        concept_label = "prerequisite concept"
    else:
        concept_label = "related concept"

    return (
        f"Selected from the {concept_label} neighborhood with "
        f"{question['difficultyLevel']} difficulty and the highest score among unanswered questions."
    )


def _review_priority(
    question: dict[str, Any],
    answer_doc: dict[str, Any],
    concept_scope: dict[str, float],
) -> float:
    priority = concept_scope.get(question["conceptId"], 0) * 10
    priority += question.get("selectionScore", 0) * 5
    priority += 3 if not answer_doc.get("isCorrect") else 0
    answered_at = answer_doc.get("answeredAt")
    if answered_at:
        if answered_at.tzinfo is None:
            answered_at = answered_at.replace(tzinfo=timezone.utc)
        elapsed_hours = max((datetime.now(timezone.utc) - answered_at).total_seconds() / 3600, 0)
        priority += min(elapsed_hours / 24, 2)
    return round(priority, 6)


def _build_review_selection_reason(
    question: dict[str, Any],
    concept_scope: dict[str, float],
    answer_doc: dict[str, Any],
) -> str:
    concept_weight = concept_scope.get(question["conceptId"], 0)
    if concept_weight == CURRENT_CONCEPT_WEIGHT:
        concept_label = "current concept"
    elif concept_weight == PREREQUISITE_WEIGHT:
        concept_label = "prerequisite concept"
    else:
        concept_label = "related concept"

    if answer_doc.get("isCorrect"):
        review_reason = "all nearby questions were already used, so this one is being recycled for spaced review"
    else:
        review_reason = "this question was answered incorrectly before, so it is being repeated for reinforcement"

    return (
        f"Selected from the {concept_label} neighborhood with "
        f"{question['difficultyLevel']} difficulty because {review_reason}."
    )
