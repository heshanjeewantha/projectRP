import asyncio

from motor.motor_asyncio import AsyncIOMotorClient
from src.common.config.settings import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    
    videos = await db.videos.find().to_list(length=100)
    print(f"Total videos: {len(videos)}")
    
    for v in videos:
        t = await db.transcripts.find_one({"video_id": v["_id"]})
        if t:
            print(f"Video: {v['title']} ({v['_id']}) - Transcript found with {len(t['segments'])} segments")
        else:
            print(f"Video: {v['title']} ({v['_id']}) - NO TRANSCRIPT")

async def run():
    await main()

if __name__ == "__main__":
    asyncio.run(run())
