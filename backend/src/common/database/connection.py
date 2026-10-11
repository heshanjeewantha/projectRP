"""
core/database.py
MongoDB async connection using Motor driver with connection timeout handling and Atlas resilience.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import AutoReconnect, ConnectionFailure
from ..config.settings import settings

client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    """Return the global client or initialize a new one on-demand."""
    global client
    if client is None:
        client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=15000,
            connectTimeoutMS=15000,
            socketTimeoutMS=25000,
            maxIdleTimeMS=45000,
            waitQueueTimeoutMS=10000,
            readPreference="primaryPreferred",
            retryWrites=True,
            retryReads=True,
        )
    return client


def reset_client():
    """Reset the global MongoDB client if a connection pool error occurs."""
    global client
    if client:
        try:
            client.close()
        except Exception:
            pass
    client = None


async def connect_db():
    """Open MongoDB connection on startup with ping verification."""
    c = get_client()
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


async def with_db_retry(coro_fn, max_retries: int = 3, delay: float = 0.4):
    """
    Execute a database coroutine with automatic retry on AutoReconnect/ConnectionFailure.
    Useful for cloud MongoDB Atlas when idle connections are pruned or shards failover.
    """
    last_err = None
    for attempt in range(max_retries):
        try:
            return await coro_fn()
        except (AutoReconnect, ConnectionFailure) as exc:
            last_err = exc
            if attempt == max_retries - 1:
                reset_client()
                raise
            await asyncio.sleep(delay * (attempt + 1))
    if last_err:
        raise last_err

