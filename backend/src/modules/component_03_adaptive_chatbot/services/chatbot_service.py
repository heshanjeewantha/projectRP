"""
Service layer for the advanced adaptive chatbot with reinforcement,
micro-challenges, repeated-query alerts, lesson summaries, and analytics.
"""
from __future__ import annotations

import asyncio
import csv
import io
import json
import logging
import math
import re
import zlib
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib import error as urllib_error
from urllib import request as urllib_request
from xml.etree import ElementTree as ET
from zipfile import ZipFile

from src.common.config.settings import settings
from src.common.database.connection import get_db


CHATBOT_MESSAGES_COLLECTION = "chatbotMessages"
CHATBOT_SESSIONS_COLLECTION = "chatbotSessions"
ICT_SYLLABUS_TOPICS_COLLECTION = "ictSyllabusTopics"
STUDENT_LEARNING_STATES_COLLECTION = "studentLearningStates"
KNOWLEDGE_GRAPH_COLLECTION = "knowledge_graph"
STUDENT_ANSWERS_COLLECTION = "student_popup_answers"
ATTENTION_LOGS_COLLECTION = "attention_logs"
MICRO_CHALLENGES_COLLECTION = "microChallenges"
MICRO_CHALLENGE_ATTEMPTS_COLLECTION = "microChallengeAttempts"
LESSON_SUMMARIES_COLLECTION = "lessonSummaries"
LEARNED_TOPICS_COLLECTION = "learnedTopics"
LOGIN_QUIZ_ATTEMPTS_COLLECTION = "loginQuizAttempts"
REPEATED_QUERY_ALERTS_COLLECTION = "repeatedQueryAlerts"
CONCEPT_REENTRY_LOGS_COLLECTION = "conceptReEntryLogs"
STUDENT_UNDERSTANDING_SCORES_COLLECTION = "studentUnderstandingScores"
TEACHER_ANALYTICS_REPORTS_COLLECTION = "teacherAnalyticsReports"
USERS_COLLECTION = "users"

MODULE_DIR = Path(__file__).resolve().parents[1]
DATASET_DIR = MODULE_DIR / "datasets"
CHATBOT_SYLLABUS_DATASET = DATASET_DIR / "ol_ict_chatbot_syllabus.json"
LESSONS_DATASET_DIR = DATASET_DIR / "Lessons"
SHORT_NOTES_DATASET_DIR = DATASET_DIR / "Short Notes"
LESSON_QUESTIONS_DATASET_DIR = DATASET_DIR / "Lesson Questions"
PDF_TEXT_LIMIT = 16000
REFERENCE_SENTENCE_LIMIT = 24
QUESTION_BANK_LIMIT = 40
TOPIC_OPTION_LIMIT = 64
STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "can",
    "for",
    "from",
    "give",
    "how",
    "i",
    "in",
    "into",
    "is",
    "it",
    "lesson",
    "me",
    "my",
    "of",
    "on",
    "or",
    "please",
    "question",
    "short",
    "show",
    "tell",
    "the",
    "this",
    "to",
    "topic",
    "what",
    "when",
    "where",
    "which",
    "who",
    "why",
}

LEARNING_KEYWORDS = [
    "explain",
    "what is",
    "how",
    "why",
    "example",
    "understand",
    "difference",
    "compare",
    "teach",
]
EXAM_KEYWORDS = [
    "past paper",
    "short answer",
    "marks",
    "exam",
    "mcq",
    "define",
    "list",
    "2 marks",
    "structured question",
    "give points",
]

STATE_LABELS = {
    "understanding": "Understanding",
    "not_understanding": "Not Understanding",
    "bored": "Bored",
    "distracted": "Distracted",
}

DIFFICULTY_LABELS = {
    1: "Basic definition",
    2: "Explanation",
    3: "Comparison",
    4: "Application question",
    5: "Exam-style problem",
}

LOGGER = logging.getLogger(__name__)
LLM_RETRYABLE_REASONS = {"api_timeout", "network_error", "provider_server_error", "invalid_llm_response"}
DEFAULT_UNKNOWN_TOPIC_SUGGESTIONS = [
    "Computer System",
    "Data and Information",
    "Operating Systems",
    "Databases",
    "Spreadsheets",
    "Internet and Email",
]


class LLMApiError(Exception):
    def __init__(self, safe_reason: str, message: str | None = None) -> None:
        super().__init__(message or safe_reason)
        self.safe_reason = safe_reason


async def initialize_chatbot_data() -> None:
    """Seed syllabus topics, summaries, and indexes for advanced chatbot flows."""
    db = get_db()
    await _ensure_indexes()

    dataset = _read_json(CHATBOT_SYLLABUS_DATASET)
    seeded_at = _utc_now()
    topic_label_map = {
        topic["topicId"]: topic["topicName"]
        for topic in dataset["topics"]
    }

    for sort_order, topic in enumerate(dataset["topics"], start=1):
        prerequisite_labels = _resolve_prerequisite_labels(topic.get("prerequisites", []), topic_label_map)
        simple_definitions = _build_simple_definitions(topic)
        topic_examples = _build_topic_examples(topic)
        topic_doc = {
            **topic,
            "subject": dataset["subject"],
            "datasetVersion": dataset["version"],
            "sortOrder": sort_order,
            "prerequisiteLabels": prerequisite_labels,
            "simpleDefinitions": simple_definitions,
            "examples": topic_examples,
            "updatedAt": seeded_at,
        }
        await db[ICT_SYLLABUS_TOPICS_COLLECTION].update_one(
            {"topicId": topic["topicId"]},
            {"$set": topic_doc},
            upsert=True,
        )

        await db[LESSON_SUMMARIES_COLLECTION].update_one(
            {"topicId": topic["topicId"]},
            {
                "$set": {
                    "topicId": topic["topicId"],
                    "topicName": topic["topicName"],
                    "summary": topic["summary"],
                    "keyPoints": topic.get("keyPoints", []),
                    "prerequisites": topic.get("prerequisites", []),
                    "prerequisiteLabels": prerequisite_labels,
                    "simpleDefinitions": simple_definitions,
                    "examples": topic_examples,
                    "sampleQuestions": topic.get("sampleQuestions", []),
                    "examQuestions": topic.get("examQuestions", []),
                    "updatedAt": seeded_at,
                }
            },
            upsert=True,
        )

        for challenge in topic.get("microChallenges", []):
            challenge_id = challenge["challengeId"]
            await db[MICRO_CHALLENGES_COLLECTION].update_one(
                {"challengeId": challenge_id},
                {
                    "$set": {
                        **challenge,
                        "topicId": topic["topicId"],
                        "topicName": topic["topicName"],
                        "prerequisites": topic.get("prerequisites", []),
                        "prerequisiteLabels": prerequisite_labels,
                        "updatedAt": seeded_at,
                    }
                },
                upsert=True,
            )

    await _sync_knowledge_graph_topics(seeded_at)
    await _sync_uploaded_dataset_topics(seeded_at)


async def ask_chatbot(payload: dict[str, Any]) -> dict[str, Any]:
    """Generate, persist, and score an adaptive chatbot answer."""
    db = get_db()
    question = payload["question"].strip()
    detected_intent = detectIntent(question)
    mode = _resolve_mode(payload.get("selectedMode"), detected_intent)

    topic_doc = await detectTopic(question, payload.get("currentTopic"))
    topic_id = topic_doc["topicId"] if topic_doc else "general_ict"
    topic_name = topic_doc["topicName"] if topic_doc else "General O/L ICT"
    prerequisites = getPrerequisites(payload.get("prerequisiteTopics", []), topic_doc)
    learning_state = await _resolve_learning_state(
        payload.get("currentLearningState"),
        payload["studentId"],
        topic_id,
    )
    reentry = await check_concept_reentry(
        {
            "studentId": payload["studentId"],
            "topicId": topic_id,
            "currentQuestion": question,
        },
        persist_log=True,
    )
    repeated_query = await check_repeated_query(
        {
            "studentId": payload["studentId"],
            "question": question,
            "currentTopic": topic_name,
        },
        persist_alert=True,
    )

    difficulty_level = await _determine_difficulty_level(payload["studentId"], topic_id)
    prompt = generateEARAPrompt(
        question=question,
        intent=detected_intent,
        learningState=learning_state,
        topic=topic_name,
        prerequisites=prerequisites,
    )
    answer_bundle = await _generate_answer_bundle(
        question=question,
        mode=mode,
        intent=detected_intent,
        learning_state=learning_state,
        topic_doc=topic_doc,
        prerequisites=prerequisites,
        difficulty_level=difficulty_level,
        refresh_points=reentry.get("keyPoints", []),
        prompt=prompt,
        repeated_query_count=repeated_query["repeatedQueryCount"],
    )
    answer = answer_bundle["answer"]

    created_at = _utc_now()
    compressed_answer = mode == "exam"
    next_difficulty_prompt = await _build_difficulty_prompt(
        topic_doc=topic_doc,
        student_id=payload["studentId"],
        difficulty_level=difficulty_level,
        question=question,
        intent=detected_intent,
        learning_state=learning_state,
        mode=mode,
        prerequisites=prerequisites,
        repeated_query_count=repeated_query["repeatedQueryCount"],
    )
    summary_topic_id = topic_id if repeated_query["repeatedQueryCount"] >= 3 else None
    summary_recommendation = (
        "Repeated difficulty detected. Review the lesson summary before continuing."
        if summary_topic_id
        else None
    )

    message_doc = {
        "studentId": payload["studentId"],
        "question": question,
        "answer": answer,
        "mode": mode,
        "detectedIntent": detected_intent,
        "intent": detected_intent,
        "learningState": learning_state,
        "topic": topic_name,
        "inferredTopic": topic_name if topic_doc else None,
        "prerequisiteTopics": prerequisites,
        "prerequisites": prerequisites,
        "suggestedNextTopic": _suggest_next_topic(topic_doc),
        "prompt": prompt,
        "createdAt": created_at,
        "updatedAt": created_at,
        "repeatedQueryStatus": repeated_query["repeatedQueryStatus"],
        "repeatedQueryCount": repeated_query["repeatedQueryCount"],
        "difficultyLevel": difficulty_level,
        "compressedAnswer": compressed_answer,
        "summaryRecommendation": summary_recommendation,
        "summaryTopicId": summary_topic_id,
        "microChallengeAvailable": mode == "learning",
        "conceptReEntry": reentry["refreshRequired"],
        "conceptRefreshPoints": reentry.get("keyPoints", []),
        "modeBadge": mode.title(),
        "learningStateBadge": STATE_LABELS.get(learning_state, "Understanding"),
        "nextDifficultyPrompt": next_difficulty_prompt,
        "sourceType": answer_bundle["sourceType"],
        "fallbackReason": answer_bundle.get("fallbackReason"),
        "confidence": answer_bundle["confidence"],
    }

    insert_result = await db[CHATBOT_MESSAGES_COLLECTION].insert_one(message_doc)
    await db[CHATBOT_SESSIONS_COLLECTION].update_one(
        {"studentId": payload["studentId"]},
        {
            "$set": {
                "studentId": payload["studentId"],
                "lastMode": mode,
                "lastLearningState": learning_state,
                "lastTopic": topic_name,
                "updatedAt": created_at,
            },
            "$inc": {"messageCount": 1},
            "$setOnInsert": {"createdAt": created_at},
        },
        upsert=True,
    )
    await _update_student_learning_state(payload["studentId"], learning_state, topic_name, created_at)
    await _touch_learned_topic(payload["studentId"], topic_doc, created_at)
    await _recalculate_understanding_score(payload["studentId"], topic_id)

    saved_doc = await db[CHATBOT_MESSAGES_COLLECTION].find_one({"_id": insert_result.inserted_id})
    return _serialize_message(saved_doc)


async def askChatbot(payload: dict[str, Any]) -> dict[str, Any]:
    return await ask_chatbot(payload)


async def get_chatbot_history(student_id: str) -> list[dict[str, Any]]:
    db = get_db()
    cursor = db[CHATBOT_MESSAGES_COLLECTION].find({"studentId": student_id}).sort("createdAt", 1)
    history = []
    async for doc in cursor:
        history.append(_serialize_message(doc))
    return history


async def clear_chatbot_history(student_id: str) -> dict[str, Any]:
    db = get_db()
    deleted_messages = await db[CHATBOT_MESSAGES_COLLECTION].delete_many({"studentId": student_id})
    deleted_sessions = await db[CHATBOT_SESSIONS_COLLECTION].delete_many({"studentId": student_id})
    deleted_states = await db[STUDENT_LEARNING_STATES_COLLECTION].delete_many({"studentId": student_id})

    return {
        "studentId": student_id,
        "deletedMessages": deleted_messages.deleted_count,
        "deletedSessions": deleted_sessions.deleted_count,
        "deletedLearningStates": deleted_states.deleted_count,
    }


async def get_chatbot_topics() -> list[dict[str, Any]]:
    db = get_db()
    topics = []
    cursor = db[ICT_SYLLABUS_TOPICS_COLLECTION].find().sort([("sortOrder", 1), ("topicName", 1)])
    async for doc in cursor:
        topics.append(
            {
                "topicId": doc["topicId"],
                "topicName": doc["topicName"],
                "prerequisites": doc.get("prerequisiteLabels", doc.get("prerequisites", [])),
                "sourceType": doc.get("sourceType", "syllabus"),
                "questionCount": len(doc.get("questionBank", [])),
            }
        )
        if len(topics) >= TOPIC_OPTION_LIMIT:
            break
    return topics


async def get_micro_challenge(payload: dict[str, Any]) -> dict[str, Any]:
    mode = _resolve_mode(payload.get("selectedMode"), detect_intent(payload["question"]))
    if mode == "exam":
      return {
            "shouldOfferChallenge": False,
            "prompt": "Exam mode is active, so the chatbot will answer directly.",
            "topicId": None,
            "topicName": None,
            "challenge": None,
            "summaryTopicId": None,
        }

    topic_doc = await _resolve_topic_context(payload.get("currentTopic"), payload["question"])
    challenge = await _pick_micro_challenge(payload["studentId"], topic_doc)
    if not challenge:
        return {
            "shouldOfferChallenge": False,
            "prompt": "No prerequisite challenge is available for this topic right now.",
            "topicId": topic_doc["topicId"] if topic_doc else None,
            "topicName": topic_doc["topicName"] if topic_doc else None,
            "challenge": None,
            "summaryTopicId": topic_doc["topicId"] if topic_doc else None,
        }

    return {
        "shouldOfferChallenge": True,
        "prompt": "Do you want to try a quick challenge before the answer?",
        "topicId": challenge["topicId"],
        "topicName": challenge["topicName"],
        "challenge": _serialize_micro_challenge(challenge),
        "summaryTopicId": challenge["topicId"],
    }


