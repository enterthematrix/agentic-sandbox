# GEMINI.md - Kanban Studio (Agentic Sandbox)

This workspace is an experimental sandbox for exploring AI-driven software engineering, specifically centered around **Kanban Studio**, an AI-augmented Kanban board application.

## Project Overview

**Kanban Studio** is a full-stack application featuring a React-based frontend and a FastAPI-based backend. Its core mission is to provide a persistent Kanban board that can be interacted with and updated by an AI agent.

### Core Technologies
- **Frontend:** Next.js (TypeScript, React 19), Tailwind CSS, DnD-Kit (for drag-and-drop), Vitest (unit tests), Playwright (E2E tests).
- **Backend:** FastAPI (Python), Pydantic (data validation), Pytest.
- **Database:** SQLite (managed via `backend/database.py`).
- **DevOps:** Docker, Docker Compose, Colima (for macOS).

### Architecture
- **Frontend (`kanban_studio/frontend`):** A static export Next.js application.
- **Backend (`kanban_studio/backend`):** A FastAPI server that serves the static frontend and provides a REST API for board state persistence.
- **Data Flow:** The frontend state is synchronized with the backend via the `/api/board` endpoint.

---

## Building and Running

### Prerequisites
- Node.js & npm
- Python 3.10+ (with `uv` recommended)
- Docker & Docker Compose (Colima recommended for macOS)

### Quick Start (Native Mode)
The `scripts/start.sh` script automates the build and run process:
1.  Builds the frontend (`npm run build`).
2.  Exports static files to `backend/static`.
3.  Installs backend dependencies in a virtual environment.
4.  Starts the FastAPI server on `http://localhost:8000`.

```bash
cd kanban_studio
./scripts/start.sh
```

### Quick Start (Docker Mode)
```bash
cd kanban_studio
./scripts/start.sh --docker
```

### Testing
- **Frontend Unit Tests:** `cd kanban_studio/frontend && npm test`
- **Frontend E2E Tests:** `cd kanban_studio/frontend && npx playwright test`
- **Backend Tests:** `cd kanban_studio/backend && pytest`

---

## Development Conventions

- **State Management:** The frontend uses a custom hook `useKanban` to manage the board state.
- **Persistence:** The frontend is expected to call `PUT /api/board` after every significant state change (drag-and-drop, rename, delete) to ensure persistence.
- **API Design:** The backend prefers full-state updates for the board to simplify synchronization, though single-card additions are supported via `POST /api/board/cards`.
- **Styling:** Follow the established Tailwind CSS patterns. The UI aims for a modern, clean aesthetic.

---

## Project Roadmap (Summary of `docs/PLAN.md`)

1.  **Scaffolding:** Docker, FastAPI, and basic scripts (Completed).
2.  **Frontend Integration:** Next.js static export served by FastAPI (Completed).
3.  **Authentication:** Dummy "user/password" login experience (Completed).
4.  **Database:** SQLite persistence for board state (Completed).
5.  **API Implementation:** Backend routes for CRUD operations on the board (Completed).
6.  **Full Integration:** (In Progress) Connecting frontend state to actual API calls.
7.  **AI Connectivity:** Integrating OpenRouter for LLM interactions.
8.  **AI Board Updates:** Enabling the LLM to update the board state via structured JSON outputs.
9.  **AI UI Features:** A chat sidebar for interacting with the AI-augmented board.

---

## Key Files
- `kanban_studio/docs/PLAN.md`: The master plan and progress tracker.
- `kanban_studio/docs/DB_APPROACH.md`: Documentation on the database schema and strategy.
- `kanban_studio/backend/main.py`: FastAPI entry point and API definitions.
- `kanban_studio/frontend/src/hooks/useKanban.ts`: Core frontend logic for board management.
- `kanban_studio/AGENTS.md`: High-level overview for AI agents.
