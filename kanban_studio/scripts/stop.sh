#!/bin/bash
# Kill any running uvicorn instance on port 8000
PID=$(lsof -ti tcp:8000)
if [ -n "$PID" ]; then
  echo "▶ Stopping server (PID $PID)..."
  kill "$PID"
else
  echo "No server running on port 8000."
fi