async def check_micro_challenge(payload: dict[str, Any]) -> dict[str, Any]:
    db = get_db()
    challenge = await db[MICRO_CHALLENGES_COLLECTION].find_one({"challengeId": payload["challengeId"]})
    if not challenge:
        return {
            "challengeId": payload["challengeId"],
            "isCorrect": False,
            "feedback": "Challenge not found.",
            "explanation": "The requested micro-challenge is unavailable.",
            "summaryRecommendation": None,
            "summaryTopicId": None,
            "nextDifficultyLevel": 1,
        }

    challenge = _ensure_meaningful_mcq_options(dict(challenge))
    is_correct = _normalize_text(payload["selectedAnswer"]) == _normalize_text(challenge["correctAnswer"])
    created_at = _utc_now()

    await db[MICRO_CHALLENGE_ATTEMPTS_COLLECTION].insert_one(
        {
            "studentId": payload["studentId"],
            "challengeId": challenge["challengeId"],
            "topicId": challenge["topicId"],
            "topicName": challenge["topicName"],
            "selectedAnswer": payload["selectedAnswer"],
            "correctAnswer": challenge["correctAnswer"],
            "isCorrect": is_correct,
            "createdAt": created_at,
        }
    )

    await _touch_learned_topic(payload["studentId"], challenge, created_at)
    await _recalculate_understanding_score(payload["studentId"], challenge["topicId"])

    return {
        "challengeId": challenge["challengeId"],
        "isCorrect": is_correct,
        "feedback": "Correct. You are ready to continue." if is_correct else "Seems like you need a quick revision.",
        "explanation": challenge["explanation"],
        "summaryRecommendation": None if is_correct else "View Summary",
        "summaryTopicId": None if is_correct else challenge["topicId"],
        "nextDifficultyLevel": 2 if is_correct else 1,
    }


async def get_lesson_summary(topic_id: str) -> dict[str, Any] | None:
    db = get_db()
    summary = await db[LESSON_SUMMARIES_COLLECTION].find_one({"topicId": topic_id})
    if not summary:
        return None
    return _serialize_summary(summary)


async def get_login_quiz(student_id: str) -> dict[str, Any]:
    db = get_db()
    topics = [doc async for doc in db[LEARNED_TOPICS_COLLECTION].find({"studentId": student_id})]
    if not topics:
        seed_topics = [doc async for doc in db[ICT_SYLLABUS_TOPICS_COLLECTION].find().sort("sortOrder", 1).limit(5)]
        if not seed_topics:
            return {
                "quizId": f"quiz_{student_id}_{int(_utc_now().timestamp())}",
                "studentId": student_id,
                "shouldShowQuiz": False,
                "message": "No reinforcement quiz is available yet.",
                "questions": [],
                "weakTopics": [],
            }
        quiz_questions = [_build_quiz_question(topic, "warm_up") for topic in seed_topics if _build_quiz_question(topic, "warm_up")]
        quiz_id = f"quiz_{student_id}_{int(_utc_now().timestamp())}"
        await db[LOGIN_QUIZ_ATTEMPTS_COLLECTION].insert_one(
            {
                "quizId": quiz_id,
                "studentId": student_id,
                "questions": quiz_questions[:5],
                "createdAt": _utc_now(),
                "status": "generated",
                "weakTopics": [question["topicName"] for question in quiz_questions[:5]],
            }
        )
        return {
            "quizId": quiz_id,
            "studentId": student_id,
            "shouldShowQuiz": True,
            "message": "Start with a short warm-up quiz before continuing.",
            "questions": quiz_questions[:5],
            "weakTopics": [question["topicName"] for question in quiz_questions[:5]],
        }

    prioritized_topics = sorted(topics, key=_reinforcement_priority, reverse=True)
    quiz_source_topics = [topic for topic in prioritized_topics if _reinforcement_priority(topic) > 0][:10]
    if not quiz_source_topics:
        return {
            "quizId": f"quiz_{student_id}_{int(_utc_now().timestamp())}",
            "studentId": student_id,
            "shouldShowQuiz": False,
            "message": "No revision quiz is required today.",
            "questions": [],
            "weakTopics": [],
        }

    question_topics = []
    for learned_topic in quiz_source_topics:
        topic_doc = await db[ICT_SYLLABUS_TOPICS_COLLECTION].find_one({"topicId": learned_topic["topicId"]})
        if topic_doc:
            question_topics.append((topic_doc, _priority_label(learned_topic)))

    questions = []
    for topic_doc, priority in question_topics:
        question = _build_quiz_question(topic_doc, priority)
        if question:
            questions.append(question)
        if len(questions) >= 10:
            break

    quiz_id = f"quiz_{student_id}_{int(_utc_now().timestamp())}"
    await db[LOGIN_QUIZ_ATTEMPTS_COLLECTION].insert_one(
        {
            "quizId": quiz_id,
            "studentId": student_id,
            "questions": questions,
            "createdAt": _utc_now(),
            "status": "generated",
            "weakTopics": [question["topicName"] for question in questions],
        }
    )
    return {
        "quizId": quiz_id,
        "studentId": student_id,
        "shouldShowQuiz": True,
        "message": "Here is your forgetting-curve revision quiz.",
        "questions": questions,
        "weakTopics": [question["topicName"] for question in questions],
    }


async def submit_login_quiz(payload: dict[str, Any]) -> dict[str, Any]:
    db = get_db()
    quiz_doc = await db[LOGIN_QUIZ_ATTEMPTS_COLLECTION].find_one({"quizId": payload["quizId"], "studentId": payload["studentId"]})
    if not quiz_doc:
        return {
            "quizId": payload["quizId"],
            "score": 0,
            "totalQuestions": 0,
            "correctAnswers": 0,
            "recommendation": "Quiz session not found.",
            "recommendedTopics": [],
        }

    answers_by_id = {answer.get("questionId"): answer.get("selectedAnswer") for answer in payload.get("answers", [])}
    correct_answers = 0
    topic_scores: dict[str, list[int]] = {}
    for question in quiz_doc.get("questions", []):
        is_correct = _normalize_text(answers_by_id.get(question["questionId"], "")) == _normalize_text(question["correctAnswer"])
        correct_answers += 1 if is_correct else 0
        topic_scores.setdefault(question["topicId"], []).append(100 if is_correct else 0)

    total_questions = len(quiz_doc.get("questions", []))
    score = round((correct_answers / total_questions) * 100, 2) if total_questions else 0
    recommended_topics = [question["topicName"] for question in quiz_doc.get("questions", []) if _normalize_text(answers_by_id.get(question["questionId"], "")) != _normalize_text(question["correctAnswer"])]

    await db[LOGIN_QUIZ_ATTEMPTS_COLLECTION].update_one(
        {"_id": quiz_doc["_id"]},
        {
            "$set": {
                "submittedAt": _utc_now(),
                "status": "skipped" if payload.get("skipped") else "submitted",
                "score": score,
                "answers": payload.get("answers", []),
                "recommendedTopics": recommended_topics,
            }
        },
    )

    for topic_id, scores in topic_scores.items():
        avg_score = round(sum(scores) / len(scores), 2)
        await db[LEARNED_TOPICS_COLLECTION].update_one(
            {"studentId": payload["studentId"], "topicId": topic_id},
            {
                "$set": {
                    "lastAccessedAt": _utc_now(),
                    "quizScore": avg_score,
                    "reinforcementLevel": _reinforcement_level_from_score(avg_score),
                    "nextReviewDate": _next_review_date(avg_score),
                },
                "$setOnInsert": {
                    "topicName": topic_id.replace("_", " ").title(),
                    "firstLearnedAt": _utc_now(),
                },
            },
            upsert=True,
        )
        await _recalculate_understanding_score(payload["studentId"], topic_id)

    recommendation = (
        "Strong recall. Future reinforcement frequency can be reduced."
        if score >= 75
        else "Revision recommended for the weak topics before moving on."
    )
    return {
        "quizId": payload["quizId"],
        "score": score,
        "totalQuestions": total_questions,
        "correctAnswers": correct_answers,
        "recommendation": recommendation,
        "recommendedTopics": recommended_topics[:5],
    }


async def check_concept_reentry(payload: dict[str, Any], persist_log: bool = False) -> dict[str, Any]:
    db = get_db()
    topic_doc = await db[ICT_SYLLABUS_TOPICS_COLLECTION].find_one({"topicId": payload["topicId"]})
    topic_name = topic_doc["topicName"] if topic_doc else payload["topicId"]
    learned = await db[LEARNED_TOPICS_COLLECTION].find_one(
        {"studentId": payload["studentId"], "topicId": payload["topicId"]}
    )

    refresh_required = False
    if learned and learned.get("lastAccessedAt"):
        last_accessed = learned["lastAccessedAt"]
        refresh_required = (_utc_now() - _as_utc_naive(last_accessed)) > timedelta(days=5)

    response = {
        "refreshRequired": refresh_required,
        "topicId": payload["topicId"],
        "topicName": topic_name,
        "keyPoints": topic_doc.get("keyPoints", [])[:3] if topic_doc else [],
        "prerequisites": topic_doc.get("prerequisiteLabels", topic_doc.get("prerequisites", []))[:3] if topic_doc else [],
        "message": "Let's do a quick refresh before continuing." if refresh_required else "You can continue with the current topic.",
    }

    if persist_log:
        await db[CONCEPT_REENTRY_LOGS_COLLECTION].insert_one(
            {
                "studentId": payload["studentId"],
                "topicId": payload["topicId"],
                "topicName": topic_name,
                "refreshRequired": refresh_required,
                "currentQuestion": payload.get("currentQuestion"),
                "createdAt": _utc_now(),
            }
        )

    return response


async def check_repeated_query(payload: dict[str, Any], persist_alert: bool = False) -> dict[str, Any]:
    db = get_db()
    topic_name = payload.get("currentTopic") or "General O/L ICT"
    question = payload["question"]
    question_fingerprint = _question_fingerprint(question)
    recent_messages = [
        doc
        async for doc in db[CHATBOT_MESSAGES_COLLECTION]
        .find({"studentId": payload["studentId"], "topic": topic_name})
        .sort("createdAt", -1)
        .limit(8)
    ]

    repeated_examples = []
    repeated_count = 1
    for doc in recent_messages:
        similarity = _question_similarity(question, doc.get("question", ""))
        previous_fingerprint = _question_fingerprint(doc.get("question", ""))
        if similarity >= 0.5 or (question_fingerprint and question_fingerprint == previous_fingerprint):
            repeated_count += 1
            repeated_examples.append(doc.get("question", ""))

    repeated_query_status = (
        "alert"
        if repeated_count >= 3
        else "watch"
        if repeated_count == 2
        else "normal"
    )

    alert_created = False
    if persist_alert and repeated_count >= 3:
        student_name = await _lookup_student_name(payload["studentId"])
        await db[REPEATED_QUERY_ALERTS_COLLECTION].update_one(
            {"studentId": payload["studentId"], "topic": topic_name, "status": "active"},
            {
                "$set": {
                    "studentId": payload["studentId"],
                    "studentName": student_name,
                    "topic": topic_name,
                    "updatedAt": _utc_now(),
                },
                "$setOnInsert": {"createdAt": _utc_now(), "status": "active"},
                "$inc": {"repeatedQuestionCount": 1},
                "$addToSet": {"exampleQuestions": {"$each": [question, *repeated_examples[:2]]}},
            },
            upsert=True,
        )
        alert_created = True

    return {
        "repeatedQueryStatus": repeated_query_status,
        "repeatedQueryCount": repeated_count,
        "alertCreated": alert_created,
        "topic": topic_name,
        "exampleQuestions": [question, *repeated_examples[:2]],
    }


async def get_repeated_query_alerts() -> list[dict[str, Any]]:
    db = get_db()
    alerts = []
    cursor = db[REPEATED_QUERY_ALERTS_COLLECTION].find().sort("updatedAt", -1)
    async for doc in cursor:
        alerts.append(
            {
                "id": str(doc["_id"]),
                "studentId": doc["studentId"],
                "studentName": doc.get("studentName", "Student"),
                "topic": doc["topic"],
                "repeatedQuestionCount": doc.get("repeatedQuestionCount", 0),
                "exampleQuestions": doc.get("exampleQuestions", [])[:4],
                "createdAt": doc.get("createdAt") or doc.get("updatedAt"),
                "status": doc.get("status", "active"),
            }
        )
    return alerts


async def get_student_analytics(student_id: str) -> dict[str, Any]:
    db = get_db()
    score_docs = [
        doc
        async for doc in db[STUDENT_UNDERSTANDING_SCORES_COLLECTION]
        .find({"studentId": student_id})
        .sort("updatedAt", -1)
    ]
    if not score_docs:
        return {
            "studentId": student_id,
            "studentName": await _lookup_student_name(student_id),
            "understandingScores": [],
            "averageScore": 0,
            "weakTopics": [],
            "recommendedRevisionTopics": [],
        }

    average_score = round(sum(doc["understandingScore"] for doc in score_docs) / len(score_docs), 2)
    weak_topics = [doc["topicName"] for doc in score_docs if doc["understandingScore"] < 60]
    return {
        "studentId": student_id,
        "studentName": await _lookup_student_name(student_id),
        "understandingScores": [_serialize_understanding_score(doc) for doc in score_docs],
        "averageScore": average_score,
        "weakTopics": weak_topics,
        "recommendedRevisionTopics": weak_topics[:5],
    }


async def get_topic_analytics(topic_id: str) -> dict[str, Any]:
    db = get_db()
    docs = [
        doc
        async for doc in db[STUDENT_UNDERSTANDING_SCORES_COLLECTION]
        .find({"topicId": topic_id})
        .sort("updatedAt", -1)
    ]
    if not docs:
        summary = await db[LESSON_SUMMARIES_COLLECTION].find_one({"topicId": topic_id})
        return {
            "topicId": topic_id,
            "topicName": summary["topicName"] if summary else topic_id,
            "averageScore": 0,
            "students": [],
        }

    average_score = round(sum(doc["understandingScore"] for doc in docs) / len(docs), 2)
    return {
        "topicId": topic_id,
        "topicName": docs[0]["topicName"],
        "averageScore": average_score,
        "students": [_serialize_understanding_score(doc) for doc in docs],
    }


