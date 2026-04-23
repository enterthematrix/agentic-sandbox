# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for WeasyPrint (PDF generation)
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

# Install backend dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy frontend build
COPY --from=frontend-builder /app/frontend/out ./static

# Copy templates and catalog
COPY templates/ ./templates/
COPY catalog.json ./

# Expose port
EXPOSE 8000

# Start server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
