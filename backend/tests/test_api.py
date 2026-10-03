import pytest
from fastapi.testclient import TestClient

def test_1_health_check(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "roundtable-backend"

def test_2_session_creation(client: TestClient):
    response = client.post("/api/sessions", json={"mode": "fused"})
    assert response.status_code == 201
    data = response.json()
    assert "session_id" in data
    assert "code" in data
    assert len(data["code"]) == 6
    assert data["status"] == "lobby"
    assert data["mode"] == "fused"

def test_3_join_session(client: TestClient):
    session_res = client.post("/api/sessions", json={"mode": "fused"}).json()
    code = session_res["code"]

    join_res = client.post(f"/api/sessions/{code}/join", json={
        "name": "Praneel",
        "role": "host"
    })
    assert join_res.status_code == 200
    data = join_res.json()
    assert data["code"] == code
    assert data["role"] == "host"
    assert "token" in data
    assert "participant_id" in data
    assert "resume_token" in data

def test_4_invalid_meeting_code(client: TestClient):
    join_res = client.post("/api/sessions/INVALID/join", json={
        "name": "Ghost",
        "role": "participant"
    })
    assert join_res.status_code == 404
    assert join_res.json()["detail"] == "Invalid meeting code"

def test_5_start_session(client: TestClient):
    session_res = client.post("/api/sessions", json={"mode": "fused"}).json()
    code = session_res["code"]
    session_id = session_res["session_id"]

    host_join = client.post(f"/api/sessions/{code}/join", json={
        "name": "HostUser",
        "role": "host"
    }).json()

    headers = {"Authorization": f"Bearer {host_join['token']}"}
    start_res = client.post(f"/api/sessions/{session_id}/start", headers=headers)
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "live"

def test_6_end_session(client: TestClient):
    session_res = client.post("/api/sessions", json={"mode": "fused"}).json()
    code = session_res["code"]
    session_id = session_res["session_id"]

    host_join = client.post(f"/api/sessions/{code}/join", json={
        "name": "HostUser",
        "role": "host"
    }).json()

    headers = {"Authorization": f"Bearer {host_join['token']}"}
    # Start session first
    client.post(f"/api/sessions/{session_id}/start", headers=headers)
    
    # End session
    end_res = client.post(f"/api/sessions/{session_id}/end", headers=headers)
    assert end_res.status_code == 200
    assert end_res.json()["status"] == "ended"

def test_7_participant_listing(client: TestClient):
    session_res = client.post("/api/sessions", json={"mode": "fused"}).json()
    code = session_res["code"]
    session_id = session_res["session_id"]

    client.post(f"/api/sessions/{code}/join", json={"name": "Alice", "role": "host"})
    client.post(f"/api/sessions/{code}/join", json={"name": "Bob", "role": "participant"})

    list_res = client.get(f"/api/sessions/{session_id}/participants")
    assert list_res.status_code == 200
    participants = list_res.json()
    assert len(participants) == 2
    names = [p["display_name"] for p in participants]
    assert "Alice" in names
    assert "Bob" in names

def test_8_websocket_connection(client: TestClient):
    session_res = client.post("/api/sessions", json={"mode": "fused"}).json()
    code = session_res["code"]
    session_id = session_res["session_id"]

    join_res = client.post(f"/api/sessions/{code}/join", json={
        "name": "WebSocketUser",
        "role": "participant"
    }).json()

    token = join_res["token"]

    with client.websocket_connect(f"/ws/sessions/{session_id}?token={token}") as websocket:
        # First message received is session_state
        state_msg = websocket.receive_json()
        assert state_msg["type"] == "session_state"

        # Send ping
        websocket.send_json({"type": "ping"})
        pong_msg = websocket.receive_json()
        assert pong_msg["type"] == "pong"

def test_9_viewer_cannot_send_audio(client: TestClient):
    session_res = client.post("/api/sessions", json={"mode": "fused"}).json()
    code = session_res["code"]
    session_id = session_res["session_id"]

    viewer_join = client.post(f"/api/sessions/{code}/join", json={
        "name": "Spectator",
        "role": "viewer"
    }).json()

    token = viewer_join["token"]

    with client.websocket_connect(f"/ws/sessions/{session_id}?token={token}") as websocket:
        # Ignore initial session_state
        websocket.receive_json()

        # Viewer sends audio message
        websocket.send_json({"type": "audio", "data": "base64_data_here"})
        err_msg = websocket.receive_json()
        assert err_msg["type"] == "error"
        assert err_msg["code"] == "FORBIDDEN"

def test_10_ended_session_rejects_new_joins(client: TestClient):
    session_res = client.post("/api/sessions", json={"mode": "fused"}).json()
    code = session_res["code"]
    session_id = session_res["session_id"]

    host_join = client.post(f"/api/sessions/{code}/join", json={
        "name": "HostUser",
        "role": "host"
    }).json()

    headers = {"Authorization": f"Bearer {host_join['token']}"}
    client.post(f"/api/sessions/{session_id}/end", headers=headers)

    # Attempt to join ended session
    join_res = client.post(f"/api/sessions/{code}/join", json={
        "name": "LateUser",
        "role": "participant"
    })
    assert join_res.status_code == 400
    assert "ended" in join_res.json()["detail"].lower()
