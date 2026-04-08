#!/bin/bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"
FRONTEND="$PROJECT_ROOT/frontend"
BACKEND="$PROJECT_ROOT/backend"

# Kill any existing server on port 8000
PID=$(lsof -ti tcp:8000 2>/dev/null)
if [ -n "$PID" ]; then
  echo "▶ Stopping existing server (PID $PID)..."
  kill "$PID"
  sleep 1
fi

echo "▶ Building frontend..."
cd "$FRONTEND"
npm install --silent
npm run build

echo "▶ Copying static output to backend..."
rm -rf "$BACKEND/static"
cp -a "$FRONTEND/out/." "$BACKEND/static/"

echo "▶ Starting backend server on http://localhost:8000 ..."
cd "$BACKEND"
if [ ! -d ".venv" ]; then
  uv venv .venv
fi
source .venv/bin/activate
uv pip install -q -r requirements.txt
uvicorn main:app --port 8000
