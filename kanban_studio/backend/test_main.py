import pytest
from fastapi.testclient import TestClient
import os
import json

# Setup env specifically for testing before importing anything else
os.environ["DB_PATH"] = ":memory:"

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

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_get_board_returns_default():
    response = client.get("/api/board")
    assert response.status_code == 200
    data = response.json()
    assert "columns" in data
    assert "cards" in data
    assert len(data["columns"]) == 5 # Default columns length

def test_update_board_persists():
    # 1. Fetch initial
    response = client.get("/api/board")
    board = response.json()
    
    # 2. Modify
    board["columns"][0]["title"] = "Modified Backlog"
    
    # 3. Update
    put_res = client.put("/api/board", json=board)
    assert put_res.status_code == 200
    assert put_res.json() == {"status": "success"}
    
    # 4. Fetch again to strictly verify persistence
    new_get_res = client.get("/api/board")
    new_board = new_get_res.json()
    assert new_board["columns"][0]["title"] == "Modified Backlog"
