import uuid
from datetime import datetime
import logging
import json
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, Depends, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, SessionLocal, get_db
from app.api import health_router, sessions_router, participants_router, scheduled_router
from app.auth import decode_access_token
from app.websocket import manager
from app.services import get_session_by_id, get_participant_by_id, get_session_participants

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

# CORS configuration — include all frontend origins
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "https://bnb26-veyrith-internal-round.vercel.app",
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
app.include_router(scheduled_router)

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

        # Send initial session state with current participant list
        participants_objs = get_session_participants(db, session_id)
        participants_data = [
            {
                "id": p.id,
                "participant_id": p.id,
                "name": p.display_name,
                "display_name": p.display_name,
                "role": p.role,
                "connectionState": "connected",
                "audioQuality": "good",
                "isSpeaking": False,
                "isMuted": False,
            }
            for p in participants_objs
            if getattr(p, "status", "connected") != "left"
        ]

        await websocket.send_json({
            "type": "session_state",
            "session_id": session_id,
            "status": session_obj.status,
            "phase": session_obj.status,
            "mode": session_obj.mode,
            "name": getattr(session_obj, "name", "Roundtable"),
            "participants": participants_data,
            "payload": {
                "phase": session_obj.status,
                "status": session_obj.status,
                "participants": participants_data,
            }
        })

        # Broadcast participant joined event to all participants
        await manager.broadcast(
            session_id,
            {
                "type": "participant_joined",
                "id": participant_id,
                "participant_id": participant_id,
                "name": display_name,
                "display_name": display_name,
                "role": role,
                "payload": {
                    "id": participant_id,
                    "name": display_name,
                    "role": role,
                }
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
            payload = data.get("payload") or data

            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})

            elif msg_type == "heartbeat":
                client_ts = payload.get("client_ts") or data.get("client_ts")
                resp = {"type": "heartbeat", "payload": {"client_ts": client_ts}}
                if client_ts is not None:
                    resp["client_ts"] = client_ts
                await websocket.send_json(resp)

            elif msg_type == "presence":
                db_session = get_session_by_id(db, session_id)
                await websocket.send_json({
                    "type": "session_state",
                    "session_id": session_id,
                    "status": db_session.status if db_session else "unknown",
                    "phase": db_session.status if db_session else "unknown",
                    "mode": db_session.mode if db_session else "fused"
                })

            elif msg_type in ("audio", "audio_frame"):
                current_role = manager.get_role(session_id, participant_id) or role
                if current_role == "viewer":
                    await websocket.send_json({
                        "type": "error",
                        "code": "FORBIDDEN",
                        "message": "Viewers are not allowed to send audio data"
                    })
                else:
                    await websocket.send_json({
                        "type": "audio_ack",
                        "status": "received",
                        "participant_id": participant_id
                    })

            elif msg_type in ("caption", "caption_partial", "caption_final"):
                # Broadcast live captions from speech recognition across participants
                is_final = payload.get("is_final", False)
                out_type = "caption_final" if is_final or msg_type == "caption_final" else "caption_partial"
                caption_msg = {
                    "type": out_type,
                    "caption_id": payload.get("caption_id") or payload.get("id"),
                    "speaker_id": payload.get("speaker_id") or participant_id,
                    "speaker_name": payload.get("speaker_name") or display_name,
                    "text": payload.get("text", ""),
                    "started_at": payload.get("started_at") or int(datetime.utcnow().timestamp() * 1000),
                    "finalized_at": int(datetime.utcnow().timestamp() * 1000) if is_final else None,
                    "payload": {
                        "caption_id": payload.get("caption_id") or payload.get("id"),
                        "speaker_id": payload.get("speaker_id") or participant_id,
                        "speaker_name": payload.get("speaker_name") or display_name,
                        "text": payload.get("text", ""),
                        "started_at": payload.get("started_at") or int(datetime.utcnow().timestamp() * 1000),
                        "finalized_at": int(datetime.utcnow().timestamp() * 1000) if is_final else None,
                    }
                }
                # Broadcast to other participants
                await manager.broadcast(session_id, caption_msg, exclude_participant_id=participant_id)

            elif msg_type in ("chat", "chat_message"):
                chat_msg = {
                    "type": "chat_message",
                    "id": str(uuid.uuid4()),
                    "sender_id": participant_id,
                    "sender_name": display_name,
                    "text": payload.get("text", ""),
                    "timestamp": datetime.utcnow().isoformat(),
                    "payload": {
                        "id": str(uuid.uuid4()),
                        "sender_id": participant_id,
                        "sender_name": display_name,
                        "text": payload.get("text", ""),
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                }
                await manager.broadcast(session_id, chat_msg)

            elif msg_type in ("raise_hand", "hand_raise"):
                await manager.broadcast(session_id, {
                    "type": "raise_hand",
                    "participant_id": participant_id,
                    "raised": payload.get("raised", True),
                    "payload": {
                        "participant_id": participant_id,
                        "raised": payload.get("raised", True),
                    }
                })

            else:
                # Silently accept or ack other client messages to avoid error spam
                await websocket.send_json({
                    "type": f"{msg_type}_ack",
                    "status": "ok"
                })

    except WebSocketDisconnect:
        manager.disconnect(session_id, participant_id)
        logger.info(f"WebSocket client disconnected: session={session_id}, participant={participant_id}")
        await manager.broadcast(session_id, {
            "type": "participant_left",
            "id": participant_id,
            "participant_id": participant_id,
            "payload": {
                "id": participant_id,
                "participant_id": participant_id,
            }
        })
