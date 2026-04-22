# ClauseAI

AI-powered legal document assistant that simplifies the creation of professional legal agreements.

## About

ClauseAI transforms complex legal document creation into a simple, conversational experience. Powered by advanced language models, it guides users through the process of generating customized legal agreements from professionally curated templates.

**Target Users:**
- Small businesses needing standard legal agreements
- Startups requiring NDAs, service agreements, and contracts
- Individuals navigating legal document requirements

**Core Value:**
- Accessible legal documentation without expensive attorney consultations
- Guided, conversational interface reduces complexity
- Pre-vetted templates from trusted legal sources (CommonPaper)

## Project Status

**Current Version:** Production-Ready Multi-User Platform (CL-7)

ClauseAI is now a fully-featured, multi-user legal document creation platform. Users can sign in, create and save documents, manage their document library, and export professional PDFs.

**Features:**
- User authentication (username-based prototype)
- Personal document dashboard for managing saved documents
- 11 legal document templates from CommonPaper
- Document type browser with detailed descriptions
- AI chat interface for guided Mutual NDA creation
- Manual form option for Mutual NDA direct input
- Intelligent routing for unsupported document types
- Real-time document preview
- Session persistence with user accounts (SQLite)
- PDF export with professional formatting
- Download as markdown
- Polished legal-tech UI with professional styling

## Architecture

**Frontend:** Next.js 16 with TypeScript, React 19, Tailwind CSS v4  
**Backend:** FastAPI (Python) with SQLite  
**Deployment:** Docker containerization

### Project Structure

```
ClauseAI/
├── frontend/           # Next.js application (static export)
│   ├── src/
│   │   ├── app/       # Next.js app router
│   │   ├── components/# React components
│   │   └── lib/       # API client
│   └── package.json
├── backend/           # FastAPI application
│   ├── main.py        # API routes
│   ├── database.py    # SQLite operations
│   └── requirements.txt
├── templates/         # Legal document templates
├── scripts/           # Automation scripts
│   ├── start.sh       # Start dev environment
│   └── stop.sh        # Stop dev environment
├── prototype/         # Original CL-3 prototype
└── Dockerfile         # Multi-stage container build
```

## Quick Start

### Configuration

Create a `.env` file in the ClauseAI root directory:

```bash
cp .env.example .env
```

Add your Anthropic API key to enable AI chat features:

```
ANTHROPIC_API_KEY=your_api_key_here
API_PORT=8000
```

### Development

```bash
# Start the development environment
cd prototypes/ClauseAI
bash scripts/start.sh
```

The application will be available at http://localhost:8000

### Stop

```bash
bash scripts/stop.sh
```

### Docker

```bash
docker build -t clauseai .
docker run -p 8000:8000 clauseai
```

## API Endpoints

**Authentication:**
- `POST /api/auth/login` - Username-based login

**Templates:**
- `GET /api/templates` - List all available document templates with support status

**Sessions:**
- `POST /api/sessions` - Create a new session
- `GET /api/sessions/{id}` - Retrieve a session
- `GET /api/users/{user_id}/sessions` - Get all sessions for a user
- `PUT /api/sessions/{id}` - Update a session
- `DELETE /api/sessions/{id}` - Delete a session

**Document Generation:**
- `POST /api/generate` - Generate populated document (markdown)
- `POST /api/generate/pdf` - Generate populated document (PDF)
- `POST /api/chat` - Conversational AI interface for gathering document information

**System:**
- `GET /api/health` - Health check

## Design Direction

ClauseAI adopts a professional legal-tech aesthetic that balances authority with approachability.

**Color Palette:**
- Deep Navy: `#0A1929` - Primary interface elements, headers
- Steel Blue: `#1E4976` - Secondary actions, links
- Gold Accent: `#C9A961` - Premium features, highlights
- Slate Gray: `#64748B` - Supporting text, labels
- Success Green: `#10B981` - Confirmation states, approval

**Design Principles:**
- Clean, minimal interface reducing cognitive load
- Clear visual hierarchy for legal content
- Trustworthy, professional typography
- Accessibility-first approach

## Legal Notice

All document templates are sourced from CommonPaper (https://github.com/CommonPaper) and licensed under CC BY 4.0. ClauseAI provides document generation tools but does not offer legal advice. Users should consult qualified legal professionals for specific legal guidance.

## Development

This is an experimental prototype built using agentic coding workflows.

**Completed Phases:**
- [x] CL-1: Project README and documentation
- [x] CL-2: Legal document template dataset (11 templates)
- [x] CL-3: Prototype Mutual NDA creator
- [x] CL-4: V1 technical foundation
- [x] CL-5: AI chat interface (Mutual NDA only)
- [x] CL-6: Multi-document support with catalog integration
- [x] CL-7: Multi-user support, PDF export, UI polish

All planned phases complete! ClauseAI is now a production-ready legal document creation platform.

**License:** MIT (for code); CC BY 4.0 (for templates)
