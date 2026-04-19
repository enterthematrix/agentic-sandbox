#!/bin/bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"
FRONTEND="$PROJECT_ROOT/frontend"
BACKEND="$PROJECT_ROOT/backend"

# Parse command line arguments
DOCKER_MODE=false
if [[ "$1" == "--docker" ]]; then
  DOCKER_MODE=true
fi

# Docker mode: use docker-compose
if [ "$DOCKER_MODE" = true ]; then
  echo "Starting application in Docker mode..."
  cd "$PROJECT_ROOT"

  # Try docker compose first (newer syntax, works without buildx)
  if docker compose version &>/dev/null; then
    docker compose up --build
    exit $?
  fi

  # Fallback to docker-compose (older syntax)
  if command -v docker-compose &>/dev/null; then
    docker-compose up --build
    exit $?
  fi

  echo "Error: Docker Compose not found"
  echo "Please install Docker Compose to use this mode."
  exit 1
fi

# Native mode: traditional development flow (default)

# Kill any existing server on port 8000
PID=$(lsof -ti tcp:8000 2>/dev/null || true)
if [ -n "$PID" ]; then
  echo "Stopping existing server (PID $PID)..."
  kill "$PID" 2>/dev/null || true
  sleep 1
fi

echo "Building frontend..."
cd "$FRONTEND"
npm install --silent
npm run build

echo "Copying static output to backend..."
rm -rf "$BACKEND/static"
cp -a "$FRONTEND/out/." "$BACKEND/static/"

echo "Starting backend server on http://localhost:8000 ..."
cd "$BACKEND"
if [ ! -d ".venv" ]; then
  uv venv .venv
fi
source .venv/bin/activate
uv pip install -q -r requirements.txt
uvicorn main:app --port 8000
