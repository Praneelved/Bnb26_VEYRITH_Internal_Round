# Roundtable Backend

FastAPI backend foundation for **Roundtable – Live Captions for Group Conversations**.

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser Clients                    │
│   (Host / Participant Phones & Laptops / Viewers)       │
└────────────────────────────┬────────────────────────────┘
                             │ REST API / WebSockets
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   FastAPI Application                   │
│   ┌───────────────────────┬─────────────────────────┐   │
│   │    REST Routers       │    WebSocket Handler    │   │
│   │ (/api/health, sessions)│  (/ws/sessions/{id})    │   │
│   └───────────┬───────────┴────────────┬────────────┘   │
│               │                        │                │
│               ▼                        ▼                │
│   ┌─────────────────────────────────────────────────┐   │
│   │           Session & Participant Services        │   │
│   └────────────────────────┬────────────────────────┘   │
└────────────────────────────┼────────────────────────────┘
                             │ SQLAlchemy ORM
                             ▼
┌─────────────────────────────────────────────────────────┐
│                 Database (SQLite / PostgreSQL)          │
│            [sessions, participants, captions]           │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 How to Run Locally

### 1. Setup Virtual Environment & Install Dependencies

```bash
cd backend
python -m venv .venv
```

**Activate Environment:**
- **Windows (PowerShell):**
  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```
- **Linux / macOS:**
  ```bash
  source .venv/bin/activate
  ```

**Install Packages:**
```bash
pip install -r requirements.txt
```

### 2. Start the Server

```bash
uvicorn app.main:app --reload --port 8000
```

- **Health Check:** `http://localhost:8000/api/health`
- **Swagger Interactive API Docs:** `http://localhost:8000/docs`
- **ReDoc API Docs:** `http://localhost:8000/redoc`

---

## 🧪 Running Tests

Run the full pytest suite:

```bash
pytest
```

---

## 📖 API Documentation

### Health Check
- **`GET /api/health`**
  - **Auth:** None
  - **Response:**
    ```json
    {
      "status": "ok",
      "service": "roundtable-backend"
    }
    ```

### Sessions
- **`POST /api/sessions`**
  - **Auth:** None
  - **Request Body (Optional):**
    ```json
    {
      "mode": "fused"
    }
    ```
  - **Response:**
    ```json
    {
      "session_id": "8f3b2a1c-...",
      "code": "ABC123",
      "status": "lobby",
      "mode": "fused",
      "created_at": "2026-10-03T22:00:00"
    }
    ```

- **`POST /api/sessions/{code}/join`**
  - **Auth:** None
  - **Request Body:**
    ```json
    {
      "name": "Praneel",
      "role": "participant",
      "device_id": "optional-device-uuid"
    }
    ```
  - **Response:**
    ```json
    {
      "participant_id": "p-1234-...",
      "session_id": "s-5678-...",
      "code": "ABC123",
      "role": "participant",
      "token": "eyJhbGciOi...",
      "resume_token": "r-9012-..."
    }
    ```

- **`GET /api/sessions/{session_id}`**
  - **Auth:** Optional
  - **Response:** Session object details.

- **`POST /api/sessions/{session_id}/start`**
  - **Auth:** Host JWT (`Authorization: Bearer <token>`)
  - **Response:** `{"session_id": "...", "status": "live"}`

- **`POST /api/sessions/{session_id}/end`**
  - **Auth:** Host JWT (`Authorization: Bearer <token>`)
  - **Response:** `{"session_id": "...", "status": "ended"}`

### Participants
- **`GET /api/sessions/{session_id}/participants`**
  - **Auth:** None
  - **Response:** Array of participant objects.

- **`POST /api/sessions/{session_id}/participants/{participant_id}/leave`**
  - **Auth:** None
  - **Response:** `{"participant_id": "...", "status": "left"}`

---

## ⚡ WebSocket Interface

- **Endpoint:** `ws://localhost:8000/ws/sessions/{session_id}?token=<JWT_TOKEN>`

### Client Messages:
1. `{"type": "ping"}`
2. `{"type": "presence"}`
3. `{"type": "audio", "data": "..."}` *(Forbidden for `viewer` role)*

### Server Messages:
1. `{"type": "pong"}`
2. `{"type": "session_state", "status": "lobby|live|ended"}`
3. `{"type": "participant_joined", "participant_id": "...", "display_name": "..."}`
4. `{"type": "participant_left", "participant_id": "..."}`
5. `{"type": "caption", "caption_id": "...", "speaker_name": "...", "text": "...", "is_final": false}`
6. `{"type": "audio_ack", "status": "received"}`
7. `{"type": "error", "code": "...", "message": "..."}`

---

## 🔮 Future ML Pipeline Integration

```
Audio Capture (Client)
         ↓
  WebSocket Frame
         ↓
  Per-device VAD
         ↓
 Clock Alignment
         ↓
Speaker Attribution
         ↓
Best-Channel / Fusion
         ↓
   Streaming ASR
         ↓
Partial/Final Captions
         ↓
 WebSocket Broadcast
```
