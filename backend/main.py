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

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static uploaded files (videos)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


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
