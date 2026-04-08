import os
import time
import random
import string
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, field_validator
from typing import Dict, List

from database import init_db, get_board_for_user, update_board_for_user

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    lifespan=lifespan,
    title="Kanban Studio API",
    description="""
## Endpoints

| Endpoint | Purpose |
|---|---|
| `GET  /api/board` | Fetch the **entire** board (all columns + cards) |
| `PUT  /api/board` | Replace the **entire** board state (used by the frontend after every drag/rename/delete) |
| `POST /api/board/cards` | Add a **single** card to a column — ID is auto-generated |
| `GET  /api/health` | Health check |
""",
    version="0.1.0",
)

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

_SWAGGER_PLACEHOLDERS = {"string", "additionalProp1", "additionalProp2", "additionalProp3"}

class ColumnModel(BaseModel):
    id: str
    title: str
    cardIds: List[str]

    @field_validator("id", "title")
    @classmethod
    def reject_placeholder(cls, v: str) -> str:
        if v in _SWAGGER_PLACEHOLDERS:
            raise ValueError(f"'{v}' looks like a Swagger placeholder — please provide real data")
        return v

class CardModel(BaseModel):
    id: str
    title: str
    details: str

    @field_validator("id", "title")
    @classmethod
    def reject_placeholder(cls, v: str) -> str:
        if v in _SWAGGER_PLACEHOLDERS:
            raise ValueError(f"'{v}' looks like a Swagger placeholder — please provide real data")
        return v

_BOARD_EXAMPLE = {
    "columns": [
        {"id": "col-backlog",   "title": "Backlog",     "cardIds": ["card-1", "card-2"]},
        {"id": "col-discovery", "title": "Discovery",   "cardIds": ["card-3"]},
        {"id": "col-progress",  "title": "In Progress", "cardIds": ["card-4", "card-5"]},
        {"id": "col-review",    "title": "Review",      "cardIds": ["card-6"]},
        {"id": "col-done",      "title": "Done",        "cardIds": ["card-7", "card-8"]},
    ],
    "cards": {
        "card-1": {"id": "card-1", "title": "Align roadmap themes",     "details": "Draft quarterly themes with impact statements and metrics."},
        "card-2": {"id": "card-2", "title": "Gather customer signals",  "details": "Review support tags, sales notes, and churn feedback."},
        "card-3": {"id": "card-3", "title": "Prototype analytics view", "details": "Sketch initial dashboard layout and key drill-downs."},
        "card-4": {"id": "card-4", "title": "Refine status language",   "details": "Standardize column labels and tone across the board."},
        "card-5": {"id": "card-5", "title": "Design card layout",       "details": "Add hierarchy and spacing for scanning dense lists."},
        "card-6": {"id": "card-6", "title": "QA micro-interactions",    "details": "Verify hover, focus, and loading states."},
        "card-7": {"id": "card-7", "title": "Ship marketing page",      "details": "Final copy approved and asset pack delivered."},
        "card-8": {"id": "card-8", "title": "Close onboarding sprint",  "details": "Document release notes and share internally."},
    },
}

class BoardPayload(BaseModel):
    """The complete board state: all columns (with ordered card IDs) plus all card objects."""
    columns: List[ColumnModel]
    cards: Dict[str, CardModel]
    model_config = {"json_schema_extra": {"example": _BOARD_EXAMPLE}}

class NewCardRequest(BaseModel):
    """Payload to add a single card. The server generates the card ID automatically."""
    column_id: str
    title: str
    details: str = ""
    model_config = {"json_schema_extra": {"example": {
        "column_id": "col-backlog",
        "title": "Write release notes",
        "details": "Summarise what shipped in v1.2 for the changelog."
    }}}

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get(
    "/api/health",
    tags=["System"],
    summary="Health check",
)
def health_check():
    return {"status": "ok", "message": "Hello from FastAPI!"}


@app.get(
    "/api/board",
    response_model=BoardPayload,
    tags=["Board — full state"],
    summary="Get the entire board",
    description="Returns the complete board: every column (with ordered card IDs) and every card object. This is what the frontend loads on startup.",
)
def get_board():
    board = get_board_for_user("user")
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board


@app.put(
    "/api/board",
    tags=["Board — full state"],
    summary="Replace the entire board",
    description="Overwrites the persisted board with the supplied payload. **Used by the frontend** after every drag-and-drop, column rename, or card delete. Pass the full board — not a partial update.",
)
def update_board(payload: BoardPayload):
    update_board_for_user("user", payload.model_dump())
    return {"status": "success"}


@app.post(
    "/api/board/cards",
    status_code=201,
    tags=["Cards — single operations"],
    summary="Add a single card",
    description="Appends a new card to the specified column. The card **ID is generated automatically** by the server — you only need to supply the column, title and (optional) details.",
)
def add_card(req: NewCardRequest):
    rand = "".join(random.choices(string.ascii_lowercase + string.digits, k=6))
    card_id = f"card-{rand}-{int(time.time() * 1000) % 1_000_000}"

    board = get_board_for_user("user")
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    column = next((c for c in board["columns"] if c["id"] == req.column_id), None)
    if not column:
        valid = [c["id"] for c in board["columns"]]
        raise HTTPException(status_code=404, detail=f"Column '{req.column_id}' not found. Valid IDs: {valid}")

    new_card = {"id": card_id, "title": req.title, "details": req.details or "No details yet."}
    board["cards"][card_id] = new_card
    column["cardIds"].append(card_id)

    update_board_for_user("user", board)
    return new_card

# ---------------------------------------------------------------------------
# Static file serving (Next.js frontend)
# ---------------------------------------------------------------------------

if os.path.exists("static"):
    from starlette.responses import Response

    class NoCacheStaticFiles(StaticFiles):
        def is_not_modified(self, response_headers: dict, request_headers: dict) -> bool:
            return False

    app.mount("/", NoCacheStaticFiles(directory="static", html=True), name="static")

@app.middleware("http")
async def add_no_cache_header(request: Request, call_next):
    from starlette.responses import Response
    response = await call_next(request)
    if response.status_code == 200 and request.url.path == "/":
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    return response
