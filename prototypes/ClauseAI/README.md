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

**Current Version:** V1 with AI Chat (CL-5)

A conversational AI assistant powered by Claude helps users create Mutual NDAs through natural dialogue, making legal document creation accessible and intuitive.

**Features:**
- AI chat interface for guided NDA creation
- Manual form option for direct input
- Real-time document preview
- Session persistence (SQLite)
- Download as markdown
- Professional legal-tech UI

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

- `GET /api/health` - Health check
- `POST /api/sessions` - Create a new session
- `GET /api/sessions/{id}` - Retrieve a session
- `PUT /api/sessions/{id}` - Update a session
- `DELETE /api/sessions/{id}` - Delete a session
- `POST /api/generate` - Generate populated document
- `POST /api/chat` - Conversational AI interface for gathering NDA information

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

**Upcoming Phases:**
- [ ] CL-6: Expand to all document types
- [ ] CL-7: Multi-user support, PDF export, UI polish

**License:** MIT (for code); CC BY 4.0 (for templates)
