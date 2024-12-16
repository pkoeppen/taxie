#!/bin/bash

REPO_DIR="/app"
BRANCH="master"

cd "$REPO_DIR"
git fetch origin "$BRANCH"

LOCAL_HASH=$(git rev-parse "$BRANCH")
REMOTE_HASH=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
  echo "Changes detected. Pulling the latest updates..."
  git pull origin "$BRANCH"
  echo "Repository updated."
  # TODO: idk restart server or somethin
else
  echo "No changes detected."
fi