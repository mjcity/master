#!/usr/bin/env python3
import json
import time
from pathlib import Path

ROOT = Path('/home/michael/.openclaw/workspace')
EVENTS = ROOT / 'pixelops' / 'events.json'
LIVE_EVENTS = ROOT / 'tmp' / 'mjcitytracker-live' / 'pixelops' / 'events.json'

AGENT_MAP = {
    'dashboard': ('Nova', 'd1'),
    'tracker': ('Pulse', 'd2'),
    'techmymoney': ('Echo', 'd3'),
    'script': ('Byte', 'd4'),
    'automation': ('Byte', 'd4'),
    'media': ('Echo', 'd5'),
}

def pick_agent(task: str):
    low = task.lower()
    for k, v in AGENT_MAP.items():
        if k in low:
            return v
    return ('Nova', 'd1')

def load_events(path: Path):
    if not path.exists():
        return {'events': []}
    try:
        return json.loads(path.read_text())
    except Exception:
        return {'events': []}

def add_event(task: str, status: str, msg: str):
    data = load_events(EVENTS)
    events = data.get('events', [])[-120:]
    agent, desk = pick_agent(task)
    ev = {
        'ts': int(time.time()),
        'agent': agent,
        'deskId': desk,
        'status': status,
        'msg': msg
    }
    events.append(ev)
    out = {'events': events}
    EVENTS.write_text(json.dumps(out, indent=2))
    LIVE_EVENTS.parent.mkdir(parents=True, exist_ok=True)
    LIVE_EVENTS.write_text(json.dumps(out, indent=2))
    return ev

if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('--task', required=True)
    ap.add_argument('--status', required=True, choices=['idle','walk','type','read','done'])
    ap.add_argument('--msg', required=True)
    args = ap.parse_args()
    ev = add_event(args.task, args.status, args.msg)
    print(json.dumps(ev))
