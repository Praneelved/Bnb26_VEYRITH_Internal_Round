import logging
import json
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, Depends, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, SessionLocal, get_db
from app.api import health_router, sessions_router, participants_router
from app.auth import decode_access_token
from app.websocket import manager
from app.services import get_session_by_id, get_participant_by_id

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("roundtable")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatic database table creation on startup
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialization complete.")
    yield
    logger.info("Shutting down application...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Real-time multi-device group conversation live captioning backend foundation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(health_router)
app.include_router(sessions_router)
app.include_router(participants_router)

@app.websocket("/ws/sessions/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        # Validate session existence and state
        session_obj = get_session_by_id(db, session_id)
        if not session_obj:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Session not found")
            return
        if session_obj.status == "ended":
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Session has ended")
            return

        # Authenticate via JWT token query param if provided
        participant_id = "anonymous"
        role = "participant"
        display_name = "Guest"

        if token:
            try:
                payload = decode_access_token(token)
                if payload.get("session_id") != session_id:
                    await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Session mismatch")
                    return
                participant_id = payload.get("participant_id", participant_id)
                role = payload.get("role", role)

                participant_obj = get_participant_by_id(db, participant_id)
                if participant_obj:
                    display_name = participant_obj.display_name
            except Exception as e:
                logger.warning(f"WebSocket auth failed: {e}")
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid authentication token")
                return

        await manager.connect(session_id, participant_id, websocket, role=role, name=display_name)
        logger.info(f"WebSocket client connected: session={session_id}, participant={participant_id}, role={role}")

        # Send initial session state
        await websocket.send_json({
            "type": "session_state",
            "session_id": session_id,
            "status": session_obj.status,
            "mode": session_obj.mode
        })

        # Broadcast participant joined event
        await manager.broadcast(
            session_id,
            {
                "type": "participant_joined",
                "participant_id": participant_id,
                "display_name": display_name,
                "role": role
            },
            exclude_participant_id=participant_id
        )

        while True:
            data_text = await websocket.receive_text()
            try:
                data = json.loads(data_text)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "code": "INVALID_JSON", "message": "Invalid JSON format"})
                continue

            msg_type = data.get("type")

            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})

            elif msg_type == "presence":
                db_session = get_session_by_id(db, session_id)
                await websocket.send_json({
                    "type": "session_state",
                    "session_id": session_id,
                    "status": db_session.status if db_session else "unknown",
                    "mode": db_session.mode if db_session else "fused"
                })

            elif msg_type == "audio":
                # Check role: Viewers cannot send audio!
                current_role = manager.get_role(session_id, participant_id) or role
                if current_role == "viewer":
                    await websocket.send_json({
                        "type": "error",
                        "code": "FORBIDDEN",
                        "message": "Viewers are not allowed to send audio data"
                    })
                else:
                    # Validate and acknowledge audio frame foundation
                    await websocket.send_json({
                        "type": "audio_ack",
                        "status": "received",
                        "participant_id": participant_id
                    })

            else:
                await websocket.send_json({
                    "type": "error",
                    "code": "UNKNOWN_MESSAGE_TYPE",
                    "message": f"Unsupported message type: {msg_type}"
                })

    except WebSocketDisconnect:
        manager.disconnect(session_id, participant_id)
        logger.info(f"WebSocket client disconnected: session={session_id}, participant={participant_id}")
        await manager.broadcast(session_id, {
            "type": "participant_left",
            "participant_id": participant_id
        })
