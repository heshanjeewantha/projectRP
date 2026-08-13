"""
core/websocket_manager.py
Manages active WebSocket connections keyed by session_id.
"""
from fastapi import WebSocket
from typing import Dict


class WebSocketManager:
    def __init__(self):
        # session_id -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        print(f"[WS] Session connected: {session_id}")

    def disconnect(self, session_id: str):
        self.active_connections.pop(session_id, None)
        print(f"[WS] Session disconnected: {session_id}")

    async def send_json(self, session_id: str, data: dict):
        """Send JSON message to a specific session."""
        ws = self.active_connections.get(session_id)
        if ws:
            await ws.send_json(data)

    async def broadcast(self, data: dict):
        """Broadcast JSON to all connected sessions."""
        for ws in self.active_connections.values():
            await ws.send_json(data)


ws_manager = WebSocketManager()
