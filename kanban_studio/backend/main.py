import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, Any, List

from database import init_db, get_board_for_user, update_board_for_user

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    yield
    # Shutdown

app = FastAPI(lifespan=lifespan)

class BoardPayload(BaseModel):
    columns: List[Any]
    cards: Dict[str, Any]

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Hello from FastAPI!"}

@app.get("/api/board", response_model=BoardPayload)
def get_board():
    # MVP hardcoded to 'user' since authentication is client-only demo state right now!
    board = get_board_for_user("user")
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board

@app.put("/api/board")
def update_board(payload: BoardPayload):
    update_board_for_user("user", payload.model_dump())
    return {"status": "success"}

# Mount static directory to serve Next.js frontend (SPA routing)
if os.path.exists("static"):
    from fastapi import Request
    from fastapi.staticfiles import StaticFiles
    from starlette.responses import Response
    
    class NoCacheStaticFiles(StaticFiles):
        def is_not_modified(self, response_headers: dict, request_headers: dict) -> bool:
            return False

    app.mount("/", NoCacheStaticFiles(directory="static", html=True), name="static")

@app.middleware("http")
async def add_no_cache_header(request: Request, call_next):
    response: Response = await call_next(request)
    if response.status_code == 200 and request.url.path == "/":
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    return response
