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
S4A = OUT_DIR / 's4a_latest.json'
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

artist_resp = requests.get(f'https://api.spotify.com/v1/artists/{ARTIST_ID}', headers=H, timeout=20)
artist = artist_resp.json() if artist_resp.status_code == 200 else {}

# Top tracks endpoint may be blocked for some apps; fallback to search tracks.
top_tracks = []
top_tracks_source = 'artist_top_tracks'
top_resp = requests.get(
    f'https://api.spotify.com/v1/artists/{ARTIST_ID}/top-tracks',
    headers=H,
    params={'market': 'US'},
    timeout=20,
)
if top_resp.status_code == 200:
    top_tracks = top_resp.json().get('tracks', [])
else:
    top_tracks_source = 'search_fallback'
    tracks_resp = requests.get(
        'https://api.spotify.com/v1/search',
        headers=H,
        params={'q': 'Mjcity', 'type': 'track', 'limit': 20, 'market': 'US'},
        timeout=20,
    ).json()
    items = tracks_resp.get('tracks', {}).get('items', [])
    top_tracks = [t for t in items if any(a.get('id') == ARTIST_ID for a in t.get('artists', []))]

# Releases via artist albums
albums_resp = requests.get(
    f'https://api.spotify.com/v1/artists/{ARTIST_ID}/albums',
    headers=H,
    params={'include_groups': 'album,single', 'limit': 30, 'market': 'US'},
    timeout=20,
)
albums = albums_resp.json().get('items', []) if albums_resp.status_code == 200 else []
seen_album = set()
release_monitor = []
for a in albums:
    aid = a.get('id')
    if not aid or aid in seen_album:
        continue
    seen_album.add(aid)
    release_monitor.append({
        'name': a.get('name'),
        'release_date': a.get('release_date'),
        'type': a.get('album_type'),
        'url': (a.get('external_urls') or {}).get('spotify')
    })
release_monitor = sorted(release_monitor, key=lambda x: x.get('release_date') or '', reverse=True)[:10]

# Related artists
related_resp = requests.get(
    f'https://api.spotify.com/v1/artists/{ARTIST_ID}/related-artists',
    headers=H,
    timeout=20,
)
related = related_resp.json().get('artists', []) if related_resp.status_code == 200 else []
related_artists = [{
    'name': r.get('name'),
    'id': r.get('id'),
    'popularity': r.get('popularity'),
    'url': (r.get('external_urls') or {}).get('spotify')
} for r in related[:8]]

tracks = top_tracks[:10]
track_ids = {t.get('id'): t.get('name') for t in tracks if t.get('id')}
playlist_intel = []
verified_placements = []

for t in tracks[:5]:
    q = f"{t.get('name', '')} Mjcity"
    pls_resp = requests.get(
        'https://api.spotify.com/v1/search',
        headers=H,
        params={'q': q, 'type': 'playlist', 'limit': 5, 'market': 'US'},
        timeout=20,
    ).json()
    pls = [p for p in pls_resp.get('playlists', {}).get('items', []) if p]

    row = {
        'track': t.get('name'),
        'search_hits': len(pls),
        'sample_playlists': [
            {'name': p.get('name'), 'url': (p.get('external_urls') or {}).get('spotify')}
            for p in pls
        ][:5],
        'verified_count': 0,
        'verified_playlists': []
    }

    for p in pls:
        pid = p.get('id')
        if not pid:
            continue
        resp = requests.get(
            f'https://api.spotify.com/v1/playlists/{pid}/tracks',
            headers=H,
            params={'fields': 'items(track(id)),next', 'limit': 100},
            timeout=20,
        )
        if resp.status_code != 200:
            continue
        data = resp.json()
        matched = False
        while True:
            for it in data.get('items', []):
                tid = ((it or {}).get('track') or {}).get('id')
                if tid in track_ids:
                    matched = True
                    break
            if matched:
                break
            nxt = data.get('next')
            if not nxt:
                break
            n = requests.get(nxt, headers=H, timeout=20)
            if n.status_code != 200:
                break
            data = n.json()

        if matched:
            pv = {'name': p.get('name'), 'url': (p.get('external_urls') or {}).get('spotify')}
            row['verified_playlists'].append(pv)
            verified_placements.append({'track': t.get('name'), **pv})

    row['verified_count'] = len(row['verified_playlists'])
    playlist_intel.append(row)

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
hist = sorted(hist, key=lambda x: x.get('date'))[-365:]
HISTORY.write_text(json.dumps(hist, indent=2))

lead_track = tracks[0]['name'] if tracks else 'Latest track'
smart_captions = [
    f"New heat on deck 🎧 {lead_track} is live now. Stream it and tell me your favorite line. #Mjcity",
    "Appreciate every listener rocking with Mjcity. Keep running it up! 🚀",
    "Playlist curators: open to placements for Afro-pop energy — link in bio."
]

weekly_report = (
    f"This week: {len(tracks)} active tracks detected, "
    f"{sum(x.get('search_hits', 0) for x in playlist_intel)} playlist search hits, "
    f"{len(verified_placements)} verified placements."
)
catalog_health = 'Catalog trend: push your newest 2 releases with short-form video and playlist outreach.'

s4a = {}
if S4A.exists():
    try:
        s4a = json.loads(S4A.read_text())
    except Exception:
        s4a = {}

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
    'top_tracks_source': top_tracks_source,
    'tracks': [
        {
            'name': t.get('name'),
            'release_date': (t.get('album') or {}).get('release_date'),
            'album': (t.get('album') or {}).get('name'),
            'url': (t.get('external_urls') or {}).get('spotify'),
        }
        for t in tracks
    ],
    'release_monitor': release_monitor,
    'related_artists': related_artists,
    'playlist_intel': playlist_intel,
    'verified_placements': verified_placements,
    'smart_captions': smart_captions,
    'weekly_report': weekly_report,
    'catalog_health': catalog_health,
    'history': hist,
    'spotify_for_artists': s4a,
}
LATEST.write_text(json.dumps(latest, indent=2))
print('updated dashboard data')