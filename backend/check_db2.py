import asyncio

from motor.motor_asyncio import AsyncIOMotorClient
from src.common.config.settings import settings

async def main():
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
        db = client[settings.DATABASE_NAME]
        print("Pinging...")
        await client.admin.command('ping')
        print("Pinged successfully.")
        
        count = await db.videos.count_documents({})
        print(f"Total videos: {count}")
    except Exception as e:
        print("Error:", e)

asyncio.run(main())
