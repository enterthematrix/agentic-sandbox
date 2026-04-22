#!/usr/bin/env bash
set -e

echo "🚀 Starting ClauseAI development environment..."

# Check if running from correct directory
if [ ! -f "scripts/start.sh" ]; then
    echo "❌ Error: Please run this script from the ClauseAI root directory"
    echo "   cd prototypes/ClauseAI && bash scripts/start.sh"
    exit 1
fi

# Install backend dependencies
if [ ! -d "backend/__pycache__" ] || [ ! -f "backend/clauseai.db" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    pip install -q -r requirements.txt
    cd ..
fi

# Install frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install --silent
    cd ..
fi

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm run build > /dev/null 2>&1
cd ..

# Copy frontend build to backend static directory
echo "📂 Copying frontend build to backend..."
rm -rf backend/static
cp -r frontend/out backend/static

# Start backend server
echo "✅ Starting backend server on http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
