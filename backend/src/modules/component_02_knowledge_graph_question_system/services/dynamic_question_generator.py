"""
services/dynamic_question_generator.py
---
Dynamically generates Knowledge Graph concept nodes, concept diagrams, lesson timelines, 
and Multiple Choice Checkpoint Questions (MCQs) rooted in the uploaded video title 
and transcript segments.
"""

from datetime import datetime, timezone
import re
from bson import ObjectId
from src.common.database.connection import get_db

KNOWLEDGE_GRAPH_COLLECTION = "knowledge_graph"
POPUP_QUESTIONS_COLLECTION = "popup_questions"
LESSON_TIMELINES_COLLECTION = "lesson_timelines"
ICT_SYLLABUS_TOPICS_COLLECTION = "ictSyllabusTopics"
LESSON_SUMMARIES_COLLECTION = "lessonSummaries"


async def generate_graph_and_mcqs_from_transcript(video_id: str, segments: list, title: str | None = None) -> dict:
    """
    Given transcript segments and video title, dynamically generate:
    1. Root Concept Node named after the video title
    2. Sub-concept nodes linked as children/prerequisites
    3. Visual Concept Diagram metadata for frontend graph visualizer
    4. Time-aligned Popup MCQs
    5. Sync to ictSyllabusTopics for Chatbot & Growth Matrix
    """
    db = get_db()
    if not segments:
        return {"status": "skipped", "reason": "No transcript segments available"}

    # Resolve Video Title
    video_title = title
    if not video_title or video_title == "Sign Language Video":
        try:
            v_lookup = await db["videos"].find_one({"$or": [{"_id": video_id}, {"_id": ObjectId(video_id) if ObjectId.is_valid(video_id) else None}]})
            if v_lookup and v_lookup.get("title"):
                video_title = v_lookup["title"]
        except Exception:
            pass

    if not video_title:
        video_title = f"Lesson Video ({video_id[:8]})"

    now = datetime.now(timezone.utc)
    root_concept_id = f"vid_concept_{video_id}"

    # Distractor bank for dynamic MCQs
    distractor_bank = [
        "Operating System Kernel", "BIOS Firmware", "RAM Volatile Storage",
        "Ethernet Switch", "TCP/IP Protocol", "Relational SQL Index",
        "Cache Memory", "Optical Fiber Cable", "Firewall Rules",
        "GPU Processor", "DNS Lookup", "Hypertext Transfer",
        "Secondary Storage Drive", "ALU Execution Unit", "Encryption Algorithm",
    ]

    generated_concepts = []
    generated_questions = []
    timeline_segments = []
    diagram_nodes = []
    diagram_edges = []
    diagram_summaries = []

    # ── 1. Create Root Video-Title Concept Node ───────────────
    root_node_diag = {
        "nodeId": "root_node",
        "label": video_title,
        "text": f"Central topic of this lecture covering {len(segments)} interactive segments.",
        "position": {"col": 1, "row": 1},
        "accent": "primary",
    }
    diagram_nodes.append(root_node_diag)

    # ── 2. Process Child Concept Segments ─────────────────────
    for idx, seg in enumerate(segments, start=1):
        text = seg.get("text", "")
        start_time = float(seg.get("start_time", 0.0))
        end_time = float(seg.get("end_time", start_time + 15.0))

        # Extract concept label
        label_raw = seg.get("label") or ""
        match = re.search(r"\[([A-Z\s_]+)\]", text)
        if match:
            raw_concept = match.group(1).strip()
            clean_text = text.replace(match.group(0), "").strip()
        elif label_raw and label_raw != "SIGN":
            raw_concept = label_raw.replace("_", " ").title()
            clean_text = text
        else:
            words = [w for w in re.findall(r"\b[A-Za-z]{4,}\b", text) if w.lower() not in ("this", "sign", "that", "represents", "with", "from", "main", "used", "today", "will", "discuss")]
            raw_concept = words[0].title() if words else f"Concept {idx}"
            clean_text = text

        concept_id = f"dyn_c_{idx}_{video_id[:8] if isinstance(video_id, str) else 'v'}"
        question_id = f"dyn_q_{idx}_{video_id[:8] if isinstance(video_id, str) else 'v'}"

        # Build child concept node
        child_node = {
            "conceptId": concept_id,
            "conceptName": f"{raw_concept} ({video_title})",
            "grade": "O/L",
            "unit": video_title,
            "videoId": str(video_id),
            "videoTitle": video_title,
            "description": clean_text or f"Core principles of {raw_concept} within {video_title}.",
            "keywords": [raw_concept, video_title] + [w for w in clean_text.split() if len(w) > 4][:3],
            "prerequisites": [root_concept_id] if idx == 1 else [generated_concepts[-1]["conceptId"]],
            "relatedConcepts": [root_concept_id],
            "difficultyLevel": "medium" if idx % 2 == 0 else "easy",
            "sortOrder": idx + 1,
            "updatedAt": now,
        }
        generated_concepts.append(child_node)

        # Diagram branch node
        col = (idx % 3) + 1
        row = (idx // 3) + 2
        diag_node_id = f"node_{idx}"
        diagram_nodes.append({
            "nodeId": diag_node_id,
            "label": raw_concept,
            "text": clean_text[:65] + ("..." if len(clean_text) > 65 else ""),
            "position": {"col": col, "row": row},
            "accent": "accent" if idx % 2 == 0 else "warning",
        })

        # Diagram Edge: connect from root or previous subtopic
        parent_node_id = "root_node" if idx <= 2 else f"node_{idx - 1}"
        diagram_edges.append({
            "from": parent_node_id,
            "to": diag_node_id,
            "label": "Explains" if idx % 2 == 0 else "Covers",
        })

        if len(diagram_summaries) < 3:
            diagram_summaries.append(f"{raw_concept}: {clean_text[:75]}")

        # ── 3. Build Dynamic MCQ ──────────────────────────────
        correct_answer = f"{raw_concept} Function"
        options = [correct_answer]
        for d in distractor_bank:
            if d != correct_answer and d not in options:
                options.append(d)
            if len(options) == 4:
                break

        # Deterministic shuffle
        if idx % 2 == 0:
            options = [options[1], options[0], options[2], options[3]]
        elif idx % 3 == 0:
            options = [options[2], options[1], options[3], options[0]]

        question_doc = {
            "questionId": question_id,
            "conceptId": concept_id,
            "conceptName": f"{raw_concept} ({video_title})",
            "questionText": f"Based on '{video_title}' at {int(start_time)}s: What is the primary role of {raw_concept}?",
            "options": options,
            "correctAnswer": correct_answer,
            "explanation": f"According to '{video_title}': '{clean_text or text}'",
            "difficultyLevel": "medium" if idx % 2 == 0 else "easy",
            "sortOrder": idx,
            "updatedAt": now,
        }
        generated_questions.append(question_doc)

        # ── 4. Append Timeline Segment ─────────────────────────
        timeline_segments.append({
            "segmentId": f"seg_{idx}",
            "conceptId": concept_id,
            "conceptName": f"{raw_concept} ({video_title})",
            "startTime": start_time,
            "endTime": end_time,
            "transcriptText": clean_text or text,
        })

    # Assemble visual diagram for root concept node
    max_row = max(n["position"]["row"] for n in diagram_nodes) if diagram_nodes else 2
    root_diagram = {
        "diagramId": f"diag_{video_id}",
        "title": video_title,
        "subtitle": f"Interactive Knowledge Graph for '{video_title}' ({len(segments)} Segments)",
        "layout": {"columns": 3, "rows": max_row},
        "nodes": diagram_nodes,
        "edges": diagram_edges,
        "summaryPoints": diagram_summaries or [f"Core syllabus lecture on {video_title}."],
    }

    # Root concept doc
    root_concept_doc = {
        "conceptId": root_concept_id,
        "conceptName": video_title,
        "grade": "O/L",
        "unit": video_title,
        "videoId": str(video_id),
        "videoTitle": video_title,
        "description": f"Core curriculum concepts covered in the video lecture '{video_title}'.",
        "keywords": [video_title] + [c["conceptName"] for c in generated_concepts[:4]],
        "prerequisites": [],
        "relatedConcepts": [c["conceptId"] for c in generated_concepts[:4]],
        "difficultyLevel": "medium",
        "diagram": root_diagram,
        "isRoot": True,
        "sortOrder": 1,
        "updatedAt": now,
    }

    # ── 5. Upsert to MongoDB Collections ──────────────────────
    # A) Upsert Root Concept
    await db[KNOWLEDGE_GRAPH_COLLECTION].update_one(
        {"conceptId": root_concept_id},
        {"$set": root_concept_doc},
        upsert=True,
    )

    # B) Upsert Child Concepts
    for c in generated_concepts:
        # Include root diagram reference if child has none
        c["diagram"] = root_diagram
        await db[KNOWLEDGE_GRAPH_COLLECTION].update_one(
            {"conceptId": c["conceptId"]},
            {"$set": c},
            upsert=True,
        )

    # C) Upsert Questions
    for q in generated_questions:
        await db[POPUP_QUESTIONS_COLLECTION].update_one(
            {"questionId": q["questionId"]},
            {"$set": q},
            upsert=True,
        )

    # D) Upsert Timeline
    timeline_doc = {
        "lessonId": str(video_id),
        "title": video_title,
        "timeline": timeline_segments,
        "updatedAt": now,
    }
    await db[LESSON_TIMELINES_COLLECTION].update_one(
        {"lessonId": str(video_id)},
        {"$set": timeline_doc},
        upsert=True,
    )

    # E) Sync Root Concept into Syllabus Topics & Lesson Summaries for Chatbot
    syllabus_topic_doc = {
        "topicId": root_concept_id,
        "topicName": video_title,
        "description": root_concept_doc["description"],
        "summary": root_concept_doc["description"],
        "keyPoints": [c["conceptName"] for c in generated_concepts[:4]],
        "subtopics": [c["conceptName"] for c in generated_concepts[:4]],
        "prerequisites": [],
        "simpleDefinitions": [root_concept_doc["description"]],
        "examples": [],
        "keywords": root_concept_doc["keywords"],
        "sampleQuestions": [q["questionText"] for q in generated_questions[:2]],
        "examQuestions": [q["questionText"] for q in generated_questions[2:4]],
        "microChallenges": [
            {
                "challengeId": f"{root_concept_id}_mc_{i}",
                "questionText": q["questionText"],
                "options": q["options"],
                "correctAnswer": q["correctAnswer"],
                "explanation": q["explanation"],
                "difficultyLevel": 1,
            }
            for i, q in enumerate(generated_questions[:3], start=1)
        ],
        "subject": "O/L ICT",
        "datasetVersion": "video-title-sync",
        "videoId": str(video_id),
        "sortOrder": 10,
        "updatedAt": now,
    }

    await db[ICT_SYLLABUS_TOPICS_COLLECTION].update_one(
        {"topicId": root_concept_id},
        {"$set": syllabus_topic_doc},
        upsert=True,
    )

    await db[LESSON_SUMMARIES_COLLECTION].update_one(
        {"topicId": root_concept_id},
        {
            "$set": {
                "topicId": root_concept_id,
                "topicName": video_title,
                "summaryText": root_concept_doc["description"],
                "keyPoints": syllabus_topic_doc["keyPoints"],
                "examTips": [f"Review {video_title} key terms and interactive checkpoints before tests."],
                "updatedAt": now,
            }
        },
        upsert=True,
    )

    print(f"[Dynamic Generator] Created Video Root '{video_title}' with {len(generated_concepts)} child concepts & {len(generated_questions)} MCQs for video {video_id}")
    return {
        "status": "success",
        "video_title": video_title,
        "root_concept_id": root_concept_id,
        "concepts_created": len(generated_concepts) + 1,
        "questions_created": len(generated_questions),
    }
