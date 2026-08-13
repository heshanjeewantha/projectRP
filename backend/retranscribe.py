import asyncio

from src.common.database.connection import close_db, connect_db, get_db
from src.modules.component_01_attention_monitoring.services.transcription_service import (
    transcribe_video,
)

async def retranscribe_latest():
    await connect_db()
    db = get_db()
    
    # Get all videos
    videos = await db["videos"].find().to_list(length=100)
    print(f"Found {len(videos)} videos to retranscribe.")
    
    for v in videos:
        print(f"Retranscribing {v['title']} ({v['_id']})...")
        await transcribe_video(str(v["_id"]), v["storage_path"])
        
    print("Done retranscribing.")
    await close_db()

if __name__ == "__main__":
    asyncio.run(retranscribe_latest())
