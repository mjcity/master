#!/usr/bin/env bash
set -euo pipefail

SITE="${1:-}"
REPO="${2:-}"
BRANCH="${3:-main}"

if [[ -z "$SITE" || -z "$REPO" ]]; then
  echo "Usage: rollback-site.sh <site> <repo-url> [branch]"
  exit 1
fi

TS="$(date +%Y%m%d-%H%M%S)"
WORKDIR="/tmp/mjcityreturn-${SITE}"

rm -rf "$WORKDIR"
git clone "$REPO" "$WORKDIR" >/dev/null 2>&1
cd "$WORKDIR"

git fetch origin "$BRANCH" --tags >/dev/null 2>&1
git checkout "$BRANCH" >/dev/null 2>&1 || git checkout -b "$BRANCH" "origin/$BRANCH" >/dev/null 2>&1

CURR="$(git rev-parse --short HEAD)"
TARGET="$(git rev-parse --short HEAD~1)"
TAG="mjcityreturn/${SITE}/${TS}"

git tag "$TAG" HEAD
git reset --hard HEAD~1 >/dev/null 2>&1
git push --force-with-lease origin "$BRANCH" >/dev/null 2>&1
git push origin "$TAG" >/dev/null 2>&1

echo "Site: $SITE"
echo "Current commit was: $CURR"
echo "Previous commit restored: $TARGET"
echo "Safety tag: $TAG"
