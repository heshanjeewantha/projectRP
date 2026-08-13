import asyncio
import math

from src.common.database.connection import close_db, connect_db
from src.modules.component_01_attention_monitoring.services.video_service import (
    list_videos,
)

async def main():
    await connect_db()
    try:
        videos = await list_videos()
        for v in videos:
            dur = v.get('duration_seconds')
            print(f"Video {v.get('id')}: duration = {dur}, is_nan = {math.isnan(dur) if isinstance(dur, float) else 'N/A'}")
    finally:
        await close_db()

asyncio.run(main())
