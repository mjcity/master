#!/usr/bin/env bash
set -euo pipefail
ROOT=/home/michael/.openclaw/workspace

cd "$ROOT"
python scripts/update_mjcity_spotify_dashboard.py

BUILD_ID="$(date +%s)"
perl -0777 -i -pe 's/style\.css\?v=\d+/style.css?v='"$BUILD_ID"'/g; s/app\.js\?v=\d+/app.js?v='"$BUILD_ID"'/g' "$ROOT/mjcity-artist-dashboard/index.html"

mkdir -p "$ROOT/artistdashboard/data"
cp -f "$ROOT/mjcity-artist-dashboard/index.html" "$ROOT/artistdashboard/index.html"
cp -f "$ROOT/mjcity-artist-dashboard/style.css" "$ROOT/artistdashboard/style.css"
cp -f "$ROOT/mjcity-artist-dashboard/app.js" "$ROOT/artistdashboard/app.js"
cp -f "$ROOT/mjcity-artist-dashboard/data/latest.json" "$ROOT/artistdashboard/data/latest.json"
cp -f "$ROOT/mjcity-artist-dashboard/data/history.json" "$ROOT/artistdashboard/data/history.json"
cp -f "$ROOT/mjcity-artist-dashboard/data/s4a_latest.json" "$ROOT/artistdashboard/data/s4a_latest.json"

git add artistdashboard/data/latest.json artistdashboard/data/history.json artistdashboard/data/s4a_latest.json artistdashboard/index.html artistdashboard/style.css artistdashboard/app.js
if git diff --cached --quiet; then
  echo "No dashboard changes to publish"
  exit 0
fi

git commit -m "Refresh artistdashboard data"
git push origin master
echo "Artist dashboard published to /artistdashboard"
