from typing import Dict, Any, Optional
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # session_id -> {participant_id: {"websocket": WebSocket, "role": str, "name": str}}
        self.active_connections: Dict[str, Dict[str, Dict[str, Any]]] = {}

    async def connect(self, session_id: str, participant_id: str, websocket: WebSocket, role: str = "participant", name: str = ""):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = {}
        
        self.active_connections[session_id][participant_id] = {
            "websocket": websocket,
            "role": role,
            "name": name,
        }

    def disconnect(self, session_id: str, participant_id: str):
        if session_id in self.active_connections:
            if participant_id in self.active_connections[session_id]:
                del self.active_connections[session_id][participant_id]
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    def get_role(self, session_id: str, participant_id: str) -> Optional[str]:
        if session_id in self.active_connections and participant_id in self.active_connections[session_id]:
            return self.active_connections[session_id][participant_id].get("role")
        return None

    async def send_personal(self, session_id: str, participant_id: str, message: dict):
        if session_id in self.active_connections and participant_id in self.active_connections[session_id]:
            ws = self.active_connections[session_id][participant_id]["websocket"]
            await ws.send_json(message)

    async def broadcast(self, session_id: str, message: dict, exclude_participant_id: Optional[str] = None):
        if session_id in self.active_connections:
            for pid, conn in list(self.active_connections[session_id].items()):
                if exclude_participant_id and pid == exclude_participant_id:
                    continue
                try:
                    await conn["websocket"].send_json(message)
                except Exception:
                    # Stale connection handling
                    pass

manager = ConnectionManager()
