import sqlite3
import json
from pathlib import Path
from datetime import datetime

DB_PATH = Path(__file__).parent / "clauseai.db"

def init_db():
    """Initialize the database with required tables."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Sessions table - stores NDA document sessions
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            document_type TEXT NOT NULL,
            form_data TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()

def save_session(session_id: str, document_type: str, form_data: dict) -> None:
    """Save or update a session."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    now = datetime.utcnow().isoformat()

    cursor.execute("""
        INSERT INTO sessions (id, document_type, form_data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            form_data = excluded.form_data,
            updated_at = excluded.updated_at
    """, (session_id, document_type, json.dumps(form_data), now, now))

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

def delete_session(session_id: str) -> bool:
    """Delete a session."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    deleted = cursor.rowcount > 0

    conn.commit()
    conn.close()

    return deleted
