"""
core/database.py
MongoDB async connection using Motor driver with connection timeout handling.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from ..config.settings import settings

client: AsyncIOMotorClient = None


async def connect_db():
    """Open MongoDB connection on startup with 3s timeout."""
    global client
    client = AsyncIOMotorClient(
        settings.MONGODB_URI,
        serverSelectionTimeoutMS=3000,
        connectTimeoutMS=3000,
    )
    print("[DB] Connected to MongoDB")


async def close_db():
    """Close MongoDB connection on shutdown."""
    global client
    if client:
        client.close()
        print("[DB] MongoDB connection closed")


def get_db():
    """Return the database instance."""
    return client[settings.DATABASE_NAME]
