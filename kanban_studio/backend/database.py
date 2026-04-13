import sqlite3
import json
from passlib.context import CryptContext

DB_PATH = "kanban.db"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEFAULT_BOARD = {
    "columns": [
        { "id": "col-backlog", "title": "Backlog", "cardIds": ["card-1", "card-2"] },
        { "id": "col-discovery", "title": "Discovery", "cardIds": ["card-3"] },
        { "id": "col-progress", "title": "In Progress", "cardIds": ["card-4", "card-5"] },
        { "id": "col-review", "title": "Review", "cardIds": ["card-6"] },
        { "id": "col-done", "title": "Done", "cardIds": ["card-7", "card-8"] },
    ],
    "cards": {
        "card-1": { "id": "card-1", "title": "Align roadmap themes", "details": "Draft quarterly themes with impact statements and metrics." },
        "card-2": { "id": "card-2", "title": "Gather customer signals", "details": "Review support tags, sales notes, and churn feedback." },
        "card-3": { "id": "card-3", "title": "Prototype analytics view", "details": "Sketch initial dashboard layout and key drill-downs." },
        "card-4": { "id": "card-4", "title": "Refine status language", "details": "Standardize column labels and tone across the board." },
        "card-5": { "id": "card-5", "title": "Design card layout", "details": "Add hierarchy and spacing for scanning dense lists." },
        "card-6": { "id": "card-6", "title": "QA micro-interactions", "details": "Verify hover, focus, and loading states." },
        "card-7": { "id": "card-7", "title": "Ship marketing page", "details": "Final copy approved and asset pack delivered." },
        "card-8": { "id": "card-8", "title": "Close onboarding sprint", "details": "Document release notes and share internally." },
    }
}

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_connection():
    # Use check_same_thread=False since FastAPI relies on threading if async is not fully strictly executed
    return sqlite3.connect(DB_PATH, check_same_thread=False)

def init_db():
    conn = get_connection()
    c = conn.cursor()
    
    # Create Users
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    
    # Create Boards
    c.execute('''
        CREATE TABLE IF NOT EXISTS boards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            data TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Setup initial mock payload if fresh
    c.execute("SELECT id FROM users WHERE username = ?", ("user",))
    if not c.fetchone():
        hashed_password = get_password_hash("password")
        c.execute("INSERT INTO users (username, password) VALUES (?, ?)", ("user", hashed_password))
        user_id = c.lastrowid
        c.execute("INSERT INTO boards (user_id, data) VALUES (?, ?)", (user_id, json.dumps(DEFAULT_BOARD)))
        
    conn.commit()
    conn.close()

def get_user(username: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT username, password FROM users WHERE username = ?", (username,))
    row = c.fetchone()
    conn.close()
    if row:
        return {"username": row[0], "password": row[1]}
    return None

def get_board_for_user(username: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
        SELECT b.data FROM boards b
        JOIN users u ON u.id = b.user_id
        WHERE u.username = ?
    """, (username,))
    row = c.fetchone()
    conn.close()
    return json.loads(row[0]) if row else None

def update_board_for_user(username: str, data: dict):
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
        UPDATE boards 
        SET data = ? 
        WHERE user_id = (SELECT id FROM users WHERE username = ?)
    """, (json.dumps(data), username))
    conn.commit()
    conn.close()
