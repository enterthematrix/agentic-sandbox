#!/bin/bash

# Stop Docker containers for the application
set -e

echo "Stopping Docker containers..."

# Stop and remove containers defined in docker-compose.yml
docker compose down

# Kill any remaining uvicorn instance on port 8000 (if container failed to stop)
PID=$(lsof -ti tcp:8000)
if [ -n "$PID" ]; then
  echo "Killing stray server process (PID $PID)..."
  kill "$PID" 2>/dev/null || true
else
  echo "No server running on port 8000."
fi