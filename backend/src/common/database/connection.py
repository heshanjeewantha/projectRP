"""
core/database.py
MongoDB async connection using Motor driver with connection timeout handling.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from ..config.settings import settings

client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    """Return the global client or initialize a new one on-demand."""
    global client
    if client is None:
        client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=8000,
            connectTimeoutMS=8000,
            readPreference="primaryPreferred",
            retryWrites=True,
            retryReads=True,
        )
    return client


async def connect_db():
    """Open MongoDB connection on startup with 10s timeout."""
    c = get_client()
    # Ping the server to verify connection
    await c.admin.command("ping")
    print("[DB] Connected to MongoDB successfully")


async def close_db():
    """Close MongoDB connection on shutdown."""
    global client
    if client:
        client.close()
        client = None
        print("[DB] MongoDB connection closed")


def get_db():
    """Return the database instance."""
    c = get_client()
    return c[settings.DATABASE_NAME]
