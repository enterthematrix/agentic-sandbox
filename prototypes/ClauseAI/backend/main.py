from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path
import uuid
from typing import Optional, List
import os
import json
import httpx
import markdown
from dotenv import load_dotenv
try:
    from weasyprint import HTML
    WEASYPRINT_AVAILABLE = True
except (ImportError, OSError):
    WEASYPRINT_AVAILABLE = False
from io import BytesIO

import database

# Load environment variables
load_dotenv()

app = FastAPI(title="ClauseAI API")

# OpenRouter API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Load catalog (check both Docker and native paths)
CATALOG_PATH = Path(__file__).parent / "catalog.json"
if not CATALOG_PATH.exists():
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

class LoginRequest(BaseModel):
    username: str

class LoginResponse(BaseModel):
    user_id: str
    username: str

class SessionCreate(BaseModel):
    document_type: str
    form_data: FormData
    user_id: str

class SessionResponse(BaseModel):
    id: str
    document_type: str
    form_data: FormData
    created_at: str
    updated_at: str

class SessionListResponse(BaseModel):
    sessions: List[SessionResponse]
    total: int

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
    templates_dir = Path(__file__).parent / "templates"
    if not templates_dir.exists():
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

@app.post("/api/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Simple username-based login (prototype auth)."""
    if not request.username or len(request.username.strip()) == 0:
        raise HTTPException(status_code=400, detail="Username required")

    user_id = database.create_or_get_user(request.username.strip())
    return LoginResponse(user_id=user_id, username=request.username.strip())

@app.get("/api/templates", response_model=TemplateListResponse)
async def list_templates():
    """List all available document templates."""
    # All templates are supported via AI chat interface
    # Manual forms are only available for Mutual NDA
    supported_templates = {t["filename"] for t in CATALOG["templates"]}

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

@app.get("/api/users/{user_id}/sessions", response_model=SessionListResponse)
async def list_user_sessions(user_id: str):
    """Get all sessions for a user."""
    sessions = database.get_user_sessions(user_id)
    session_responses = [SessionResponse(**s) for s in sessions]
    return SessionListResponse(sessions=session_responses, total=len(session_responses))

@app.post("/api/sessions", response_model=SessionResponse)
async def create_session(session_data: SessionCreate):
    """Create a new session."""
    session_id = str(uuid.uuid4())
    database.save_session(
        session_id,
        session_data.user_id,
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
        session_data.user_id,
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

@app.post("/api/generate/pdf")
async def generate_pdf(session_data: SessionCreate):
    """Generate a PDF document from template and form data."""
    if not WEASYPRINT_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="PDF export is not available. WeasyPrint system dependencies are not installed. Please install with: brew install pango"
        )

    template = load_template(session_data.document_type)
    populated = populate_template(template, session_data.form_data)

    # Convert markdown to HTML
    html_content = markdown.markdown(populated, extensions=['extra', 'nl2br'])

    # Add CSS styling for professional look
    styled_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{
                font-family: 'Georgia', 'Times New Roman', serif;
                line-height: 1.6;
                max-width: 800px;
                margin: 40px auto;
                padding: 20px;
                color: #0A1929;
            }}
            h1, h2, h3 {{
                color: #0A1929;
                margin-top: 24px;
            }}
            h1 {{ font-size: 24px; border-bottom: 2px solid #1E4976; padding-bottom: 8px; }}
            h2 {{ font-size: 20px; }}
            h3 {{ font-size: 16px; }}
            p {{ margin: 12px 0; }}
            .highlight {{
                background-color: #FFF9E6;
                padding: 2px 4px;
                font-weight: bold;
            }}
        </style>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    """

    # Generate PDF
    pdf_bytes = HTML(string=styled_html).write_pdf()

    filename = f"{session_data.document_type}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

def get_system_prompt_for_document(document_type: str) -> str:
    """Generate system prompt based on document type."""
    # Find document info from catalog
    doc_info = next((t for t in CATALOG["templates"] if t["filename"] == document_type), None)
    doc_name = doc_info["name"] if doc_info else document_type

    return f"""You are a helpful legal document assistant for ClauseAI. Your job is to gather information for creating a {doc_name} by asking friendly, conversational questions.

Required fields to collect:
1. purpose - The business purpose or context for this {doc_name}
2. effective_date - When the agreement starts (format: YYYY-MM-DD)
3. mnda_term - Duration of the agreement (e.g., "2 years")
4. confidentiality_term - How long terms must remain in effect (e.g., "5 years")
5. governing_law - US State whose laws govern the agreement (e.g., "California")
6. jurisdiction - Location for resolving legal disputes (e.g., "San Francisco, California")

Guidelines:
- Ask questions in a natural, conversational manner appropriate for a {doc_name}
- Ask for one or two fields at a time, not all at once
- Provide helpful examples when appropriate
- Be friendly and professional
- When you have all required information, confirm the details with the user
- Once confirmed, respond with ONLY a JSON object in this exact format:
{{
  "purpose": "value",
  "effective_date": "YYYY-MM-DD",
  "mnda_term": "value",
  "confidentiality_term": "value",
  "governing_law": "value",
  "jurisdiction": "value"
}}"""

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with AI to gather document information conversationally."""
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not configured")

    # Generate dynamic system prompt based on document type
    system_prompt = get_system_prompt_for_document(request.document_type)

    try:
        # Convert messages to OpenRouter format
        messages = [{"role": "system", "content": system_prompt}]
        for msg in request.messages:
            messages.append({"role": msg.role, "content": msg.content})

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "openai/gpt-oss-120b",
                    "messages": messages,
                    "max_tokens": 1024,
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            assistant_message = data["choices"][0]["message"]["content"].strip()

        # Check if response contains JSON (indicating completion)
        try:
            # Try to parse as JSON
            if assistant_message.strip().startswith("{"):
                form_data_dict = json.loads(assistant_message)
                form_data = FormData(**form_data_dict)
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