async def get_teacher_dashboard() -> dict[str, Any]:
    db = get_db()
    score_docs = [doc async for doc in db[STUDENT_UNDERSTANDING_SCORES_COLLECTION].find()]
    alert_docs = await get_repeated_query_alerts()
    quiz_docs = [
        doc
        async for doc in db[LOGIN_QUIZ_ATTEMPTS_COLLECTION]
        .find({"status": "submitted"})
        .sort("submittedAt", -1)
    ]
    challenge_docs = [doc async for doc in db[MICRO_CHALLENGE_ATTEMPTS_COLLECTION].find()]
    state_docs = [doc async for doc in db[CHATBOT_MESSAGES_COLLECTION].find().sort("createdAt", -1).limit(200)]

    topic_scores: dict[str, list[float]] = {}
    student_scores: dict[str, list[float]] = {}
    for doc in score_docs:
        topic_scores.setdefault(doc["topicName"], []).append(doc["understandingScore"])
        student_scores.setdefault(doc["studentId"], []).append(doc["understandingScore"])

    topic_bar = [
        {
            "topic": topic,
            "score": round(sum(scores) / len(scores), 2),
        }
        for topic, scores in sorted(topic_scores.items())
    ]
    student_table = []
    for student_id, scores in student_scores.items():
        avg = round(sum(scores) / len(scores), 2)
        student_table.append(
            {
                "studentId": student_id,
                "studentName": await _lookup_student_name(student_id),
                "understandingScore": avg,
                "weakTopics": [doc["topicName"] for doc in score_docs if doc["studentId"] == student_id and doc["understandingScore"] < 60][:3],
            }
        )

    learning_state_map: dict[str, int] = {}
    for doc in state_docs:
        label = STATE_LABELS.get(doc.get("learningState", "understanding"), "Understanding")
        learning_state_map[label] = learning_state_map.get(label, 0) + 1

    progress_series = [
        {
            "date": (_utc_now() - timedelta(days=offset)).strftime("%Y-%m-%d"),
            "score": round(
                sum(doc["score"] for doc in quiz_docs if doc.get("submittedAt") and _as_utc_naive(doc["submittedAt"]).date() == (_utc_now() - timedelta(days=offset)).date())
                / max(1, len([doc for doc in quiz_docs if doc.get("submittedAt") and _as_utc_naive(doc["submittedAt"]).date() == (_utc_now() - timedelta(days=offset)).date()])),
                2,
            )
            if quiz_docs
            else 0,
        }
        for offset in range(6, -1, -1)
    ]

    weak_topics = [item for item in topic_bar if item["score"] < 60]
    micro_accuracy = round(
        (sum(1 for doc in challenge_docs if doc.get("isCorrect")) / len(challenge_docs)) * 100,
        2,
    ) if challenge_docs else 0

    return {
        "topicBarChart": topic_bar,
        "progressLineChart": progress_series,
        "learningStatePieChart": [
            {"label": label, "value": value} for label, value in learning_state_map.items()
        ],
        "weakStudents": sorted(student_table, key=lambda item: item["understandingScore"])[:8],
        "repeatedQueryAlerts": alert_docs[:10],
        "microChallengePerformance": {
            "attempts": len(challenge_docs),
            "accuracy": micro_accuracy,
        },
        "loginQuizResults": [
            {
                "quizId": doc["quizId"],
                "studentId": doc["studentId"],
                "studentName": await _lookup_student_name(doc["studentId"]),
                "score": doc.get("score", 0),
                "submittedAt": doc.get("submittedAt"),
            }
            for doc in quiz_docs[:8]
        ],
        "weakTopics": weak_topics[:8],
        "recommendedRevisionTopics": [item["topic"] for item in weak_topics[:6]],
    }


async def get_report_file(format_name: str, student_id: str | None = None, topic_id: str | None = None) -> dict[str, Any]:
    format_name = format_name.lower()
    analytics_payload = (
        await get_student_analytics(student_id) if student_id
        else await get_topic_analytics(topic_id) if topic_id
        else await get_teacher_dashboard()
    )
    created_at = _utc_now()

    if format_name == "csv":
        stream = io.StringIO()
        writer = csv.writer(stream)
        writer.writerow(["Generated At", created_at.isoformat()])
        if student_id:
            writer.writerow(["Student", analytics_payload["studentName"]])
            writer.writerow(["Topic", "Understanding %", "Weak Areas", "Revision"])
            for item in analytics_payload.get("understandingScores", []):
                writer.writerow(
                    [
                        item["topicName"],
                        item["understandingScore"],
                        ", ".join(item.get("weakAreas", [])),
                        item["recommendation"],
                    ]
                )
        elif topic_id:
            writer.writerow(["Topic", analytics_payload["topicName"]])
            writer.writerow(["Student", "Understanding %", "Recommendation"])
            for item in analytics_payload.get("students", []):
                writer.writerow(
                    [item["studentName"], item["understandingScore"], item["recommendation"]]
                )
        else:
            writer.writerow(["Topic", "Score"])
            for item in analytics_payload.get("topicBarChart", []):
                writer.writerow([item["topic"], item["score"]])
        content = stream.getvalue().encode("utf-8")
        filename = f"analytics-report-{created_at.strftime('%Y%m%d%H%M%S')}.csv"
        media_type = "text/csv"
    else:
        lines = [
            "SignLearn AI Analytics Report",
            f"Generated at: {created_at.isoformat()}",
        ]
        if student_id:
            lines.append(f"Student: {analytics_payload['studentName']}")
            for item in analytics_payload.get("understandingScores", []):
                lines.append(
                    f"{item['topicName']}: {item['understandingScore']}% - {item['recommendation']}"
                )
        elif topic_id:
            lines.append(f"Topic: {analytics_payload['topicName']}")
            for item in analytics_payload.get("students", [])[:12]:
                lines.append(
                    f"{item['studentName']}: {item['understandingScore']}%"
                )
        else:
            lines.append("Teacher Dashboard Snapshot")
            for item in analytics_payload.get("topicBarChart", [])[:12]:
                lines.append(f"{item['topic']}: {item['score']}%")
        content = _generate_simple_pdf(lines)
        filename = f"analytics-report-{created_at.strftime('%Y%m%d%H%M%S')}.pdf"
        media_type = "application/pdf"

    await get_db()[TEACHER_ANALYTICS_REPORTS_COLLECTION].insert_one(
        {
            "format": format_name,
            "studentId": student_id,
            "topicId": topic_id,
            "filename": filename,
            "createdAt": created_at,
        }
    )

    return {"content": content, "filename": filename, "mediaType": media_type}


async def _generate_answer_bundle(
    question: str,
    mode: str,
    intent: str,
    learning_state: str,
    topic_doc: dict[str, Any] | None,
    prerequisites: list[str],
    difficulty_level: int,
    refresh_points: list[str],
    prompt: str,
    repeated_query_count: int = 1,
) -> dict[str, Any]:
    fallback_reason = None

    try:
        llm_result = await callLLMApi(
            question=question,
            mode=mode,
            intent=intent,
            learningState=learning_state,
            topic_doc=topic_doc,
            prerequisites=prerequisites,
            refresh_points=refresh_points,
            prompt=prompt,
        )
        answer = _normalize_whitespace(llm_result["answer"])
        if mode == "exam":
            answer = formatExamAnswer(answer, _build_key_terms(topic_doc))
        else:
            answer = formatLearningAnswer(
                answer=answer,
                learning_state=learning_state,
                example=_select_topic_example(topic_doc),
                prerequisites=prerequisites,
                refresh_points=refresh_points,
                allow_prefix=False,
            )
        return {
            "answer": answer,
            "sourceType": "LLM",
            "fallbackReason": None,
            "confidence": _estimate_answer_confidence(
                source_type="LLM",
                topic_doc=topic_doc,
                repeated_query_count=repeated_query_count,
                learning_state=learning_state,
                fallback_reason=None,
            ),
        }
    except LLMApiError as exc:
        fallback_reason = exc.safe_reason
        _log_local_fallback(fallback_reason, mode, topic_doc)

    return {
        "answer": generateLocalFallbackAnswer(
            question=question,
            mode=mode,
            learning_state=learning_state,
            topic_doc=topic_doc,
            prerequisites=prerequisites,
            difficulty_level=difficulty_level,
            refresh_points=refresh_points,
        ),
        "sourceType": "LOCAL_DATASET",
        "fallbackReason": fallback_reason,
        "confidence": _estimate_answer_confidence(
            source_type="LOCAL_DATASET",
            topic_doc=topic_doc,
            repeated_query_count=repeated_query_count,
            learning_state=learning_state,
            fallback_reason=fallback_reason,
        ),
    }


def detectIntent(question: str) -> str:
    lowered = question.lower()
    learning_score = sum(1 for keyword in LEARNING_KEYWORDS if keyword in lowered)
    exam_score = sum(1 for keyword in EXAM_KEYWORDS if keyword in lowered)
    return "exam" if exam_score >= max(1, learning_score) else "learning"


def detect_intent(question: str) -> str:
    return detectIntent(question)


async def detectTopic(question: str, currentTopic: str | None = None) -> dict[str, Any] | None:
    return await _resolve_topic_context(currentTopic, question)


def getPrerequisites(requested: list[str], topic_doc: dict[str, Any] | None) -> list[str]:
    return _merge_prerequisites(
        requested,
        topic_doc.get("prerequisiteLabels", topic_doc.get("prerequisites", [])) if topic_doc else [],
    )


async def callLLMApi(
    *,
    question: str,
    mode: str,
    intent: str,
    learningState: str,
    topic_doc: dict[str, Any] | None,
    prerequisites: list[str],
    refresh_points: list[str],
    prompt: str,
) -> dict[str, Any]:
    provider = str(settings.LLM_PROVIDER or "").strip().lower()
    api_key = str(settings.LLM_API_KEY or "").strip()
    model = str(settings.LLM_MODEL or "").strip()
    timeout_ms = max(1000, int(settings.LLM_TIMEOUT_MS or 10000))

    if not provider:
        raise LLMApiError("llm_provider_missing")
    if provider != "ollama" and not api_key:
        raise LLMApiError("api_key_missing")
    if not model:
        raise LLMApiError("llm_model_missing")

    candidate_models = [model]
    if provider == "gemini":
        for fallback_m in ["gemini-flash-lite-latest", "gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"]:
            if fallback_m not in candidate_models:
                candidate_models.append(fallback_m)

    last_error = None
    for cur_model in candidate_models:
        url, headers, body = _build_llm_request(
            provider=provider,
            api_key=api_key,
            model=cur_model,
            prompt=prompt,
            question=question,
            mode=mode,
            intent=intent,
            learning_state=learningState,
            topic_doc=topic_doc,
            prerequisites=prerequisites,
            refresh_points=refresh_points,
        )

        for attempt in range(2):
            try:
                payload = await asyncio.to_thread(
                    _post_json_request,
                    url,
                    headers,
                    body,
                    timeout_ms,
                )
                answer = _extract_llm_answer(provider, payload)
                if not answer.strip():
                    raise LLMApiError("invalid_llm_response")
                return {
                    "answer": answer,
                    "provider": provider,
                    "model": cur_model,
                }
            except LLMApiError as exc:
                last_error = exc
                if exc.safe_reason in ("quota_exceeded", "provider_server_error"):
                    break
                if attempt == 0 and exc.safe_reason in LLM_RETRYABLE_REASONS:
                    continue
                break
            except Exception as exc:
                last_error = LLMApiError("invalid_llm_response")
                if attempt == 0:
                    continue
                break

    raise last_error or LLMApiError("invalid_llm_response")


def generateLocalFallbackAnswer(
    *,
    question: str,
    mode: str,
    learning_state: str,
    topic_doc: dict[str, Any] | None,
    prerequisites: list[str],
    difficulty_level: int,
    refresh_points: list[str],
) -> str:
    if not topic_doc:
        return _build_unknown_topic_answer()

    related_question = _find_best_question_bank_match(question, topic_doc)
    supporting_sentence = _find_best_supporting_sentence(question, topic_doc, related_question)
    simple_definition = _select_simple_definition(topic_doc, related_question, supporting_sentence)
    example = _select_topic_example(topic_doc, supporting_sentence)
    key_terms = _build_key_terms(topic_doc)

    if mode == "exam":
        exam_answer = simple_definition
        if related_question and related_question.get("answer"):
            exam_answer = _clean_sentence(related_question["answer"])
        return formatExamAnswer(exam_answer, key_terms)

    return formatLearningAnswer(
        answer=simple_definition,
        learning_state=learning_state,
        example=example,
        prerequisites=prerequisites,
        refresh_points=refresh_points,
        key_points=_clean_list_points((topic_doc.get("keyPoints") or topic_doc.get("subtopics", []))[:3]),
        topic_name=topic_doc.get("topicName"),
        difficulty_level=difficulty_level,
    )


def generateEARAPrompt(
    question: str,
    intent: str,
    learningState: str,
    topic: str,
    prerequisites: list[str],
) -> str:
    prerequisites_text = ", ".join(prerequisites) if prerequisites else "none"
    return (
        f"Student question: {question}\n"
        f"Detected intent: {intent}\n"
        f"Learning state: {learningState}\n"
        f"Topic: {topic}\n"
        f"Prerequisites: {prerequisites_text}\n"
        "Adapt the answer to O/L ICT level. Use emotion-aware explanation style, mention prerequisite knowledge when helpful, compress answers in exam mode, and prefer revision support when the learner is struggling. If the learning state is not_understanding, use very simple words, short gentle sentences, and one small example."
    )


def generateAdaptivePrompt(
    question: str,
    mode: str,
    learningState: str,
    topic: str,
    prerequisites: list[str],
) -> str:
    """Backward-compatible alias used by the older chatbot module."""
    return generateEARAPrompt(question, mode, learningState, topic, prerequisites)


def formatExamAnswer(answer: str, key_terms: list[str] | None = None) -> str:
    concise_answer = _ensure_sentence(answer)
    if not key_terms:
        return concise_answer
    return f"{concise_answer} Key terms: {', '.join(key_terms[:3])}."


def formatLearningAnswer(
    *,
    answer: str,
    learning_state: str,
    example: str | None = None,
    prerequisites: list[str] | None = None,
    refresh_points: list[str] | None = None,
    key_points: list[str] | None = None,
    topic_name: str | None = None,
    difficulty_level: int | None = None,
    allow_prefix: bool = True,
) -> str:
    prerequisites = prerequisites or []
    refresh_points = refresh_points or []
    key_points = key_points or []
    answer = _ensure_sentence(answer)
    intro = ""
    if allow_prefix:
        intro = {
            "not_understanding": "No worries. Let's make this simple. ",
            "bored": "Let's make this practical. ",
            "distracted": "Quick focus answer. ",
            "understanding": "",
        }.get(learning_state, "")

    parts = []
    if prerequisites:
        parts.append(f"Before this, remember {', '.join(prerequisites[:2])}.")
    parts.append(f"{intro}{answer}".strip())

    if learning_state == "distracted":
        if key_points:
            parts.append("Key points: " + "; ".join(key_points[:2]) + ".")
        if example:
            parts.append(f"Example: {_ensure_sentence(example)}")
        return " ".join(parts)

    if learning_state == "not_understanding":
        if key_points:
            parts.append(_build_gentle_step_line(key_points))
        if example:
            parts.append(f"Small example: {_ensure_sentence(example)}")
        if refresh_points:
            parts.append("Quick reminder: " + "; ".join(_clean_list_points(refresh_points[:2])) + ".")
        return " ".join(parts)

    if learning_state == "bored" and example:
        parts.append(f"Interesting example: {_ensure_sentence(example)}")
    elif example:
        parts.append(f"Example: {_ensure_sentence(example)}")

    if refresh_points:
        parts.append("Quick reminder: " + "; ".join(_clean_list_points(refresh_points[:3])) + ".")
    if key_points and learning_state != "bored":
        parts.append("Main points: " + "; ".join(key_points[:3]) + ".")
    if topic_name and difficulty_level:
        parts.append(f"Difficulty level: {DIFFICULTY_LABELS.get(difficulty_level, 'Basic definition')}.")
    return " ".join(parts)


