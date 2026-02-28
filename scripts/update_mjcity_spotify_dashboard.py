#!/usr/bin/env python3
import json
from datetime import datetime
from zoneinfo import ZoneInfo
from pathlib import Path
import requests

ROOT = Path('/home/michael/.openclaw/workspace')
CFG = Path('/home/michael/.openclaw/openclaw.json')
OUT_DIR = ROOT / 'mjcity-artist-dashboard' / 'data'
OUT_DIR.mkdir(parents=True, exist_ok=True)
LATEST = OUT_DIR / 'latest.json'
HISTORY = OUT_DIR / 'history.json'
ARTIST_ID = '4TbJfltoNbaKOASaR8rsYM'

cfg = json.loads(CFG.read_text())
env = cfg.get('env', {})
CID = env.get('SPOTIFY_CLIENT_ID')
SEC = env.get('SPOTIFY_CLIENT_SECRET')
if not CID or not SEC:
    raise SystemExit('Missing Spotify credentials')

tok = requests.post(
    'https://accounts.spotify.com/api/token',
    data={'grant_type': 'client_credentials'},
    auth=(CID, SEC),
    timeout=20,
).json()['access_token']
H = {'Authorization': f'Bearer {tok}'}

artist = requests.get(f'https://api.spotify.com/v1/artists/{ARTIST_ID}', headers=H, timeout=20).json()
tracks_resp = requests.get(
    'https://api.spotify.com/v1/search',
    headers=H,
    params={'q': 'Mjcity', 'type': 'track', 'limit': 10, 'market': 'US'},
    timeout=20,
).json()
items = tracks_resp.get('tracks', {}).get('items', [])
tracks = [t for t in items if any(a.get('id') == ARTIST_ID for a in t.get('artists', []))]

playlist_intel = []
for t in tracks[:5]:
    q = f"{t.get('name', '')} Mjcity"
    pls_resp = requests.get(
        'https://api.spotify.com/v1/search',
        headers=H,
        params={'q': q, 'type': 'playlist', 'limit': 5, 'market': 'US'},
        timeout=20,
    ).json()
    pls = pls_resp.get('playlists', {}).get('items', [])
    playlist_intel.append({'track': t.get('name'), 'hits': len([p for p in pls if p])})

now = datetime.now(ZoneInfo('America/New_York'))
record = {
    'date': now.strftime('%Y-%m-%d'),
    'followers': (artist.get('followers') or {}).get('total'),
    'popularity': artist.get('popularity'),
}

hist = []
if HISTORY.exists():
    hist = json.loads(HISTORY.read_text())
hist = [h for h in hist if h.get('date') != record['date']]
hist.append(record)
hist = sorted(hist, key=lambda x: x.get('date'))[-30:]
HISTORY.write_text(json.dumps(hist, indent=2))

smart_captions = [
    f"New heat on deck 🎧 {tracks[0]['name']} is live now. Stream it and tell me your favorite line. #Mjcity" if tracks else 'New music loading…',
    f"Appreciate every listener rocking with Mjcity. Keep running it up! 🚀",
    f"Playlist curators: open to placements for Afro-pop energy — link in bio."
]

weekly_report = (
    f"This week: {len(tracks)} active tracks detected, "
    f"{sum(x.get('hits', 0) for x in playlist_intel)} playlist search hits across latest songs."
)
catalog_health = (
    'Catalog trend: Recent singles are active; push newest 2 tracks with short-form video and playlist outreach.'
)

latest = {
    'generated_at': now.strftime('%Y-%m-%d %H:%M %Z'),
    'artist_snapshot': {
        'name': artist.get('name'),
        'id': artist.get('id'),
        'followers': (artist.get('followers') or {}).get('total'),
        'popularity': artist.get('popularity'),
        'genres': artist.get('genres', []),
        'spotify_url': (artist.get('external_urls') or {}).get('spotify'),
    },
    'tracks': [
        {
            'name': t.get('name'),
            'release_date': (t.get('album') or {}).get('release_date'),
            'url': (t.get('external_urls') or {}).get('spotify'),
        }
        for t in tracks
    ],
    'playlist_intel': playlist_intel,
    'smart_captions': smart_captions,
    'weekly_report': weekly_report,
    'catalog_health': catalog_health,
    'history': hist,
}
LATEST.write_text(json.dumps(latest, indent=2))
print('updated dashboard data')