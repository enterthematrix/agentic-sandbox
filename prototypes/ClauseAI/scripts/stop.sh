#!/usr/bin/env bash

echo "🛑 Stopping ClauseAI..."

# Kill any running uvicorn processes
pkill -f "uvicorn main:app" 2>/dev/null || true

# Kill any running Next.js dev servers
pkill -f "next dev" 2>/dev/null || true

echo "✅ ClauseAI stopped"
