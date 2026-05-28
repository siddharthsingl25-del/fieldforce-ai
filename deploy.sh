#!/usr/bin/env bash
set -euo pipefail

message="${1:-update app}"

if [ ! -d ".git" ]; then
  git init
  git branch -M main
fi

git add .

if git diff --cached --quiet; then
  echo "No changes to deploy."
  exit 0
fi

git commit -m "$message"
git push -u origin main

echo "Deploy pushed to GitHub. Vercel will update automatically."