def _build_llm_request(
    *,
    provider: str,
    api_key: str,
    model: str,
    prompt: str,
    question: str,
    mode: str,
    intent: str,
    learning_state: str,
    topic_doc: dict[str, Any] | None,
    prerequisites: list[str],
    refresh_points: list[str],
) -> tuple[str, dict[str, str], dict[str, Any]]:
    topic_name = topic_doc["topicName"] if topic_doc else "General O/L ICT"
    if provider == "ollama":
        user_prompt = (
            f"Question: {question}\n"
            f"Topic: {topic_name}\n"
            f"Mode: {mode}\n"
            "Instructions: Answer in 2-3 clear, simple sentences for a Sri Lankan O/L ICT student in plain text."
        )
    else:
        user_prompt = _build_llm_user_prompt(
            prompt=prompt,
            question=question,
            mode=mode,
            intent=intent,
            learning_state=learning_state,
            topic_doc=topic_doc,
            prerequisites=prerequisites,
            refresh_points=refresh_points,
        )

    if provider == "openai":
        return (
            "https://api.openai.com/v1/responses",
            {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            {
                "model": model,
                "instructions": (
                    "You are SignLearn AI. Answer for a Sri Lankan O/L ICT student. "
                    f"Stay on the topic {topic_name}, avoid unsupported facts, and keep the tone kind."
                ),
                "input": user_prompt,
                "temperature": 0.4,
                "max_output_tokens": 220 if mode == "exam" else 420,
            },
        )

    if provider == "openrouter":
        return (
            "https://openrouter.ai/api/v1/chat/completions",
            {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            {
                "model": model,
                "temperature": 0.4,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are SignLearn AI. Answer for a Sri Lankan O/L ICT student, "
                            "use clean text only, and stay grounded in the provided lesson context."
                        ),
                    },
                    {"role": "user", "content": user_prompt},
                ],
            },
        )

    if provider == "gemini":
        return (
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
            {
                "Content-Type": "application/json",
            },
            {
                "system_instruction": {
                    "parts": [
                        {
                            "text": (
                                "You are SignLearn AI. Answer for a Sri Lankan O/L ICT student. "
                                "Use only the given context where possible, and keep the tone supportive."
                            )
                        }
                    ]
                },
                "contents": [{"parts": [{"text": user_prompt}]}],
                "generationConfig": {
                    "temperature": 0.4,
                    "maxOutputTokens": 400 if mode == "exam" else 800,
                },
            },
        )

    if provider == "ollama":
        ollama_base = getattr(settings, "OLLAMA_BASE_URL", "http://127.0.0.1:11434")
        return (
            f"{ollama_base}/api/generate",
            {
                "Content-Type": "application/json",
            },
            {
                "model": model,
                "prompt": user_prompt,
                "system": (
                    "You are SignLearn AI. Answer for a Sri Lankan O/L ICT student. "
                    "Use clean plain text only, keep explanations direct and concise, and stay grounded in the O/L ICT curriculum."
                ),
                "stream": False,
                "options": {
                    "temperature": 0.2,
                    "num_predict": 180 if mode == "exam" else 250,
                },
            },
        )

    raise LLMApiError("unsupported_llm_provider")


def _build_llm_user_prompt(
    *,
    prompt: str,
    question: str,
    mode: str,
    intent: str,
    learning_state: str,
    topic_doc: dict[str, Any] | None,
    prerequisites: list[str],
    refresh_points: list[str],
) -> str:
    topic_name = topic_doc["topicName"] if topic_doc else "General O/L ICT"
    summary = topic_doc.get("summary", "") if topic_doc else ""
    key_points = "; ".join(_clean_list_points((topic_doc.get("keyPoints") or topic_doc.get("subtopics", []))[:4])) if topic_doc else ""
    examples = "; ".join(_clean_list_points((topic_doc.get("examples") or [])[:2])) if topic_doc else ""
    exam_questions = "; ".join(topic_doc.get("examQuestions", [])[:2]) if topic_doc else ""
    reference_sentences = "; ".join(_clean_list_points(topic_doc.get("referenceSentences", [])[:3])) if topic_doc else ""
    prerequisites_text = ", ".join(prerequisites[:3]) if prerequisites else "none"
    refresh_text = "; ".join(_clean_list_points(refresh_points[:3])) if refresh_points else "none"

    return (
        f"{prompt}\n"
        f"Question: {question}\n"
        f"Mode: {mode}\n"
        f"Intent: {intent}\n"
        f"Learning state: {learning_state}\n"
        f"Topic: {topic_name}\n"
        f"Prerequisites: {prerequisites_text}\n"
        f"Lesson summary: {summary or 'none'}\n"
        f"Key points: {key_points or 'none'}\n"
        f"Examples: {examples or 'none'}\n"
        f"Reference sentences: {reference_sentences or 'none'}\n"
        f"Exam questions: {exam_questions or 'none'}\n"
        f"Refresh points: {refresh_text}\n"
        "Instructions: answer in plain text only. "
        "If exam mode, keep it concise and marks-friendly. "
        "If the student is not understanding, use very simple step-by-step wording. "
        "If the student is distracted, keep it short. "
        "If the student is bored, make the answer example-based."
    )


