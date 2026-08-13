import asyncio

from motor.motor_asyncio import AsyncIOMotorClient
from src.common.config.settings import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    count = await db.videos.count_documents({})
    print(f"Total videos: {count}")
    videos = await db.videos.find().to_list(length=10)
    for v in videos:
        print(v)

asyncio.run(main())
