#!/usr/bin/env bash
set -euo pipefail
if [ "$#" -lt 1 ]; then
  echo "Usage: ./scripts/init_and_push.sh <GIT_REMOTE_URL>"
  exit 1
fi
REPO_URL="$1"
if [ ! -d .git ]; then git init; git add .; git commit -m "Initial commit - KartRacer Pro"; fi
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"
git branch -M main
git push -u origin main
echo "Pushed. Connect repo to Render and set start command: npm start"
