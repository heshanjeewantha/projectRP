"""
main.py
FastAPI entrypoint.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.common.auth import auth_routes, auth_service
from src.common.config.settings import settings
from src.common.database.connection import close_db, connect_db
from src.modules.component_01_attention_monitoring.routes import (
    attention_routes,
    missed_segment_routes,
    transcript_routes,
    video_routes,
    websocket_routes,
)
from src.modules.component_02_knowledge_graph_question_system.routes import knowledge_graph_routes
from src.modules.component_02_knowledge_graph_question_system.services import knowledge_graph_service
from src.modules.component_03_adaptive_chatbot.routes import (
    chatbot_analytics_routes,
    chatbot_routes,
)
from src.modules.component_03_adaptive_chatbot.services import chatbot_service
from src.modules.component_04_sign_avatar_lecture_generator.routes import (
    sign_avatar_routes,
    signs_routes,
)
from src.modules.component_04_sign_avatar_lecture_generator.services import sign_avatar_service
from src.modules.component_05_smart_wristband_iot.routes import wristband_routes
from src.modules.component_05_smart_wristband_iot.services import wristband_service

app = FastAPI(title="Attention-Aware Sign Language API", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from pathlib import Path
from fastapi import Request, HTTPException, status
from fastapi.responses import StreamingResponse

@app.get("/uploads/{filename}")
async def stream_video_file(filename: str, request: Request):
    """
    Streams video with full HTTP 206 Partial Content (Byte Ranges)
    so HTML5 video players can seek, forward (+10s), and rewind smoothly.
    """
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        available = list(Path(settings.UPLOAD_DIR).glob("*.mp4"))
        if available:
            file_path = str(available[0])
        else:
            raise HTTPException(status_code=404, detail="Video file not found")

    file_size = os.path.getsize(file_path)
    range_header = request.headers.get("range")

    if not range_header:
        def iter_full():
            with open(file_path, "rb") as f:
                while chunk := f.read(1024 * 1024):
                    yield chunk
        headers = {
            "Accept-Ranges": "bytes",
            "Content-Length": str(file_size),
            "Content-Type": "video/mp4",
        }
        return StreamingResponse(iter_full(), status_code=200, headers=headers)

    try:
        range_str = range_header.replace("bytes=", "").strip()
        parts = range_str.split("-")
        start = int(parts[0]) if parts[0] else 0
        end = int(parts[1]) if len(parts) > 1 and parts[1] else file_size - 1
    except ValueError:
        raise HTTPException(status_code=416, detail="Invalid Range header")

    if start >= file_size or end >= file_size or start > end:
        raise HTTPException(
            status_code=416,
            detail="Range not satisfiable",
            headers={"Content-Range": f"bytes */{file_size}"}
        )

    chunk_size = end - start + 1

    def iter_range():
        with open(file_path, "rb") as f:
            f.seek(start)
            remaining = chunk_size
            while remaining > 0:
                read_len = min(remaining, 1024 * 1024)
                data = f.read(read_len)
                if not data:
                    break
                remaining -= len(data)
                yield data

    headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(chunk_size),
        "Content-Type": "video/mp4",
    }
    return StreamingResponse(
        iter_range(), status_code=status.HTTP_206_PARTIAL_CONTENT, headers=headers
    )

# Fallback mount for non-video static files
app.mount("/uploads-static", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads-static")


import asyncio


@app.on_event("startup")
async def startup_db_client():
    async def _background_init():
        try:
            await connect_db()
            await auth_service.initialize_auth_data()
            await knowledge_graph_service.initialize_knowledge_graph()
            await chatbot_service.initialize_chatbot_data()
            await sign_avatar_service.initialize_sign_avatar_data()
            await wristband_service.initialize_wristband_data()
        except Exception as err:
            print(f"[Startup Warning] Background initialization note: {err}")

    asyncio.create_task(_background_init())


@app.on_event("shutdown")
async def shutdown_db_client():
    await close_db()


# Include Routers
app.include_router(auth_routes.router)
app.include_router(video_routes.router)
app.include_router(transcript_routes.router)
app.include_router(attention_routes.router)
app.include_router(missed_segment_routes.router)
app.include_router(signs_routes.router)
app.include_router(websocket_routes.router)
app.include_router(knowledge_graph_routes.router)
app.include_router(chatbot_routes.router)
app.include_router(chatbot_analytics_routes.reinforcement_router)
app.include_router(chatbot_analytics_routes.concept_router)
app.include_router(chatbot_analytics_routes.repeated_query_router)
app.include_router(chatbot_analytics_routes.analytics_router)
app.include_router(sign_avatar_routes.router)
app.include_router(sign_avatar_routes.lecture_router)
app.include_router(wristband_routes.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Attention-Aware Sign Language API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
