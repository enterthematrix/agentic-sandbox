# Stage 1: Build Frontend
FROM node:20 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN uv pip install --system -r requirements.txt
COPY backend/ .
COPY --from=frontend-builder /app/frontend/out ./static

EXPOSE 8000
CMD ["fastapi", "run", "main.py", "--port", "8000"]
