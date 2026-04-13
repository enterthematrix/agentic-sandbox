import pytest
from fastapi.testclient import TestClient
import os
import json

# Setup env specifically for testing before importing anything else
os.environ["DB_PATH"] = ":memory:"
os.environ["SECRET_KEY"] = "test_secret_key"
os.environ["ALGORITHM"] = "HS256"

# Since DB_PATH is hardcoded in database.py, we monkey patch it
import database
database.DB_PATH = ":memory:"

from main import app, init_db
from database import get_connection

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    # Because sqlite in-memory db resets on every connection close if not shared,
    # mapping it strictly requires a shared connection for testing, OR we just use a file.
    # To keep simple, we'll use a test file
    test_db = "test_kanban.db"
    database.DB_PATH = test_db
    
    # Init clean DB
    if os.path.exists(test_db):
        os.remove(test_db)
        
    init_db()
    
    yield
    
    # Teardown
    if os.path.exists(test_db):
        os.remove(test_db)

@pytest.fixture
def auth_headers():
    response = client.post("/api/token", data={"username": "user", "password": "password"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_get_board_returns_default(auth_headers):
    response = client.get("/api/board", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "columns" in data
    assert "cards" in data
    assert len(data["columns"]) == 5 # Default columns length

def test_get_board_no_auth():
    response = client.get("/api/board")
    assert response.status_code == 401

def test_update_board_persists(auth_headers):
    # 1. Fetch initial
    response = client.get("/api/board", headers=auth_headers)
    board = response.json()
    
    # 2. Modify
    board["columns"][0]["title"] = "Modified Backlog"
    
    # 3. Update
    put_res = client.put("/api/board", json=board, headers=auth_headers)
    assert put_res.status_code == 200
    assert put_res.json() == {"status": "success"}
    
    # 4. Fetch again to strictly verify persistence
    new_get_res = client.get("/api/board", headers=auth_headers)
    new_board = new_get_res.json()
    assert new_board["columns"][0]["title"] == "Modified Backlog"

def test_swagger_placeholder_data_is_rejected(auth_headers):
    """PUT with Swagger's auto-generated example values must return 422, not corrupt the DB."""
    swagger_payload = {
        "columns": [{"id": "string", "title": "string", "cardIds": ["string"]}],
        "cards": {
            "additionalProp1": {"id": "string", "title": "string", "details": "string"}
        },
    }
    res = client.put("/api/board", json=swagger_payload, headers=auth_headers)
    assert res.status_code == 422, f"Expected 422 but got {res.status_code}: {res.text}"

    # Board in DB must be unchanged (still 5 columns)
    board = client.get("/api/board", headers=auth_headers).json()
    assert len(board["columns"]) == 5

def test_add_card_auto_generates_id(auth_headers):
    """POST /api/board/cards adds a card with a server-generated ID."""
    res = client.post("/api/board/cards", json={
        "column_id": "col-backlog",
        "title": "Sprint planning",
        "details": "Prepare tickets for next sprint."
    }, headers=auth_headers)
    assert res.status_code == 201
    card = res.json()
    assert card["title"] == "Sprint planning"
    assert card["id"].startswith("card-")  # auto-generated

    # Card should now appear in the board
    board = client.get("/api/board", headers=auth_headers).json()
    backlog = next(c for c in board["columns"] if c["id"] == "col-backlog")
    assert card["id"] in backlog["cardIds"]
    assert card["id"] in board["cards"]

def test_add_card_invalid_column(auth_headers):
    res = client.post("/api/board/cards", json={
        "column_id": "col-does-not-exist",
        "title": "Orphan card",
    }, headers=auth_headers)
    assert res.status_code == 404