def _post_json_request(
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
    try:
        with urllib_request.urlopen(request, timeout=timeout_ms / 1000) as response:
            payload = response.read().decode("utf-8")
            return json.loads(payload)
    except urllib_error.HTTPError as exc:
        payload = exc.read().decode("utf-8", errors="ignore")
        safe_reason = _map_http_error_reason(exc.code, payload)
        raise LLMApiError(safe_reason) from exc
    except urllib_error.URLError as exc:
        reason_text = _normalize_text(getattr(exc, "reason", ""))
        if "timed out" in reason_text or "timeout" in reason_text:
            raise LLMApiError("api_timeout") from exc
        raise LLMApiError("network_error") from exc
    except TimeoutError as exc:
        raise LLMApiError("api_timeout") from exc
    except json.JSONDecodeError as exc:
        raise LLMApiError("invalid_llm_response") from exc


def _extract_llm_answer(provider: str, payload: dict[str, Any]) -> str:
    if provider == "openai":
        return _normalize_whitespace(_extract_openai_response_text(payload))
    if provider == "openrouter":
        choices = payload.get("choices", [])
        content = (((choices[0] if choices else {}).get("message") or {}).get("content")) or ""
        return _normalize_whitespace(content)
    if provider == "gemini":
        return _normalize_whitespace(_extract_gemini_response_text(payload))
    if provider == "ollama":
        return _normalize_whitespace(str(payload.get("response") or ""))
    raise LLMApiError("unsupported_llm_provider")


def _extract_openai_response_text(payload: dict[str, Any]) -> str:
    if payload.get("output_text"):
        return str(payload["output_text"])

    output = payload.get("output", [])
    for item in output:
        if item.get("type") != "message":
            continue
        for content in item.get("content", []):
            text_value = content.get("text")
            if text_value:
                return str(text_value)
    return ""


def _extract_gemini_response_text(payload: dict[str, Any]) -> str:
    candidates = payload.get("candidates", [])
    for candidate in candidates:
        content = candidate.get("content", {})
        for part in content.get("parts", []):
            text_value = part.get("text")
            if text_value:
                return str(text_value)
    return ""


def _map_http_error_reason(status_code: int, payload: str) -> str:
    normalized = _normalize_text(payload)
    if status_code == 401 or status_code == 403:
        return "api_auth_error"
    if status_code == 408:
        return "api_timeout"
    if status_code == 429 or "quota" in normalized or "rate limit" in normalized:
        return "quota_exceeded"
    if status_code >= 500:
        return "provider_server_error"
    if "timeout" in normalized:
        return "api_timeout"
    return "invalid_llm_response"


def _estimate_answer_confidence(
    *,
    source_type: str,
    topic_doc: dict[str, Any] | None,
    repeated_query_count: int,
    learning_state: str,
    fallback_reason: str | None,
) -> float:
    score = 0.9 if source_type == "LLM" else 0.72
    if not topic_doc:
        score -= 0.24
    if repeated_query_count >= 3:
        score -= 0.08
    if learning_state in {"distracted", "not_understanding"}:
        score -= 0.05
    if fallback_reason in {"invalid_llm_response", "unsupported_llm_provider"}:
        score -= 0.07
    return round(max(0.1, min(0.99, score)), 2)


def _log_local_fallback(reason: str, mode: str, topic_doc: dict[str, Any] | None) -> None:
    LOGGER.warning(
        "Chatbot LLM fallback used",
        extra={
            "fallbackReason": reason,
            "mode": mode,
            "topicId": topic_doc.get("topicId") if topic_doc else None,
        },
    )


async def _ensure_indexes() -> None:
    db = get_db()
    await db[CHATBOT_MESSAGES_COLLECTION].create_index([("studentId", 1), ("createdAt", 1)])
    await db[CHATBOT_SESSIONS_COLLECTION].create_index("studentId", unique=True)
    await db[ICT_SYLLABUS_TOPICS_COLLECTION].create_index("topicId", unique=True)
    await db[ICT_SYLLABUS_TOPICS_COLLECTION].create_index("topicName")
    await db[STUDENT_LEARNING_STATES_COLLECTION].create_index("studentId", unique=True)
    await db[MICRO_CHALLENGES_COLLECTION].create_index("challengeId", unique=True)
    await db[LESSON_SUMMARIES_COLLECTION].create_index("topicId", unique=True)
    await db[LEARNED_TOPICS_COLLECTION].create_index([("studentId", 1), ("topicId", 1)], unique=True)
    await db[LOGIN_QUIZ_ATTEMPTS_COLLECTION].create_index("quizId", unique=True)
    await db[REPEATED_QUERY_ALERTS_COLLECTION].create_index([("studentId", 1), ("topic", 1), ("status", 1)])
    await db[CONCEPT_REENTRY_LOGS_COLLECTION].create_index([("studentId", 1), ("topicId", 1), ("createdAt", -1)])
    await db[STUDENT_UNDERSTANDING_SCORES_COLLECTION].create_index([("studentId", 1), ("topicId", 1)], unique=True)


async def _sync_knowledge_graph_topics(seeded_at: datetime) -> None:
    db = get_db()
    cursor = db[KNOWLEDGE_GRAPH_COLLECTION].find()
    async for concept in cursor:
        existing = await db[ICT_SYLLABUS_TOPICS_COLLECTION].find_one({"topicId": concept["conceptId"]})
        if existing:
            continue
        challenge_id = f"{concept['conceptId']}_mc_1"
        topic_doc = {
            "topicId": concept["conceptId"],
            "topicName": concept["conceptName"],
            "description": concept["description"],
            "summary": concept["description"],
            "keyPoints": concept.get("keywords", [])[:4],
            "subtopics": concept.get("keywords", [])[:4],
            "prerequisites": concept.get("prerequisites", []),
            "simpleDefinitions": [concept["description"]],
            "examples": [],
            "keywords": concept.get("keywords", []),
            "sampleQuestions": [question["questionText"] for question in concept.get("questions", [])[:2]],
            "examQuestions": [question["questionText"] for question in concept.get("questions", [])[2:4]],
            "microChallenges": [
                {
                    "challengeId": challenge_id,
                    "questionText": concept.get("questions", [{}])[0].get("questionText", f"What is {concept['conceptName']}?"),
                    "options": concept.get("questions", [{}])[0].get("options", ["Option A", "Option B", "Option C", "Option D"]),
                    "correctAnswer": concept.get("questions", [{}])[0].get("correctAnswer", "Option A"),
                    "explanation": concept.get("questions", [{}])[0].get("explanation", concept["description"]),
                    "difficultyLevel": 1,
                }
            ],
            "subject": "O/L ICT",
            "datasetVersion": "knowledge-graph-sync",
            "sortOrder": 1000,
            "updatedAt": seeded_at,
        }
        await db[ICT_SYLLABUS_TOPICS_COLLECTION].update_one(
            {"topicId": concept["conceptId"]},
            {"$set": topic_doc},
            upsert=True,
        )
        await db[LESSON_SUMMARIES_COLLECTION].update_one(
            {"topicId": concept["conceptId"]},
            {"$set": _summary_from_topic_doc(topic_doc)},
            upsert=True,
        )
        await db[MICRO_CHALLENGES_COLLECTION].update_one(
            {"challengeId": challenge_id},
            {
                "$set": {
                    **topic_doc["microChallenges"][0],
                    "topicId": concept["conceptId"],
                    "topicName": concept["conceptName"],
                    "prerequisites": concept.get("prerequisites", []),
                    "updatedAt": seeded_at,
                }
            },
            upsert=True,
        )


async def _sync_uploaded_dataset_topics(seeded_at: datetime) -> None:
    db = get_db()
    for topic_doc in _build_uploaded_topic_documents(seeded_at):
        await db[ICT_SYLLABUS_TOPICS_COLLECTION].update_one(
            {"topicId": topic_doc["topicId"]},
            {"$set": topic_doc},
            upsert=True,
        )
        await db[LESSON_SUMMARIES_COLLECTION].update_one(
            {"topicId": topic_doc["topicId"]},
            {"$set": _summary_from_topic_doc(topic_doc)},
            upsert=True,
        )
        for challenge in topic_doc.get("microChallenges", []):
            await db[MICRO_CHALLENGES_COLLECTION].update_one(
                {"challengeId": challenge["challengeId"]},
                {
                    "$set": {
                        **challenge,
                        "topicId": topic_doc["topicId"],
                        "topicName": topic_doc["topicName"],
                        "prerequisites": topic_doc.get("prerequisites", []),
                        "prerequisiteLabels": topic_doc.get("prerequisiteLabels", []),
                        "updatedAt": seeded_at,
                    }
                },
                upsert=True,
            )


def _build_uploaded_topic_documents(seeded_at: datetime) -> list[dict[str, Any]]:
    bundles: dict[str, dict[str, Any]] = {}

    for path in sorted(LESSONS_DATASET_DIR.glob("*.pdf")):
        signature = _extract_topic_signature(path)
        bundle = bundles.setdefault(signature["key"], _create_topic_bundle(signature))
        bundle["lessonText"] = _extract_pdf_text(path)
        bundle["sourceFiles"]["lessons"].append(path.name)

    for path in sorted(SHORT_NOTES_DATASET_DIR.glob("*.pdf")):
        signature = _extract_topic_signature(path)
        bundle = bundles.setdefault(signature["key"], _create_topic_bundle(signature))
        bundle["shortNoteText"] = _extract_pdf_text(path)
        bundle["sourceFiles"]["shortNotes"].append(path.name)

    for path in sorted(LESSON_QUESTIONS_DATASET_DIR.rglob("*.xlsx")):
        signature = _extract_topic_signature(path)
        bundle = bundles.setdefault(signature["key"], _create_topic_bundle(signature))
        bundle["questionBank"].extend(_extract_question_bank_from_xlsx(path))
        bundle["sourceFiles"]["questionBanks"].append(path.name)

    topic_docs = []
    for bundle in bundles.values():
        reference_sentences = _extract_reference_sentences(
            bundle.get("shortNoteText", ""),
            bundle.get("lessonText", ""),
            " ".join(item["answer"] for item in bundle.get("questionBank", [])[:12]),
        )
        question_bank = _dedupe_question_bank(bundle.get("questionBank", []))[:QUESTION_BANK_LIMIT]
        sample_questions = [item["question"] for item in question_bank[:4]]
        exam_questions = _select_exam_questions(question_bank)
        summary = _derive_topic_summary(bundle, reference_sentences, question_bank)
        key_points = _derive_topic_key_points(reference_sentences, question_bank, summary)
        topic_doc = {
            "topicId": f"uploaded_{bundle['key']}",
            "topicName": bundle["displayName"],
            "description": summary,
            "summary": summary,
            "subtopics": key_points[:5],
            "keyPoints": key_points[:5],
            "prerequisites": [],
            "prerequisiteLabels": [],
            "simpleDefinitions": [summary],
            "examples": _build_topic_examples({"topicName": bundle["displayName"], "keywords": _build_topic_keywords(bundle["displayName"], reference_sentences, question_bank)}),
            "keywords": _build_topic_keywords(bundle["displayName"], reference_sentences, question_bank),
            "sampleQuestions": sample_questions[:4],
            "examQuestions": exam_questions[:4],
            "microChallenges": _build_question_bank_micro_challenges(
                topic_id=f"uploaded_{bundle['key']}",
                topic_name=bundle["displayName"],
                question_bank=question_bank,
            ),
            "questionBank": question_bank,
            "lessonSnippet": _truncate_text(bundle.get("lessonText", "")),
            "shortNoteSnippet": _truncate_text(bundle.get("shortNoteText", "")),
            "referenceSentences": reference_sentences[:REFERENCE_SENTENCE_LIMIT],
            "subject": "O/L ICT",
            "datasetVersion": "uploaded-datasets",
            "sourceType": "uploaded_dataset",
            "sourceFiles": bundle["sourceFiles"],
            "sortOrder": 2000 + bundle["sortWeight"],
            "updatedAt": seeded_at,
        }
        if any(
            [
                topic_doc["lessonSnippet"],
                topic_doc["shortNoteSnippet"],
                topic_doc["questionBank"],
            ]
        ):
            topic_docs.append(topic_doc)

    return topic_docs


def _create_topic_bundle(signature: dict[str, Any]) -> dict[str, Any]:
    return {
        "key": signature["key"],
        "displayName": signature["displayName"],
        "sortWeight": signature["sortWeight"],
        "titleSuffix": signature["titleSuffix"],
        "lessonText": "",
        "shortNoteText": "",
        "questionBank": [],
        "sourceFiles": {"lessons": [], "shortNotes": [], "questionBanks": []},
    }


def _extract_topic_signature(path: Path) -> dict[str, Any]:
    raw_name = path.stem.replace("(", " ").replace(")", " ")
    normalized = re.sub(r"[_\-]+", " ", raw_name)
    lowered = normalized.lower()

    grade = "g11" if re.search(r"\b(g|gr)\s*11\b", lowered) else "g10" if re.search(r"\b(g|gr)\s*10\b", lowered) or "ol" in lowered else "general"
    chapter_match = re.search(r"\b(?:chapter|lesson)\s*0*([0-9]{1,2})\b", lowered)
    chapter_number = int(chapter_match.group(1)) if chapter_match else None

    cleaned = lowered
    cleaned = re.sub(r"\b(g|gr)\s*1[01]\b", " ", cleaned)
    cleaned = re.sub(r"\bol\b", " ", cleaned)
    cleaned = re.sub(r"\bict\b", " ", cleaned)
    cleaned = re.sub(r"\b(?:chapter|lesson)\s*0*[0-9]{1,2}\b", " ", cleaned)
    cleaned = re.sub(r"\b(?:questions?|answers?|full|unique|final|detailed|textonly|text only|gemini|deepseek|conversions|only|qa)\b", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    title_suffix = " ".join(word.capitalize() for word in cleaned.split())
    grade_label = "Grade 11 ICT" if grade == "g11" else "Grade 10 ICT" if grade == "g10" else "ICT"
    display_name = f"{grade_label} Chapter {chapter_number}" if chapter_number else grade_label
    if title_suffix:
        display_name = f"{display_name} - {title_suffix}"

    key = f"{grade}_chapter_{chapter_number}" if chapter_number else _slugify(display_name)
    sort_weight = (100 if grade == "g11" else 0) + (chapter_number or 99)
    return {
        "key": key,
        "displayName": display_name,
        "sortWeight": sort_weight,
        "titleSuffix": title_suffix,
    }


def _extract_pdf_text(path: Path) -> str:
    if not path.exists():
        return ""

    try:
        data = path.read_bytes()
    except OSError:
        return ""

    fragments: list[str] = []
    streams = re.findall(rb"stream\r?\n(.*?)\r?\nendstream", data, re.S)
    for stream in streams:
        try:
            raw = zlib.decompress(stream)
        except zlib.error:
            continue

        for match in re.finditer(rb"\((.*?)\)\s*Tj", raw, re.S):
            decoded = _decode_pdf_fragment(match.group(1))
            if decoded:
                fragments.append(decoded)

        for match in re.finditer(rb"\[(.*?)\]\s*TJ", raw, re.S):
            texts = re.findall(rb"\((.*?)\)", match.group(1), re.S)
            if not texts:
                continue
            decoded = _normalize_whitespace("".join(_decode_pdf_fragment(text) for text in texts))
            if decoded:
                fragments.append(decoded)

    if not fragments:
        return ""

    unique_fragments = []
    seen = set()
    for fragment in fragments:
        cleaned = _normalize_whitespace(fragment)
        if len(cleaned) < 3 or not re.search(r"[a-zA-Z]", cleaned):
            continue
        if cleaned in seen:
            continue
        seen.add(cleaned)
        unique_fragments.append(cleaned)
        if sum(len(item) for item in unique_fragments) >= PDF_TEXT_LIMIT:
            break

    return _truncate_text(" ".join(unique_fragments), limit=PDF_TEXT_LIMIT)


def _decode_pdf_fragment(raw: bytes) -> str:
    text = raw.decode("latin1", errors="ignore")
    text = re.sub(r"\\([0-7]{3})", lambda match: chr(int(match.group(1), 8)), text)
    text = text.replace(r"\(", "(").replace(r"\)", ")").replace(r"\n", " ").replace(r"\r", " ").replace(r"\t", " ")
    text = text.replace("\\\\", "\\")
    return _normalize_whitespace(text)


def _extract_question_bank_from_xlsx(path: Path) -> list[dict[str, str]]:
    namespace = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    rows: list[list[str]] = []
    try:
        with ZipFile(path) as workbook:
            shared_strings = _read_shared_strings(workbook, namespace)
            sheet_path = _read_first_sheet_path(workbook, namespace)
            if not sheet_path:
                return []
            sheet_root = ET.fromstring(workbook.read(sheet_path))
            for row in sheet_root.iterfind(".//a:sheetData/a:row", namespace):
                values = [_read_xlsx_cell_value(cell, namespace, shared_strings) for cell in row.findall("a:c", namespace)]
                if any(value.strip() for value in values):
                    rows.append(values)
    except (KeyError, OSError, ET.ParseError):
        return []

    if not rows:
        return []

    header = [_normalize_text(value) for value in rows[0]]
    question_index = next((idx for idx, value in enumerate(header) if "question" in value), 0)
    answer_index = next((idx for idx, value in enumerate(header) if "answer" in value), 1 if len(header) > 1 else 0)

    question_bank = []
    for row in rows[1:]:
        question = row[question_index].strip() if question_index < len(row) else ""
        answer = row[answer_index].strip() if answer_index < len(row) else ""
        if question and answer:
            question_bank.append({"question": question, "answer": answer})
    return question_bank


def _read_shared_strings(workbook: ZipFile, namespace: dict[str, str]) -> list[str]:
    if "xl/sharedStrings.xml" not in workbook.namelist():
        return []
    root = ET.fromstring(workbook.read("xl/sharedStrings.xml"))
    shared = []
    for item in root.findall("a:si", namespace):
        shared.append("".join(node.text or "" for node in item.iterfind(".//a:t", namespace)))
    return shared


def _read_first_sheet_path(workbook: ZipFile, namespace: dict[str, str]) -> str | None:
    workbook_root = ET.fromstring(workbook.read("xl/workbook.xml"))
    rel_root = ET.fromstring(workbook.read("xl/_rels/workbook.xml.rels"))
    relationships = {rel.attrib["Id"]: rel.attrib["Target"].lstrip("/") for rel in rel_root}
    sheets = workbook_root.find("a:sheets", namespace)
    if sheets is None or not list(sheets):
        return None
    first_sheet = list(sheets)[0]
    relation_id = first_sheet.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
    return relationships.get(relation_id)


def _read_xlsx_cell_value(cell: ET.Element, namespace: dict[str, str], shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    value = cell.find("a:v", namespace)
    if value is not None:
        raw = value.text or ""
        if cell_type == "s" and raw.isdigit():
            index = int(raw)
            return shared_strings[index] if 0 <= index < len(shared_strings) else ""
        return raw

    inline = cell.find("a:is", namespace)
    if inline is None:
        return ""
    return "".join(node.text or "" for node in inline.iterfind(".//a:t", namespace))


def _dedupe_question_bank(question_bank: list[dict[str, str]]) -> list[dict[str, str]]:
    seen = set()
    unique_rows = []
    for item in question_bank:
        question = _normalize_whitespace(item.get("question", ""))
        answer = _normalize_whitespace(item.get("answer", ""))
        if not question or not answer:
            continue
        signature = (_normalize_text(question), _normalize_text(answer))
        if signature in seen:
            continue
        seen.add(signature)
        unique_rows.append({"question": question, "answer": answer})
    return unique_rows


def _extract_reference_sentences(*values: str) -> list[str]:
    sentences: list[str] = []
    seen = set()
    for value in values:
        for sentence in re.split(r"(?<=[.!?])\s+|\s{2,}", value):
            cleaned = _normalize_whitespace(sentence)
            if not _is_clean_reference_sentence(cleaned):
                continue
            key = _normalize_text(cleaned)
            if key in seen:
                continue
            seen.add(key)
            sentences.append(cleaned)
            if len(sentences) >= REFERENCE_SENTENCE_LIMIT:
                return sentences
    return sentences


def _is_clean_reference_sentence(value: str) -> bool:
    if len(value) < 30 or len(value) > 240:
        return False
    if not re.search(r"[a-zA-Z]", value):
        return False
    lowered = value.lower()
    if lowered.startswith(("example", "figure", "activity")):
        return False
    if "[cite:" in lowered:
        return False
    if re.search(r"\)\d|\d\(", value):
        return False
    punctuation_noise = sum(1 for char in value if char in "\\[]<>")
    return punctuation_noise <= 3


def _derive_topic_summary(
    bundle: dict[str, Any],
    reference_sentences: list[str],
    question_bank: list[dict[str, str]],
) -> str:
    title_terms = _significant_terms(bundle.get("titleSuffix") or bundle["displayName"])
    required_overlap = 1 if len(title_terms) <= 1 else 2
    best_reference = None
    best_reference_overlap = 0
    for sentence in reference_sentences[:8]:
        cleaned = _normalize_whitespace(sentence)
        overlap = len(title_terms & _significant_terms(cleaned))
        if overlap > best_reference_overlap:
            best_reference = cleaned
            best_reference_overlap = overlap
    if best_reference and best_reference_overlap >= required_overlap:
        return best_reference.rstrip(".") + "."

    best_answer = None
    best_answer_overlap = 0
    for item in question_bank[:8]:
        answer = _normalize_whitespace(item["answer"])
        if "[cite:" in answer.lower():
            continue
        overlap = len(title_terms & (_significant_terms(item["question"]) | _significant_terms(answer)))
        if 35 <= len(answer) <= 220 and overlap > best_answer_overlap:
            best_answer = answer
            best_answer_overlap = overlap
    if best_answer and best_answer_overlap >= required_overlap:
        return best_answer.rstrip(".") + "."

    chapter_focus = (bundle.get("titleSuffix") or bundle["displayName"]).lower()
    return f"This chapter covers {chapter_focus} using uploaded lessons, short notes, and revision questions."


def _derive_topic_key_points(
    reference_sentences: list[str],
    question_bank: list[dict[str, str]],
    summary: str,
) -> list[str]:
    points = []
    for sentence in reference_sentences:
        if _question_similarity(sentence, summary) >= 0.85:
            continue
        if "[cite:" in sentence.lower():
            continue
        points.append(sentence.rstrip("."))
    for item in question_bank[:8]:
        answer = item["answer"].rstrip(".")
        if "[cite:" in answer.lower():
            continue
        if 18 <= len(answer) <= 120 and _question_similarity(answer, summary) < 0.8:
            points.append(answer)
    deduped = []
    seen = set()
    for point in points:
        key = _normalize_text(point)
        if key in seen:
            continue
        seen.add(key)
        deduped.append(point)
        if len(deduped) >= 5:
            break
    return deduped or [_clean_sentence(summary)]


def _build_topic_keywords(
    display_name: str,
    reference_sentences: list[str],
    question_bank: list[dict[str, str]],
) -> list[str]:
    keywords = []
    for source in [display_name, " ".join(reference_sentences[:6]), " ".join(item["question"] for item in question_bank[:8])]:
        for token in re.findall(r"[a-zA-Z][a-zA-Z0-9]{2,}", source.lower()):
            if token in STOPWORDS or token == "chapter":
                continue
            if token not in keywords:
                keywords.append(token)
            if len(keywords) >= 14:
                return keywords
    return keywords


def _select_exam_questions(question_bank: list[dict[str, str]]) -> list[str]:
    exam_questions = []
    for item in question_bank:
        normalized = _normalize_text(item["question"])
        if any(token in normalized for token in ["define", "list", "state", "give", "what is", "what are", "describe", "compare"]):
            exam_questions.append(item["question"])
    if not exam_questions:
        exam_questions = [item["question"] for item in question_bank[4:8]]
    return exam_questions


def _build_question_bank_micro_challenges(
    topic_id: str,
    topic_name: str,
    question_bank: list[dict[str, str]],
) -> list[dict[str, Any]]:
    short_answers = [
        _normalize_whitespace(item["answer"])
        for item in question_bank
        if 1 < len(_normalize_whitespace(item["answer"])) <= 80
    ]
    challenges = []
    used_questions = set()
    for item in question_bank:
        question = _normalize_whitespace(item["question"])
        answer = _normalize_whitespace(item["answer"])
        if question in used_questions or not (1 < len(answer) <= 80):
            continue
        distractors = []
        for candidate in short_answers:
            if _normalize_text(candidate) == _normalize_text(answer):
                continue
            if candidate not in distractors:
                distractors.append(candidate)
            if len(distractors) >= 3:
                break
        if len(distractors) < 3:
            continue
        used_questions.add(question)
        challenges.append(
            {
                "challengeId": f"{topic_id}_challenge_{len(challenges) + 1}",
                "questionText": question,
                "options": [answer, *distractors[:3]],
                "correctAnswer": answer,
                "explanation": f"{topic_name}: {answer}",
                "difficultyLevel": min(5, 1 + len(challenges)),
            }
        )
        if len(challenges) >= 3:
            break
    return challenges


def _truncate_text(value: str, limit: int = 1200) -> str:
    cleaned = _normalize_whitespace(value)
    if len(cleaned) <= limit:
        return cleaned
    truncated = cleaned[:limit].rsplit(" ", 1)[0].strip()
    return truncated + "..."


def _normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", str(value)).strip()


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")
    return slug or "topic"


async def _resolve_topic_context(current_topic: str | None, question: str) -> dict[str, Any] | None:
    db = get_db()
    topics = [doc async for doc in db[ICT_SYLLABUS_TOPICS_COLLECTION].find().sort("sortOrder", 1)]
    if not topics:
        return None
    current_match = _match_topic_result(topics, current_topic) if current_topic else None
    question_match = _match_topic_result(topics, question)

    # If the student's typed question clearly names another topic, prefer that
    # over the currently selected dropdown topic.
    if question_match and question_match["explicit"]:
        preferred_topic = _prefer_canonical_definition_topic(topics, question, question_match)
        return preferred_topic or question_match["topic"]
    if current_match:
        return current_match["topic"]
    if question_match:
        return question_match["topic"]
    return None


async def _resolve_learning_state(
    provided_state: str | None,
    student_id: str,
    topic_id: str | None,
) -> str:
    normalized = _normalize_learning_state(provided_state)
    if normalized:
        return normalized

    db = get_db()
    saved_state = await db[STUDENT_LEARNING_STATES_COLLECTION].find_one({"studentId": student_id})
    if saved_state and saved_state.get("learningState"):
        return _normalize_learning_state(saved_state["learningState"]) or "understanding"

    latest_attention = await db[ATTENTION_LOGS_COLLECTION].find_one({"user_id": student_id}, sort=[("_id", -1)])
    if latest_attention:
        recent_events = latest_attention.get("events", [])[-10:]
        distracted_count = sum(1 for item in recent_events if item.get("status") == "not_attentive")
        if distracted_count >= max(1, len(recent_events) // 2):
            return "distracted"

    query: dict[str, Any] = {"studentId": student_id}
    if topic_id:
        query["conceptId"] = topic_id
    answers = [doc async for doc in db[STUDENT_ANSWERS_COLLECTION].find(query).sort("answeredAt", -1).limit(5)]
    if answers:
        accuracy = sum(1 for answer in answers if answer.get("isCorrect")) / len(answers)
        if accuracy < 0.5:
            return "not_understanding"
        if accuracy > 0.8:
            return "understanding"
    return "understanding"


def _build_adaptive_answer(
    question: str,
    mode: str,
    learning_state: str,
    topic_doc: dict[str, Any] | None,
    prerequisites: list[str],
    difficulty_level: int,
    refresh_points: list[str],
) -> str:
    if not topic_doc:
        return _build_fallback_answer(mode, learning_state)

    related_question = _find_best_question_bank_match(question, topic_doc)
    supporting_sentence = _find_best_supporting_sentence(question, topic_doc, related_question)
    topic_summary = _clean_sentence(topic_doc.get("summary", topic_doc["topicName"]))
    key_points = topic_doc.get("keyPoints") or topic_doc.get("subtopics", [])
    concise_points = _clean_list_points(key_points[:3])
    prerequisite_line = (
        f"Before this topic, remember {', '.join(prerequisites[:2])}. "
        if prerequisites
        else ""
    )

    direct_answer = None
    if related_question:
        direct_answer = _clean_sentence(related_question["answer"])
    elif supporting_sentence:
        direct_answer = _clean_sentence(supporting_sentence)
    else:
        direct_answer = topic_summary

    if mode == "exam":
        exam_parts = [
            f"Definition: {topic_doc['topicName']} is {direct_answer}.",
        ]
        if concise_points:
            exam_parts.append("Key points: " + "; ".join(concise_points[:2]) + ".")
        if related_question and _question_similarity(related_question["answer"], direct_answer) < 0.8:
            exam_parts.append(f"Exam hint: {related_question['answer'].rstrip('.')}.")
        exam_parts.append("Write the definition first, then add only the strongest marks-scoring points.")
        return " ".join(exam_parts)

    state_intro = {
        "not_understanding": "No worries. Let's make this very simple.",
        "bored": "Let's make this more interesting with a practical example.",
        "distracted": "Quick refocus answer:",
        "understanding": "Here is the idea clearly.",
    }[learning_state]

    answer_parts = [
        prerequisite_line + state_intro,
        _format_gentle_answer(topic_doc["topicName"], direct_answer)
        if learning_state == "not_understanding"
        else _format_direct_answer(topic_doc["topicName"], direct_answer),
    ]
    if refresh_points:
        refresh_label = "Tiny refresh" if learning_state == "not_understanding" else "Quick refresh"
        answer_parts.append(f"{refresh_label}: " + "; ".join(_clean_list_points(refresh_points[:3])) + ".")
    if supporting_sentence and _question_similarity(supporting_sentence, direct_answer) < 0.8:
        support_label = "One more easy idea" if learning_state == "not_understanding" else "From your lesson data"
        answer_parts.append(f"{support_label}: {_clean_sentence(supporting_sentence)}.")

    if learning_state == "distracted":
        answer_parts.append("Key points: " + "; ".join(concise_points[:2]) + ".")
        answer_parts.append("Read the definition first, then continue with one example.")
        return " ".join(answer_parts)

    if learning_state == "not_understanding":
        if concise_points:
            answer_parts.append(_build_gentle_step_line(concise_points))
        example_line = _build_real_world_example(topic_doc, supporting_sentence)
        if example_line:
            answer_parts.append(f"Small example: {example_line}.")
        answer_parts.append("If you want, ask me one small part again and I will make it even easier.")
        return " ".join(answer_parts)
    elif learning_state == "bored":
        example_line = _build_real_world_example(topic_doc, supporting_sentence)
        if example_line:
            answer_parts.append(f"Real-world link: {example_line}.")
    else:
        answer_parts.append("Main points: " + "; ".join(concise_points[:3]) + ".")

    if related_question:
        answer_parts.append(f"Related lesson question: {related_question['question']}")
    answer_parts.append(f"Difficulty level: {DIFFICULTY_LABELS.get(difficulty_level, 'Basic definition')}.")
    return " ".join(answer_parts)

def _build_fallback_answer(mode: str, learning_state: str) -> str:
    if mode == "exam":
        return "Write a short definition, add 2 key points, and use O/L ICT keywords only."
    if learning_state == "distracted":
        return "Quick focus: ask about one ICT topic at a time, and I will explain it in key points."
    if learning_state == "not_understanding":
        return "No worries. Ask one small ICT question, and I will explain it using very easy words and a short example."
    return "Ask about an O/L ICT topic, and I will answer using the syllabus structure and prerequisites."


def _select_simple_definition(
    topic_doc: dict[str, Any],
    related_question: dict[str, str] | None = None,
    supporting_sentence: str | None = None,
) -> str:
    simple_definitions = topic_doc.get("simpleDefinitions", [])
    if related_question and related_question.get("answer"):
        return _clean_sentence(related_question["answer"])
    if simple_definitions:
        return _clean_sentence(simple_definitions[0])
    if supporting_sentence:
        return _clean_sentence(supporting_sentence)
    return _clean_sentence(topic_doc.get("summary", topic_doc.get("topicName", "This ICT topic")))


def _select_topic_example(topic_doc: dict[str, Any] | None, supporting_sentence: str | None = None) -> str | None:
    if not topic_doc:
        return None
    examples = _clean_list_points(topic_doc.get("examples", []))
    if examples:
        return examples[0]
    return _build_real_world_example(topic_doc, supporting_sentence)


def _build_key_terms(topic_doc: dict[str, Any] | None) -> list[str]:
    if not topic_doc:
        return ["O/L ICT"]
    terms = []
    for value in [
        topic_doc.get("topicName", ""),
        *(topic_doc.get("keywords", [])[:4]),
        *(topic_doc.get("subtopics", [])[:2]),
    ]:
        cleaned = _clean_sentence(str(value))
        if cleaned and cleaned not in terms:
            terms.append(cleaned)
    return terms[:4]


def _build_unknown_topic_answer() -> str:
    return (
        "I could not match that clearly to the local O/L ICT lessons. "
        f"Try a related topic such as {', '.join(DEFAULT_UNKNOWN_TOPIC_SUGGESTIONS[:5])}."
    )


def _build_simple_definitions(topic: dict[str, Any]) -> list[str]:
    definitions = _clean_list_points(topic.get("simpleDefinitions", []))
    if definitions:
        return definitions
    fallback = topic.get("summary") or topic.get("description") or topic.get("topicName") or "O/L ICT topic"
    return [_clean_sentence(fallback)]


def _build_topic_examples(topic: dict[str, Any]) -> list[str]:
    examples = _clean_list_points(topic.get("examples", []))
    if examples:
        return examples
    example = _build_real_world_example(topic, None)
    return [example] if example else []


async def _pick_micro_challenge(student_id: str, topic_doc: dict[str, Any] | None) -> dict[str, Any] | None:
    db = get_db()
    if not topic_doc:
        return None

    attempted_ids = {
        doc["challengeId"]
        async for doc in db[MICRO_CHALLENGE_ATTEMPTS_COLLECTION]
        .find({"studentId": student_id})
        .sort("createdAt", -1)
        .limit(10)
    }
    topic_candidates = [*topic_doc.get("prerequisites", [])[:1], topic_doc["topicId"]]
    for candidate_topic_id in topic_candidates:
        cursor = db[MICRO_CHALLENGES_COLLECTION].find({"topicId": candidate_topic_id}).sort("difficultyLevel", 1)
        challenges = [doc async for doc in cursor]
        for challenge in challenges:
            if challenge["challengeId"] not in attempted_ids:
                return challenge
        if challenges:
            return challenges[0]
    return None


def _find_best_question_bank_match(question: str, topic_doc: dict[str, Any]) -> dict[str, str] | None:
    question_bank = topic_doc.get("questionBank", [])
    if not question_bank:
        return None

    best_match = None
    best_score = 0.0
    for item in question_bank:
        score = _question_similarity(question, item["question"])
        if _normalize_text(item["question"]) in _normalize_text(question):
            score += 0.2
        if score > best_score:
            best_score = score
            best_match = item
    return best_match if best_score >= 0.12 else question_bank[0]


def _find_best_supporting_sentence(
    question: str,
    topic_doc: dict[str, Any],
    related_question: dict[str, str] | None,
) -> str | None:
    candidates = topic_doc.get("referenceSentences", [])
    if related_question:
        candidates = [related_question["answer"], *candidates]

    question_terms = _significant_terms(question)
    best_sentence = None
    best_score = 0.0
    for candidate in candidates:
        candidate_terms = _significant_terms(candidate)
        if not candidate_terms:
            continue
        overlap = len(question_terms & candidate_terms)
        score = _question_similarity(question, candidate) + overlap * 0.08
        if score > best_score:
            best_score = score
            best_sentence = candidate
    return best_sentence if best_score >= 0.08 else (candidates[0] if candidates else None)


def _build_real_world_example(topic_doc: dict[str, Any], supporting_sentence: str | None) -> str | None:
    keywords = _normalize_text(" ".join(topic_doc.get("keywords", [])[:6]))
    if "database" in keywords:
        return "a school can store student records and search them quickly"
    if "spreadsheet" in keywords or "excel" in keywords:
        return "a teacher can calculate marks automatically with formulas"
    if "network" in keywords or "internet" in keywords or "email" in keywords:
        return "students and teachers can share information quickly between devices"
    if "program" in keywords or "flowchart" in keywords:
        return "a student can plan a solution before writing code"
    if supporting_sentence:
        return _clean_sentence(supporting_sentence)
    return None


async def _determine_difficulty_level(student_id: str, topic_id: str) -> int:
    db = get_db()
    learned = await db[LEARNED_TOPICS_COLLECTION].find_one({"studentId": student_id, "topicId": topic_id})
    if not learned:
        return 1
    quiz_score = float(learned.get("quizScore", 0))
    reinforcement_level = int(learned.get("reinforcementLevel", 1))
    if quiz_score >= 85:
        return min(5, reinforcement_level + 2)
    if quiz_score >= 70:
        return min(5, reinforcement_level + 1)
    if quiz_score >= 50:
        return min(5, max(2, reinforcement_level))
    return 1


async def _touch_learned_topic(student_id: str, topic_doc: dict[str, Any] | None, accessed_at: datetime) -> None:
    if not topic_doc:
        return
    db = get_db()
    await db[LEARNED_TOPICS_COLLECTION].update_one(
        {"studentId": student_id, "topicId": topic_doc["topicId"]},
        {
            "$set": {
                "studentId": student_id,
                "topicId": topic_doc["topicId"],
                "topicName": topic_doc.get("topicName", topic_doc["topicId"]),
                "lastAccessedAt": accessed_at,
            },
            "$setOnInsert": {
                "firstLearnedAt": accessed_at,
                "quizScore": 0,
                "reinforcementLevel": 1,
                "nextReviewDate": accessed_at + timedelta(days=3),
            },
        },
        upsert=True,
    )


async def _update_student_learning_state(student_id: str, learning_state: str, topic_name: str, updated_at: datetime) -> None:
    db = get_db()
    await db[STUDENT_LEARNING_STATES_COLLECTION].update_one(
        {"studentId": student_id},
        {
            "$set": {
                "studentId": student_id,
                "learningState": learning_state,
                "topic": topic_name,
                "source": "chatbot",
                "updatedAt": updated_at,
            },
            "$setOnInsert": {"createdAt": updated_at},
        },
        upsert=True,
    )


async def _recalculate_understanding_score(student_id: str, topic_id: str) -> None:
    db = get_db()
    topic_doc = await db[ICT_SYLLABUS_TOPICS_COLLECTION].find_one({"topicId": topic_id})
    if not topic_doc:
        return

    learned = await db[LEARNED_TOPICS_COLLECTION].find_one({"studentId": student_id, "topicId": topic_id}) or {}
    challenge_attempts = [
        doc async for doc in db[MICRO_CHALLENGE_ATTEMPTS_COLLECTION]
        .find({"studentId": student_id, "topicId": topic_id})
        .sort("createdAt", -1)
        .limit(10)
    ]
    repeated_alert = await db[REPEATED_QUERY_ALERTS_COLLECTION].find_one(
        {"studentId": student_id, "topic": topic_doc["topicName"], "status": "active"}
    )
    recent_messages = [
        doc async for doc in db[CHATBOT_MESSAGES_COLLECTION]
        .find({"studentId": student_id, "topic": topic_doc["topicName"]})
        .sort("createdAt", -1)
        .limit(10)
    ]

    quiz_score = float(learned.get("quizScore", 0))
    micro_score = (
        round((sum(1 for doc in challenge_attempts if doc.get("isCorrect")) / len(challenge_attempts)) * 100, 2)
        if challenge_attempts
        else 0
    )
    chatbot_confidence = _chatbot_confidence_from_messages(recent_messages)
    repeated_penalty = min(100, (repeated_alert.get("repeatedQuestionCount", 0) if repeated_alert else 0) * 15)
    understanding_score = max(
        0,
        min(
            100,
            round(quiz_score * 0.4 + micro_score * 0.3 + chatbot_confidence * 0.2 - repeated_penalty * 0.1, 2),
        ),
    )
    weak_areas = []
    if quiz_score < 60:
        weak_areas.append("Quiz recall")
    if micro_score < 60:
        weak_areas.append("Micro-challenge prerequisite knowledge")
    if repeated_penalty > 20:
        weak_areas.append("Repeated question difficulty")

    await db[STUDENT_UNDERSTANDING_SCORES_COLLECTION].update_one(
        {"studentId": student_id, "topicId": topic_id},
        {
            "$set": {
                "studentId": student_id,
                "topicId": topic_id,
                "topicName": topic_doc["topicName"],
                "understandingScore": understanding_score,
                "quizScore": quiz_score,
                "microChallengeScore": micro_score,
                "chatbotConfidence": chatbot_confidence,
                "repeatedQueryPenalty": repeated_penalty,
                "weakAreas": weak_areas,
                "recommendation": "Needs teacher support" if understanding_score < 50 else "Keep practicing" if understanding_score < 70 else "Good progress",
                "updatedAt": _utc_now(),
            },
            "$setOnInsert": {"createdAt": _utc_now()},
        },
        upsert=True,
    )


def _chatbot_confidence_from_messages(messages: list[dict[str, Any]]) -> float:
    if not messages:
        return 60
    values = []
    for doc in messages:
        state = doc.get("learningState", "understanding")
        values.append(
            {
                "understanding": 90,
                "bored": 70,
                "distracted": 55,
                "not_understanding": 45,
            }.get(state, 60)
        )
    return round(sum(values) / len(values), 2)


async def _build_difficulty_prompt(
    topic_doc: dict[str, Any] | None,
    student_id: str,
    difficulty_level: int,
    question: str,
    intent: str,
    learning_state: str,
    mode: str,
    prerequisites: list[str],
    repeated_query_count: int = 1,
) -> str | None:
    if not topic_doc:
        return None
    if mode == "exam":
        return None
    if learning_state in {"distracted", "not_understanding"}:
        return None
    if repeated_query_count >= 2:
        return None

    db = get_db()
    recent_topic_messages = [
        doc
        async for doc in db[CHATBOT_MESSAGES_COLLECTION]
        .find({"studentId": student_id, "topic": topic_doc["topicName"]})
        .sort("createdAt", -1)
        .limit(6)
    ]
    avoid_texts = [
        value
        for doc in recent_topic_messages
        for value in [doc.get("question"), doc.get("nextDifficultyPrompt")]
        if value
    ]

    topic_name = topic_doc["topicName"]
    normalized_question = _normalize_text(question)
    asks_for_definition = any(
        token in normalized_question
        for token in ["what is", "define", "meaning", "explain", "describe"]
    )
    asks_for_comparison = any(
        token in normalized_question
        for token in ["difference", "compare", "similar", "versus", "vs"]
    )
    asks_for_example = any(
        token in normalized_question
        for token in ["example", "use", "application"]
    )

    first_prerequisite = prerequisites[0] if prerequisites else "its prerequisite topic"
    related_points = topic_doc.get("keyPoints") or topic_doc.get("subtopics", [])
    first_point = _clean_sentence(related_points[0]) if related_points else topic_name
    candidate_prompts: list[str]

    if difficulty_level <= 1:
        if asks_for_definition or intent == "learning":
            candidate_prompts = [
                f"Good. Next, can you give one real-life use of {topic_name}?",
                f"Good. Can you give one simple example related to {topic_name}?",
                f"Good. Mention one important function of {topic_name}.",
            ]
        else:
            candidate_prompts = [
                f"Good. Now explain the main idea of {topic_name} in your own words.",
                f"Good. Can you mention one important point about {topic_name} without repeating the definition?",
            ]
        return _select_non_repetitive_follow_up(
            candidate_prompts=candidate_prompts,
            question=question,
            topic_name=topic_name,
            avoid_texts=avoid_texts,
        )

    if difficulty_level == 2:
        if asks_for_example:
            candidate_prompts = [
                f"Nice. Now compare {topic_name} with {first_prerequisite} in one clear point.",
                f"Nice. What makes {topic_name} different from {first_prerequisite}?",
            ]
        elif asks_for_comparison:
            candidate_prompts = [
                f"Good. Can you now give one practical use of {topic_name}?",
                f"Good. Give one real-world example of {topic_name}.",
            ]
        else:
            candidate_prompts = [
                f"Good. Can you explain why this point matters: {first_point}?",
                f"Good. Mention one key point about {topic_name} that students should remember.",
            ]
        return _select_non_repetitive_follow_up(
            candidate_prompts=candidate_prompts,
            question=question,
            topic_name=topic_name,
            avoid_texts=avoid_texts,
        )

    if difficulty_level == 3:
        return _select_non_repetitive_follow_up(
            candidate_prompts=[
                f"Next challenge: how would you apply {topic_name} in a real school or office situation?",
                f"Next challenge: where would you use {topic_name} in day-to-day ICT work?",
            ],
            question=question,
            topic_name=topic_name,
            avoid_texts=avoid_texts,
        )

    if difficulty_level == 4:
        return _select_non_repetitive_follow_up(
            candidate_prompts=[
                f"Now try an exam-style comparison or application question about {topic_name}.",
                f"Now try a short structured answer about {topic_name} with one comparison or use case.",
            ],
            question=question,
            topic_name=topic_name,
            avoid_texts=avoid_texts,
        )

    return _select_non_repetitive_follow_up(
        candidate_prompts=[
            f"You are doing well. Try solving a higher-level exam problem related to {topic_name}.",
            f"You are doing well. Try an advanced application question based on {topic_name}.",
        ],
        question=question,
        topic_name=topic_name,
        avoid_texts=avoid_texts,
    )


def _select_non_repetitive_follow_up(
    candidate_prompts: list[str],
    question: str,
    topic_name: str,
    avoid_texts: list[str] | None = None,
) -> str | None:
    normalized_question = _normalize_text(question)
    topic_key = _normalize_text(topic_name)
    avoid_texts = avoid_texts or []
    question_requests_explanation = any(
        token in normalized_question for token in ["what is", "define", "meaning", "explain", "describe"]
    )
    question_requests_example = any(
        token in normalized_question for token in ["example", "use", "application"]
    )
    question_requests_comparison = any(
        token in normalized_question for token in ["difference", "compare", "similar", "versus", "vs"]
    )

    for candidate in candidate_prompts:
        normalized_candidate = _normalize_text(candidate)
        if _question_similarity(question, candidate) >= 0.45:
            continue
        if any(_question_similarity(candidate, existing) >= 0.55 for existing in avoid_texts):
            continue
        if question_requests_explanation and any(
            token in normalized_candidate for token in ["explain", "definition", "define", "main idea"]
        ) and topic_key in normalized_candidate:
            continue
        if question_requests_example and any(
            token in normalized_candidate for token in ["example", "use", "application"]
        ) and topic_key in normalized_candidate:
            continue
        if question_requests_comparison and any(
            token in normalized_candidate for token in ["compare", "difference", "similar", "versus"]
        ) and topic_key in normalized_candidate:
            continue
        return candidate

    return None


def _reinforcement_priority(topic_doc: dict[str, Any]) -> int:
    reference = topic_doc.get("lastAccessedAt") or topic_doc.get("firstLearnedAt")
    if not reference:
        return 3
    days_away = (_utc_now() - _as_utc_naive(reference)).days
    if days_away <= 1:
        return 0
    if 2 <= days_away <= 3:
        return 1
    if 4 <= days_away <= 7:
        return 2
    return 3


def _priority_label(topic_doc: dict[str, Any]) -> str:
    mapping = {0: "today", 1: "low", 2: "medium", 3: "high", "warm_up": "low"}
    if isinstance(topic_doc, str):
        return mapping.get(topic_doc, "low")
    return mapping[_reinforcement_priority(topic_doc)]


def _reinforcement_level_from_score(score: float) -> int:
    if score >= 85:
        return 1
    if score >= 70:
        return 2
    if score >= 50:
        return 3
    return 4


def _next_review_date(score: float) -> datetime:
    now = _utc_now()
    if score >= 85:
        return now + timedelta(days=10)
    if score >= 70:
        return now + timedelta(days=7)
    if score >= 50:
        return now + timedelta(days=4)
    return now + timedelta(days=2)


def _build_quiz_question(topic_doc: dict[str, Any], priority: str) -> dict[str, Any] | None:
    challenges = topic_doc.get("microChallenges", [])
    if challenges:
        challenge = challenges[0]
        return {
            "questionId": f"{topic_doc['topicId']}_{challenge['challengeId']}",
            "topicId": topic_doc["topicId"],
            "topicName": topic_doc["topicName"],
            "questionText": challenge["questionText"],
            "options": challenge["options"],
            "correctAnswer": challenge["correctAnswer"],
            "explanation": challenge["explanation"],
            "priority": priority,
        }
    sample_questions = topic_doc.get("sampleQuestions", [])
    if not sample_questions:
        return None
    return {
        "questionId": f"{topic_doc['topicId']}_warmup",
        "topicId": topic_doc["topicId"],
        "topicName": topic_doc["topicName"],
        "questionText": sample_questions[0],
        "options": [topic_doc["topicName"], *topic_doc.get("keyPoints", [])[:3]],
        "correctAnswer": topic_doc["topicName"],
        "explanation": topic_doc["summary"],
        "priority": priority,
    }


async def _lookup_student_name(student_id: str) -> str:
    user = await get_db()[USERS_COLLECTION].find_one({"appUserId": student_id})
    return user.get("fullName", "Student") if user else "Student"


def _significant_terms(value: str) -> set[str]:
    return {
        token
        for token in _normalize_text(value).split()
        if len(token) > 2 and token not in STOPWORDS and not token.isdigit()
    }


def _question_fingerprint(value: str) -> str:
    return " ".join(sorted(_significant_terms(value)))


def _question_similarity(left: str, right: str) -> float:
    left_tokens = set(_normalize_text(left).split())
    right_tokens = set(_normalize_text(right).split())
    if not left_tokens or not right_tokens:
        return 0
    intersection = len(left_tokens & right_tokens)
    union = len(left_tokens | right_tokens)
    return intersection / union


def _suggest_next_topic(topic_doc: dict[str, Any] | None) -> str | None:
    if not topic_doc:
        return None
    key_points = topic_doc.get("keyPoints") or topic_doc.get("subtopics", [])
    return key_points[0] if key_points else None


def _match_topic(topics: list[dict[str, Any]], text: str) -> dict[str, Any] | None:
    result = _match_topic_result(topics, text)
    return result["topic"] if result else None


def _match_topic_result(topics: list[dict[str, Any]], text: str | None) -> dict[str, Any] | None:
    if not text:
        return None
    lowered = _normalize_text(text)
    text_terms = _significant_terms(text)
    if not lowered:
        return None

    best_match = None
    best_score = 0.0
    best_is_explicit = False

    for topic in topics:
        score = 0.0
        is_explicit = False
        name = _normalize_text(topic.get("topicName", ""))
        topic_id = _normalize_text(str(topic.get("topicId", "")).replace("_", " "))
        aliases = {name, topic_id}
        singular_name = _singularize_term(name)
        singular_topic_id = _singularize_term(topic_id)
        if singular_name:
            aliases.add(singular_name)
        if singular_topic_id:
            aliases.add(singular_topic_id)

        if lowered in aliases:
            return {"topic": topic, "score": 100.0, "explicit": True}

        if any(_phrase_in_text(lowered, alias) for alias in aliases if alias):
            score += 8
            is_explicit = True

        for keyword in topic.get("keywords", []):
            keyword_normalized = _normalize_text(keyword)
            keyword_aliases = {keyword_normalized}
            singular_keyword = _singularize_term(keyword_normalized)
            if singular_keyword:
                keyword_aliases.add(singular_keyword)
            if any(_phrase_in_text(lowered, alias) for alias in keyword_aliases if alias):
                score += 4 if len(keyword_normalized.split()) == 1 else 5
                is_explicit = True
        for subtopic in topic.get("subtopics", []) + topic.get("keyPoints", []):
            subtopic_normalized = _normalize_text(subtopic)
            if subtopic_normalized and _phrase_in_text(lowered, subtopic_normalized):
                score += 1
        for question in topic.get("sampleQuestions", [])[:4]:
            if _question_similarity(text, question) >= 0.35:
                score += 2
        reference_terms = _significant_terms(" ".join(topic.get("referenceSentences", [])[:6]))
        score += min(3, len(text_terms & reference_terms))
        topic_terms = _significant_terms(
            " ".join(
                [
                    topic.get("topicName", ""),
                    str(topic.get("topicId", "")).replace("_", " "),
                    *topic.get("keywords", [])[:8],
                ]
            )
        )
        overlap = len(text_terms & topic_terms)
        if overlap:
            score += overlap * 1.5
            if overlap >= 2:
                is_explicit = True

        if score > best_score or (score == best_score and is_explicit and not best_is_explicit):
            best_score = score
            best_match = topic
            best_is_explicit = is_explicit
    if best_match and best_score > 0:
        return {"topic": best_match, "score": best_score, "explicit": best_is_explicit}
    return None


def _phrase_in_text(text: str, phrase: str) -> bool:
    if not text or not phrase:
        return False
    return bool(re.search(rf"(?<![a-z0-9]){re.escape(phrase)}(?![a-z0-9])", text))


def _prefer_canonical_definition_topic(
    topics: list[dict[str, Any]],
    question: str,
    question_match: dict[str, Any],
) -> dict[str, Any] | None:
    matched_topic = question_match["topic"]
    if matched_topic.get("sourceType") != "uploaded_dataset":
        return None
    if not _is_definition_question(question):
        return None

    preferred_topic = None
    preferred_score = question_match["score"]
    for topic in topics:
        if topic.get("topicId") == matched_topic.get("topicId"):
            continue
        if topic.get("sourceType") == "uploaded_dataset":
            continue

        candidate_match = _match_topic_result([topic], question)
        if not candidate_match or not candidate_match["explicit"]:
            continue

        score = candidate_match["score"]
        if len(_normalize_text(topic.get("topicName", "")).split()) <= 3:
            score += 3
        if len(_normalize_text(topic.get("summary", "")).split()) <= 24:
            score += 1
        if topic.get("sourceType") in {None, "", "syllabus"}:
            score += 1

        if score > preferred_score:
            preferred_score = score
            preferred_topic = topic

    return preferred_topic


def _is_definition_question(question: str) -> bool:
    normalized = _normalize_text(question)
    return any(
        token in normalized
        for token in ["what is", "what are", "define", "meaning of", "explain"]
    )


def _singularize_term(value: str) -> str:
    cleaned = _normalize_text(value)
    if not cleaned:
        return cleaned
    if cleaned.endswith("ies") and len(cleaned) > 3:
        return cleaned[:-3] + "y"
    if cleaned.endswith("ses") and len(cleaned) > 3:
        return cleaned[:-2]
    if cleaned.endswith("s") and not cleaned.endswith("ss") and len(cleaned) > 3:
        return cleaned[:-1]
    return cleaned


def _format_direct_answer(topic_name: str, direct_answer: str) -> str:
    normalized_answer = _normalize_text(direct_answer)
    normalized_topic = _normalize_text(topic_name)
    singular_topic = normalized_topic[:-1] if normalized_topic.endswith("s") else normalized_topic

    if (
        normalized_answer.startswith(f"{normalized_topic} is ")
        or normalized_answer.startswith(f"{singular_topic} is ")
        or normalized_answer.startswith(f"a {singular_topic} is ")
        or normalized_answer.startswith(f"an {singular_topic} is ")
        or normalized_answer.startswith(f"the {singular_topic} is ")
    ):
        return f"Direct answer: {direct_answer}."
    return f"Direct answer: {topic_name} means {direct_answer}."


def _format_gentle_answer(topic_name: str, direct_answer: str) -> str:
    normalized_answer = _normalize_text(direct_answer)
    normalized_topic = _normalize_text(topic_name)
    singular_topic = normalized_topic[:-1] if normalized_topic.endswith("s") else normalized_topic

    if (
        normalized_answer.startswith(f"{normalized_topic} is ")
        or normalized_answer.startswith(f"{singular_topic} is ")
        or normalized_answer.startswith(f"a {singular_topic} is ")
        or normalized_answer.startswith(f"an {singular_topic} is ")
        or normalized_answer.startswith(f"the {singular_topic} is ")
    ):
        return f"Simple answer: {direct_answer}."
    return f"Simple answer: {topic_name} means {direct_answer}."


def _build_gentle_step_line(concise_points: list[str]) -> str:
    if not concise_points:
        return "Easy steps: first understand the idea, then look at one example."
    if len(concise_points) == 1:
        return f"Easy step: first, {concise_points[0]}."
    return f"Easy steps: first, {concise_points[0]}; then, {concise_points[1]}."


def _resolve_mode(selected_mode: str | None, detected_intent: str) -> str:
    selected = str(selected_mode or "learning").lower()
    if selected == "exam" or detected_intent == "exam":
        return "exam"
    return "learning"


def _normalize_learning_state(state: str | None) -> str | None:
    if not state:
        return None
    lowered = _normalize_text(state).replace(" ", "_")
    mapping = {
        "understanding": "understanding",
        "not_understanding": "not_understanding",
        "notunderstanding": "not_understanding",
        "bored": "bored",
        "distracted": "distracted",
    }
    return mapping.get(lowered)


def _merge_prerequisites(requested: list[str], topic_prerequisites: list[str]) -> list[str]:
    merged = []
    for item in requested + topic_prerequisites:
        if item and item not in merged:
            merged.append(item)
    return merged


def _clean_sentence(value: str) -> str:
    cleaned = str(value).strip()
    return cleaned.rstrip(" .;,:")


def _ensure_sentence(value: str) -> str:
    cleaned = _clean_sentence(value)
    return f"{cleaned}." if cleaned else ""


def _clean_list_points(values: list[str]) -> list[str]:
    return [_clean_sentence(value) for value in values if str(value).strip()]


def _resolve_prerequisite_labels(prerequisite_ids: list[str], topic_label_map: dict[str, str]) -> list[str]:
    return [topic_label_map.get(item, item.replace("_", " ").title()) for item in prerequisite_ids]


def _summary_from_topic_doc(topic_doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "topicId": topic_doc["topicId"],
        "topicName": topic_doc["topicName"],
        "summary": topic_doc["summary"],
        "keyPoints": topic_doc.get("keyPoints", []),
        "prerequisites": topic_doc.get("prerequisites", []),
        "prerequisiteLabels": topic_doc.get("prerequisiteLabels", topic_doc.get("prerequisites", [])),
        "simpleDefinitions": topic_doc.get("simpleDefinitions", []),
        "examples": topic_doc.get("examples", []),
        "sampleQuestions": topic_doc.get("sampleQuestions", []),
        "examQuestions": topic_doc.get("examQuestions", []),
        "updatedAt": topic_doc.get("updatedAt", _utc_now()),
    }


def _normalize_text(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9\s_/]", " ", str(value).lower())
    return re.sub(r"\s+", " ", cleaned).strip()


def _utc_now() -> datetime:
    """Return a timezone-naive UTC datetime that is safe to round-trip through MongoDB."""
    return datetime.utcnow()


def _as_utc_naive(value: datetime | None) -> datetime:
    """Normalize datetimes from MongoDB or Python into comparable UTC-naive values."""
    if value is None:
        return _utc_now()
    if value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _ensure_meaningful_mcq_options(challenge: dict[str, Any]) -> dict[str, Any]:
    raw_options = challenge.get("options") or []
    is_placeholder = (
        not raw_options
        or len(raw_options) < 2
        or any(re.match(r"^option\s*[a-d]$", str(opt).strip(), re.I) for opt in raw_options)
    )
    if not is_placeholder:
        return challenge

    topic_name = challenge.get("topicName") or "Computer System"
    question = challenge.get("questionText") or f"What is {topic_name}?"
    explanation = challenge.get("explanation") or f"Core concept in {topic_name}."

    q_lower = (question + " " + topic_name).lower()
    if "computer" in q_lower or "device" in q_lower:
        correct = "An electronic device that accepts data, processes it, and generates output"
        distractors = [
            "A mechanical printer without data processing capabilities",
            "A passive storage shelf for computer cables",
            "An analog tool used only for electrical voltage regulation",
        ]
    elif "input" in q_lower:
        correct = "A device used to enter raw data and instructions into the computer"
        distractors = [
            "A device that only displays processed information on a screen",
            "A secondary storage disk for long-term backups",
            "An internal power supply unit",
        ]
    elif "output" in q_lower:
        correct = "A device that presents processed information to the user"
        distractors = [
            "A device used solely to type text into memory",
            "A hardware component that executes arithmetic logic",
            "A communication protocol for web servers",
        ]
    elif "network" in q_lower or "internet" in q_lower:
        correct = "A collection of interconnected devices to share resources and communicate"
        distractors = [
            "A standalone personal computer disconnected from other systems",
            "A single offline database file on a USB flash drive",
            "A power management utility for desktop computers",
        ]
    elif "memory" in q_lower or "ram" in q_lower or "storage" in q_lower:
        correct = "Hardware used to temporarily hold data and instructions for active processing"
        distractors = [
            "An external peripheral used only to capture video frames",
            "A physical keyboard layout standard",
            "An application software for drawing vector graphics",
        ]
    elif "data" in q_lower or "information" in q_lower:
        correct = "Raw unorganized facts that are processed into meaningful information"
        distractors = [
            "A formatted spreadsheet document with charts",
            "An executable binary program stored in ROM",
            "A network firewall configuration file",
        ]
    elif "database" in q_lower or "dbms" in q_lower:
        correct = "An organized collection of related data stored and accessed electronically"
        distractors = [
            "A text editor used for drafting personal emails",
            "A computer monitor used for displaying graphic designs",
            "A wireless router connecting devices to a local network",
        ]
    else:
        correct = f"A core {topic_name} component that {explanation.lower().strip('.')}"
        distractors = [
            f"An unrelated peripheral not used in {topic_name}",
            "A legacy offline storage medium",
            "A temporary network interface identifier",
        ]

    challenge["options"] = [correct, *distractors]
    challenge["correctAnswer"] = correct
    challenge["explanation"] = f"{topic_name}: {correct}"
    return challenge


def _serialize_micro_challenge(doc: dict[str, Any]) -> dict[str, Any]:
    doc = _ensure_meaningful_mcq_options(dict(doc))
    return {
        "challengeId": doc["challengeId"],
        "topicId": doc["topicId"],
        "topicName": doc["topicName"],
        "questionText": doc["questionText"],
        "options": doc.get("options", []),
        "correctAnswer": doc["correctAnswer"],
        "explanation": doc["explanation"],
        "prerequisiteTopics": doc.get("prerequisiteLabels", doc.get("prerequisites", [])),
        "difficultyLevel": doc.get("difficultyLevel", 1),
    }


def _serialize_summary(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "topicId": doc["topicId"],
        "topicName": doc["topicName"],
        "summary": doc["summary"],
        "keyPoints": doc.get("keyPoints", []),
        "prerequisites": doc.get("prerequisiteLabels", doc.get("prerequisites", [])),
        "sampleQuestions": doc.get("sampleQuestions", []),
        "examQuestions": doc.get("examQuestions", []),
    }


def _serialize_understanding_score(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "studentId": doc["studentId"],
        "topicId": doc["topicId"],
        "topicName": doc["topicName"],
        "understandingScore": doc["understandingScore"],
        "quizScore": doc.get("quizScore", 0),
        "microChallengeScore": doc.get("microChallengeScore", 0),
        "chatbotConfidence": doc.get("chatbotConfidence", 0),
        "repeatedQueryPenalty": doc.get("repeatedQueryPenalty", 0),
        "weakAreas": doc.get("weakAreas", []),
        "recommendation": doc.get("recommendation", ""),
        "studentName": doc.get("studentName"),
        "updatedAt": doc.get("updatedAt"),
    }


def _serialize_message(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "studentId": doc["studentId"],
        "question": doc["question"],
        "answer": doc["answer"],
        "mode": doc["mode"],
        "detectedIntent": doc["detectedIntent"],
        "intent": doc.get("intent", doc.get("detectedIntent")),
        "learningState": doc["learningState"],
        "topic": doc["topic"],
        "prerequisiteTopics": doc.get("prerequisiteTopics", []),
        "prerequisites": doc.get("prerequisites", doc.get("prerequisiteTopics", [])),
        "prompt": doc["prompt"],
        "createdAt": doc["createdAt"],
        "inferredTopic": doc.get("inferredTopic"),
        "suggestedNextTopic": doc.get("suggestedNextTopic"),
        "repeatedQueryStatus": doc.get("repeatedQueryStatus"),
        "repeatedQueryCount": doc.get("repeatedQueryCount", 0),
        "difficultyLevel": doc.get("difficultyLevel", 1),
        "compressedAnswer": doc.get("compressedAnswer", False),
        "summaryRecommendation": doc.get("summaryRecommendation"),
        "summaryTopicId": doc.get("summaryTopicId"),
        "microChallengeAvailable": doc.get("microChallengeAvailable", False),
        "conceptReEntry": doc.get("conceptReEntry", False),
        "modeBadge": doc.get("modeBadge"),
        "learningStateBadge": doc.get("learningStateBadge"),
        "nextDifficultyPrompt": doc.get("nextDifficultyPrompt"),
        "conceptRefreshPoints": doc.get("conceptRefreshPoints", []),
        "sourceType": doc.get("sourceType", "LOCAL_DATASET"),
        "fallbackReason": doc.get("fallbackReason"),
        "confidence": doc.get("confidence", 0.0),
    }


def _escape_pdf_text(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _generate_simple_pdf(lines: list[str], title: str = "SignLearn AI - Analytics Report") -> bytes:
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Heading1"],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#0f766e"),
            spaceAfter=6,
        )
        subtitle_style = ParagraphStyle(
            "ReportSubtitle",
            parent=styles["Normal"],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#64748b"),
            spaceAfter=14,
        )

        elements = [
            Paragraph(title, title_style),
            Paragraph(lines[1] if len(lines) > 1 else "Generated Report", subtitle_style),
            Spacer(1, 8),
        ]

        table_data = [["Metric / Topic / Description", "Score / Details"]]
        for line in lines[2:]:
            if ":" in line:
                parts = line.split(":", 1)
                table_data.append([parts[0].strip(), parts[1].strip()])
            else:
                table_data.append([line.strip(), ""])

        if len(table_data) > 1:
            t = Table(table_data, colWidths=[280, 240])
            t.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f766e")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, 0), 10),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                        ("TOPPADDING", (0, 0), (-1, -1), 6),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                    ]
                )
            )
            elements.append(t)

        doc.build(elements)
        return buffer.getvalue()
    except Exception:
        pass

    # Pure Python PDF Fallback with explicit 18 TL text leading
    safe_lines = [
        "BT",
        "/F1 12 Tf",
        "16 TL",
        "50 780 Td",
    ]
    for i, line in enumerate(lines[:40]):
        escaped = _escape_pdf_text(line)
        if i == 0:
            safe_lines.append(f"({escaped}) Tj")
        else:
            safe_lines.append(f"T* ({escaped}) Tj")
    safe_lines.append("ET")
    content_stream = "\n".join(safe_lines).encode("utf-8")

    objects = []
    objects.append(b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n")
    objects.append(b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n")
    objects.append(
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
        b"/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj\n"
    )
    objects.append(
        f"4 0 obj << /Length {len(content_stream)} >> stream\n".encode("utf-8")
        + content_stream
        + b"\nendstream endobj\n"
    )
    objects.append(b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n")

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for obj in objects:
        offsets.append(len(pdf))
        pdf.extend(obj)
    xref_start = len(pdf)
    pdf.extend(f"xref\n0 {len(offsets)}\n".encode("utf-8"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("utf-8"))
    pdf.extend(
        f"trailer << /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF".encode("utf-8")
    )
    return bytes(pdf)
