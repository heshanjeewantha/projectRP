import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.common.database.connection import close_db, connect_db
from src.modules.component_01_attention_monitoring.models.video import VideoOut
from src.modules.component_01_attention_monitoring.services.video_service import (
    list_videos,
)

async def main():
    await connect_db()
    try:
        videos = await list_videos()
        print("Raw dicts:", len(videos))
        if videos:
            print("First video keys:", videos[0].keys())
        
        # Manually validate against Pydantic model
        for v in videos:
            try:
                model = VideoOut(**v)
                print(f"Validated {model.id} successfully")
            except Exception as e:
                print(f"Validation failed for video {v.get('_id')}:")
                print(e)
                break
    finally:
        await close_db()

asyncio.run(main())
