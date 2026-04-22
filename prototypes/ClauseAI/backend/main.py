from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path
import uuid
from typing import Optional

import database

app = FastAPI(title="ClauseAI API")

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup():
    database.init_db()

# Models
class FormData(BaseModel):
    purpose: str
    effective_date: str
    mnda_term: str
    confidentiality_term: str
    governing_law: str
    jurisdiction: str

class SessionCreate(BaseModel):
    document_type: str
    form_data: FormData

class SessionResponse(BaseModel):
    id: str
    document_type: str
    form_data: FormData
    created_at: str
    updated_at: str

class PopulatedDocument(BaseModel):
    content: str
    filename: str

# Template loader
def load_template(document_type: str) -> str:
    """Load a document template from the templates directory."""
    templates_dir = Path(__file__).parent.parent / "templates"
    template_path = templates_dir / f"{document_type}.md"

    if not template_path.exists():
        raise HTTPException(status_code=404, detail=f"Template {document_type} not found")

    return template_path.read_text()

def populate_template(template: str, form_data: FormData) -> str:
    """Populate template with form data."""
    # Replace placeholders in the template
    populated = template.replace(
        '<span class="coverpage_link">Purpose</span>', form_data.purpose
    ).replace(
        '<span class="coverpage_link">Effective Date</span>', form_data.effective_date
    ).replace(
        '<span class="coverpage_link">MNDA Term</span>', form_data.mnda_term
    ).replace(
        '<span class="coverpage_link">Term of Confidentiality</span>', form_data.confidentiality_term
    ).replace(
        '<span class="coverpage_link">Governing Law</span>', form_data.governing_law
    ).replace(
        '<span class="coverpage_link">Jurisdiction</span>', form_data.jurisdiction
    )

    return populated

# Routes
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "ClauseAI"}

@app.post("/api/sessions", response_model=SessionResponse)
async def create_session(session_data: SessionCreate):
    """Create a new session."""
    session_id = str(uuid.uuid4())
    database.save_session(
        session_id,
        session_data.document_type,
        session_data.form_data.model_dump()
    )

    session = database.get_session(session_id)
    if not session:
        raise HTTPException(status_code=500, detail="Failed to create session")

    return SessionResponse(**session)

@app.get("/api/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """Retrieve a session by ID."""
    session = database.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionResponse(**session)

@app.put("/api/sessions/{session_id}", response_model=SessionResponse)
async def update_session(session_id: str, session_data: SessionCreate):
    """Update an existing session."""
    existing = database.get_session(session_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Session not found")

    database.save_session(
        session_id,
        session_data.document_type,
        session_data.form_data.model_dump()
    )

    session = database.get_session(session_id)
    return SessionResponse(**session)

@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a session."""
    deleted = database.delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"status": "deleted", "id": session_id}

@app.post("/api/generate", response_model=PopulatedDocument)
async def generate_document(session_data: SessionCreate):
    """Generate a populated document from template and form data."""
    template = load_template(session_data.document_type)
    populated = populate_template(template, session_data.form_data)

    filename = f"{session_data.document_type}.md"

    return PopulatedDocument(content=populated, filename=filename)

# Serve frontend static files
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
else:
    @app.get("/")
    async def root():
        return {"message": "ClauseAI API - Frontend not built yet"}
