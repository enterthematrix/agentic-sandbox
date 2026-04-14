# High level steps for project

## Part 1: Plan
Enrich this document to plan out each of these parts in detail, with substeps listed out as a checklist to be checked off by the agent, and with tests and success criteria for each. Also create an `AGENTS.md` file inside the frontend directory that describes the existing code there. Ensure the user checks and approves the plan.
- [x] Create `frontend/AGENTS.md` describing existing UI codebase.
- [x] Enrich `docs/PLAN.md` with detailed checklists, tests, and success criteria.
- [ ] User checks and approves the plan.
**Tests & Success Criteria**
- All markdown files exist and render properly.
- All high level project steps are detailed out as checklists.

## Part 2: Scaffolding
Set up the Docker infrastructure, the backend in `backend/` with FastAPI, and write the start and stop scripts in the `scripts/` directory. This should serve example static HTML to confirm that a 'hello world' example works running locally and also make an API call.
- [x] Create `docker-compose.yml`.
- [x] Create `backend/Dockerfile`.
- [x] Setup basic FastAPI app with `/api/health` endpoint.
- [x] Write `scripts/start.sh` and `scripts/stop.sh`.
- [x] Serve a static HTML 'hello world' page that queries the backend API.
**Tests & Success Criteria**
- Running `./scripts/start.sh` spins up the containers without errors.
- Visiting `http://localhost:8000/` displays "Backend Scaffolding Test" and shows a successful JSON response from `/api/health`.

## Part 3: Add in Frontend
Now update so that the frontend is statically built and served, so that the app has the demo Kanban board displayed at `/`. Comprehensive unit and integration tests.
- [x] Ensure `next.config.ts` is configured for a static export (`output: 'export'`).
- [x] Add build step in `docker-compose.yml` or `Dockerfile` to export Next.js static files.
- [x] Update FastAPI `main.py` to map its static file server to Next.js's export `out` directory.
- [x] Validate basic Next.js UI elements load and DnD-Kit functions work effectively.
**Tests & Success Criteria**
- Going to `http://localhost:8000/` serves the complex React Next.js application.
- Unit testing with `vitest` passes for UI components.

## Part 4: Add in a fake user sign in experience
Now update so that on first hitting `/`, you need to log in with dummy credentials ("user", "password") in order to see the Kanban, and you can log out. Comprehensive tests.
- [x] Create a Login page/component on the frontend.
- [x] Implement conditional rendering or routing blocking the Kanban board without login.
- [x] Add dummy credential validation ("user" / "password").
- [x] Add Logout functionality.
**Tests & Success Criteria**
- Loading the page prompts for login.
- Submitting wrong credentials fails with an error message.
- Submitting "user" / "password" successfully displays the Kanban board.
- Clicking the logout button returns the user to the login screen.

## Part 5: Database modeling
Now propose a database schema for the Kanban, saving it as JSON. Document the database approach in `docs/` and get user sign off.
- [x] Design SQLite schema to store Users and Boards/Cards (as JSON or relational rows).
- [x] Document the DB approach in `docs/DB_APPROACH.md`.
- [x] Request User Review on the database model.
**Tests & Success Criteria**
- DB Schema proposal is fully documented and user approves it.

## Part 6: Backend
Now add API routes to allow the backend to read and change the Kanban for a given user; test this thoroughly with backend unit tests. The database should be created if it doesn't exist.
- [x] Implement database initialization locally on startup.
- [x] Create `GET /api/board` to fetch board state.
- [x] Create `PUT /api/board` or `POST` actions to save board state.
- [x] Write backend unit tests using `pytest` and `httpx`.
**Tests & Success Criteria**
- All API routes work successfully when hit directly (Postman / tests).
- Modifying the board via API persists across database reloads.

## Part 7: Frontend + Backend
Now have the frontend actually use the backend API, so that the app is a proper persistent Kanban board. Test very throughly.
- [x] Replace isolated memory state logic in `frontend` with actual fetch API calls.
- [x] Display loading states while pulling board data on component mount.
- [x] Trigger an API save upon any Drag-and-Drop action or column rename.
**Tests & Success Criteria**
- Reloading the web browser maintains the exact positions and column names of the board.
- End-to-end `playwright` tests verify the persistence of card movements.

## Part 8: AI connectivity
Now allow the backend to make an AI call via OpenRouter. Test connectivity with a simple "2+2" test and ensure the AI call is working.
- [x] Integrate OpenRouter API call mechanism in `backend`.
- [x] Inject `OPENROUTER_API_KEY` from `.env`.
- [x] Create a trivial endpoint `GET /api/ai/test` that asks the LLM "What is 2+2?", verifies the setup works.
**Tests & Success Criteria**
- The test endpoint successfully responds with "4".

## Part 9: AI updating Board State
Now extend the backend call so that it always calls the AI with the JSON of the Kanban board, plus the user's question (and conversation history). The AI should respond with Structured Outputs that includes the response to the user and optionaly an update to the Kanban. Test thoroughly.
- [x] Implement system prompt configuring `openai/gpt-4o-mini` for Kanban updates.
- [x] Use Structured Output (JSON mode) so the LLM responds with `{"reply": "...", "kanban_update": {...}}`.
- [x] Add endpoint `POST /api/ai/chat` taking conversation list and optional board state.
**Tests & Success Criteria**
- The LLM successfully parses current rules and outputs valid structural JSON updates without breaking the board format.

## Part 10: Full AI features in UI
Now add a beautiful sidebar widget to the UI supporting full AI chat, and allowing the LLM (as it determines) to update the Kanban based on its Structured Outputs. If the AI updates the Kanban, then the UI should refresh automatically.
- [x] Create chat sidebar UI Component in React using Yellow/Blue/Purple color scheme.
- [x] Manage chat history state and sync correctly with backend.
- [x] Trigger a board UI state refresh anytime the backend AI route signals a `kanban_update` in the response.
**Tests & Success Criteria**
- Chat visually works. Asking the AI "Create a card to walk the dog" automatically creates the card and refreshes the main UI seamlessly.