#!/bin/bash
# Start script for Mac

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"

cd "$PROJECT_ROOT"
echo "Starting Docker containers..."
docker compose up -d --build

echo "Containers are starting. You can check the logs with 'docker compose logs -f'."
