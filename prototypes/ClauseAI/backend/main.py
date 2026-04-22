from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path
import uuid
from typing import Optional, List
import os
import json
from anthropic import Anthropic

import database

app = FastAPI(title="ClauseAI API")

# Initialize Claude API client
anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

# Load catalog
CATALOG_PATH = Path(__file__).parent.parent / "catalog.json"
with open(CATALOG_PATH, "r") as f:
    CATALOG = json.load(f)

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

class TemplateInfo(BaseModel):
    name: str
    description: str
    filename: str
    supported: bool

class TemplateListResponse(BaseModel):
    templates: List[TemplateInfo]
    total: int

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    document_type: str = "Mutual-NDA"

class ChatResponse(BaseModel):
    message: str
    form_data: Optional[FormData] = None
    is_complete: bool = False

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

@app.get("/api/templates", response_model=TemplateListResponse)
async def list_templates():
    """List all available document templates."""
    # Currently only Mutual NDA is fully supported
    supported_templates = {"Mutual-NDA.md"}

    templates = [
        TemplateInfo(
            name=t["name"],
            description=t["description"],
            filename=t["filename"],
            supported=t["filename"] in supported_templates
        )
        for t in CATALOG["templates"]
    ]

    return TemplateListResponse(templates=templates, total=len(templates))

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

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with AI to gather document information conversationally."""
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")

    # Check if requested document type is supported
    if request.document_type != "Mutual-NDA":
        return ChatResponse(
            message=f"I appreciate your interest in creating a {request.document_type}! Currently, I can only help with Mutual NDAs through the conversational interface. However, we have templates available for {len(CATALOG['templates'])} document types including Professional Services Agreements, Data Processing Agreements, and more. Would you like to create a Mutual NDA instead, or would you prefer to wait for full support of other document types?",
            form_data=None,
            is_complete=False
        )

    system_prompt = """You are a helpful legal document assistant for ClauseAI. Your job is to gather information for creating a Mutual NDA by asking friendly, conversational questions.

Required fields to collect:
1. purpose - The business purpose for sharing confidential information
2. effective_date - When the agreement starts (format: YYYY-MM-DD)
3. mnda_term - Duration of the agreement (e.g., "2 years")
4. confidentiality_term - How long confidential information must remain protected (e.g., "5 years")
5. governing_law - US State whose laws govern the agreement (e.g., "California")
6. jurisdiction - Location for resolving legal disputes (e.g., "San Francisco, California")

Guidelines:
- Ask questions in a natural, conversational manner
- Ask for one or two fields at a time, not all at once
- Provide helpful examples when appropriate
- Be friendly and professional
- When you have all required information, confirm the details with the user
- Once confirmed, respond with ONLY a JSON object in this exact format:
{
  "purpose": "value",
  "effective_date": "YYYY-MM-DD",
  "mnda_term": "value",
  "confidentiality_term": "value",
  "governing_law": "value",
  "jurisdiction": "value"
}"""

    try:
        # Convert messages to Anthropic format
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]

        response = anthropic_client.messages.create(
            model="claude-sonnet-4-5-20250929-v1:0",
            max_tokens=1024,
            system=system_prompt,
            messages=messages
        )

        assistant_message = response.content[0].text

        # Check if response contains JSON (indicating completion)
        try:
            # Try to parse as JSON
            if assistant_message.strip().startswith("{"):
                data = json.loads(assistant_message)
                form_data = FormData(**data)
                return ChatResponse(
                    message="Great! I have all the information I need. Here's what I gathered:",
                    form_data=form_data,
                    is_complete=True
                )
        except (json.JSONDecodeError, Exception):
            pass

        # Normal conversational response
        return ChatResponse(
            message=assistant_message,
            form_data=None,
            is_complete=False
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

# Serve frontend static files
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
else:
    @app.get("/")
    async def root():
        return {"message": "ClauseAI API - Frontend not built yet"}
