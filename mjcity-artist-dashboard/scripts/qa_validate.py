#!/usr/bin/env python3
import json
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path('/home/michael/.openclaw/workspace/mjcity-artist-dashboard/data')
LATEST = ROOT / 'latest.json'
OUT = ROOT / 'qa_report.json'

issues = []
summary = {}

if not LATEST.exists():
    issues.append('latest.json missing')
    data = {}
else:
    data = json.loads(LATEST.read_text())

tracks = data.get('tracks', []) if isinstance(data, dict) else []
history = data.get('history', []) if isinstance(data, dict) else []
playlist_intel = data.get('playlist_intel', []) if isinstance(data, dict) else []

if not data.get('generated_at'):
    issues.append('generated_at missing')
if not tracks:
    issues.append('tracks empty')
if not history:
    issues.append('history empty')
if not playlist_intel:
    issues.append('playlist_intel empty')

invalid_dates = []
for t in tracks:
    rd = t.get('release_date')
    if not rd:
        continue
    try:
        datetime.fromisoformat(rd.replace('Z', '+00:00'))
    except Exception:
        invalid_dates.append(t.get('name', 'unknown'))
if invalid_dates:
    issues.append(f'invalid release_date on: {", ".join(invalid_dates[:5])}')

summary['generated_at'] = data.get('generated_at')
summary['track_count'] = len(tracks)
summary['history_count'] = len(history)
summary['playlist_intel_count'] = len(playlist_intel)
summary['verified_placements_count'] = len(data.get('verified_placements', [])) if isinstance(data, dict) else 0

report = {
    'checked_at': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
    'passed': len(issues) == 0,
    'issues': issues,
    'summary': summary,
}

OUT.write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
