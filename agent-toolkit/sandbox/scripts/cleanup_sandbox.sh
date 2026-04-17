#!/bin/bash

# cleanup_sandbox.sh - Remove all sandbox artifacts for a clean start
# Targeted for macOS

set -e

echo "Cleaning up sandbox environment..."

# 1. Remove sandboxes
echo "Removing sandboxes (dune)..."
sbx rm dune 2>/dev/null || true

# 2. Stop and delete Colima
echo "Deleting Colima environment..."
colima stop 2>/dev/null || true
colima delete -f 2>/dev/null || true

# 3. Clean local artifacts
echo "Removing local .sbx/ metadata and worktrees..."
rm -rf .sbx/

# 4. Clean local Docker config
echo "Resetting Docker context..."
docker context use default 2>/dev/null || true

echo "Cleanup complete. You are ready for a fresh install."
