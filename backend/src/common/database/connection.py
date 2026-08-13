"""
core/database.py
MongoDB async connection using Motor driver.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from ..config.settings import settings

client: AsyncIOMotorClient = None


async def connect_db():
    """Open MongoDB connection on startup."""
    global client
    client = AsyncIOMotorClient(settings.MONGODB_URI)
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
