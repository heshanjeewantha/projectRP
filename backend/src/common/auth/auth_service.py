"""
Service layer for authentication and basic role-based users.
"""
from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status

from src.common.database.connection import get_db


USERS_COLLECTION = "users"


async def initialize_auth_data() -> None:
    db = get_db()
    await db[USERS_COLLECTION].create_index("email", unique=True)
    await _seed_default_users()


async def signup(payload: dict[str, Any]) -> dict[str, Any]:
    db = get_db()
    email = str(payload["email"]).strip().lower()
    existing = await db[USERS_COLLECTION].find_one({"email": email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    created_at = datetime.now(timezone.utc)
    doc = {
        "appUserId": _generate_app_user_id(payload.get("role", "student")),
        "fullName": payload["fullName"].strip(),
        "email": email,
        "passwordHash": _hash_password(payload["password"]),
        "role": payload.get("role", "student"),
        "createdAt": created_at,
        "updatedAt": created_at,
    }
    result = await db[USERS_COLLECTION].insert_one(doc)
    saved = await db[USERS_COLLECTION].find_one({"_id": result.inserted_id})
    return {
        "user": _serialize_user(saved),
        "message": "Account created successfully.",
    }


async def login(payload: dict[str, Any]) -> dict[str, Any]:
    db = get_db()
    email = str(payload["email"]).strip().lower()
    user = await db[USERS_COLLECTION].find_one({"email": email})
    if not user or user.get("passwordHash") != _hash_password(payload["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    return {
        "user": _serialize_user(user),
        "message": "Login successful.",
    }


async def _seed_default_users() -> None:
    db = get_db()
    seed_users = [
        {
            "fullName": "Admin User",
            "email": "admin@signlearn.ai",
            "password": "admin123",
            "role": "admin",
            "appUserId": "admin_demo_001",
        },
        {
            "fullName": "Student Demo",
            "email": "student@signlearn.ai",
            "password": "student123",
            "role": "student",
            "appUserId": "student_demo_123",
        },
    ]

    for item in seed_users:
        existing = await db[USERS_COLLECTION].find_one({"email": item["email"]})
        if existing:
            if existing.get("appUserId") != item["appUserId"]:
                await db[USERS_COLLECTION].update_one(
                    {"_id": existing["_id"]},
                    {"$set": {"appUserId": item["appUserId"], "updatedAt": datetime.now(timezone.utc)}},
                )
            continue
        created_at = datetime.now(timezone.utc)
        await db[USERS_COLLECTION].insert_one(
            {
                "appUserId": item["appUserId"],
                "fullName": item["fullName"],
                "email": item["email"],
                "passwordHash": _hash_password(item["password"]),
                "role": item["role"],
                "createdAt": created_at,
                "updatedAt": created_at,
            }
        )


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def _generate_app_user_id(role: str) -> str:
    prefix = "admin" if role == "admin" else "student"
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


def _serialize_user(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": doc.get("appUserId") or str(doc["_id"]),
        "fullName": doc["fullName"],
        "email": doc["email"],
        "role": doc["role"],
        "createdAt": doc["createdAt"],
    }
