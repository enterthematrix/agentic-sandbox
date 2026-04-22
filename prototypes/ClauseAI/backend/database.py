import sqlite3
import json
from pathlib import Path
from datetime import datetime

DB_PATH = Path(__file__).parent / "clauseai.db"

def init_db():
    """Initialize the database with required tables."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Users table - simple username-based auth (prototype)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    # Sessions table - stores document sessions
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            document_type TEXT NOT NULL,
            form_data TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    conn.commit()
    conn.close()

def create_or_get_user(username: str) -> str:
    """Create a user or return existing user ID."""
    import uuid
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if user exists
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()

    if row:
        user_id = row[0]
    else:
        # Create new user
        user_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        cursor.execute(
            "INSERT INTO users (id, username, created_at) VALUES (?, ?, ?)",
            (user_id, username, now)
        )
        conn.commit()

    conn.close()
    return user_id

def save_session(session_id: str, user_id: str, document_type: str, form_data: dict) -> None:
    """Save or update a session."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    now = datetime.utcnow().isoformat()

    cursor.execute("""
        INSERT INTO sessions (id, user_id, document_type, form_data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            form_data = excluded.form_data,
            updated_at = excluded.updated_at
    """, (session_id, user_id, document_type, json.dumps(form_data), now, now))

    conn.commit()
    conn.close()

def get_session(session_id: str) -> dict | None:
    """Retrieve a session by ID."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT document_type, form_data, created_at, updated_at
        FROM sessions
        WHERE id = ?
    """, (session_id,))

    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    return {
        "id": session_id,
        "document_type": row[0],
        "form_data": json.loads(row[1]),
        "created_at": row[2],
        "updated_at": row[3]
    }

def get_user_sessions(user_id: str) -> list[dict]:
    """Get all sessions for a user."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, document_type, form_data, created_at, updated_at
        FROM sessions
        WHERE user_id = ?
        ORDER BY updated_at DESC
    """, (user_id,))

    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": row[0],
            "document_type": row[1],
            "form_data": json.loads(row[2]),
            "created_at": row[3],
            "updated_at": row[4]
        }
        for row in rows
    ]

def delete_session(session_id: str) -> bool:
    """Delete a session."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    deleted = cursor.rowcount > 0

    conn.commit()
    conn.close()

    return deleted
