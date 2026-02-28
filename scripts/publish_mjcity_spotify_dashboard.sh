#!/usr/bin/env bash
set -euo pipefail
cd /home/michael/.openclaw/workspace
python scripts/update_mjcity_spotify_dashboard.py
git add mjcity-artist-dashboard/data/latest.json mjcity-artist-dashboard/data/history.json
if git diff --cached --quiet; then
  echo "No data changes"
  exit 0
fi
git commit -m "Update Mjcity Spotify dashboard data"
git push origin master
echo "published"
