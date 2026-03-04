#!/usr/bin/env python3
import json
import os
import subprocess
import time
from datetime import datetime, timezone

WORKSPACE = "/home/michael/.openclaw/workspace"
SESSIONS_JSON = "/home/michael/.openclaw/agents/main/sessions/sessions.json"
SESSIONS_DIR = "/home/michael/.openclaw/agents/main/sessions"
LIVE_REPO = f"{WORKSPACE}/tmp/pixel-agents-live"
LIVE_STATUS = f"{LIVE_REPO}/live-status.json"
TARGET_KEY = "agent:main:telegram:direct:5186415555"

started_at = None
last_task = "Waiting for request"


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def to_epoch(iso):
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).timestamp()
    except Exception:
        return time.time()


def get_session_file():
    if not os.path.exists(SESSIONS_JSON):
        return None
    with open(SESSIONS_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)
    entry = data.get(TARGET_KEY)
    if not entry:
        return None
    sid = entry.get("sessionId")
    if not sid:
        return None
    p = f"{SESSIONS_DIR}/{sid}.jsonl"
    return p if os.path.exists(p) else None


def extract_text(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        out = []
        for c in content:
            if isinstance(c, dict):
                t = c.get("text") or c.get("thinking") or ""
                if t:
                    out.append(t)
        return " ".join(out)
    return ""


def mk_payload(status, task, outcome="pending", helpers=None):
    global started_at
    now = now_iso()
    if status == "working" and not started_at:
        started_at = now
    if status == "done" and not started_at:
        started_at = now
    if status == "idle":
        started_at = None

    base = to_epoch(started_at) if started_at else time.time()
    elapsed = max(0, int(time.time() - base))
    return {
        "status": status,
        "task": task,
        "started_at": started_at or now,
        "updated_at": now,
        "elapsed_sec": elapsed,
        "outcome": outcome,
        "helpers": helpers or [],
    }


def to_status(obj):
    global started_at, last_task
    msg = obj.get("message", {})
    role = msg.get("role")

    if role == "user":
        txt = extract_text(msg.get("content", "")).strip().replace("\n", " ")
        last_task = txt[:120] or "New request"
        started_at = now_iso()
        return mk_payload("working", last_task, "pending", helpers=[])

    if role == "assistant":
        return mk_payload("done", last_task or "Response delivered", "success", helpers=[])

    if role == "toolResult":
        helpers = [
            {"id": 2, "status": "reading", "task": "Tool output parsing"},
            {"id": 3, "status": "working", "task": "Task execution"},
        ]
        return mk_payload("reading", last_task or "Using tools", "pending", helpers=helpers)

    return None


def sync_and_push():
    subprocess.run(["git", "fetch", "origin", "gh-pages"], cwd=LIVE_REPO, check=False)
    subprocess.run(["git", "reset", "--hard", "origin/gh-pages"], cwd=LIVE_REPO, check=False)


def write_status(payload):
    os.makedirs(os.path.dirname(LIVE_STATUS), exist_ok=True)
    existing = None
    if os.path.exists(LIVE_STATUS):
        try:
            existing = json.load(open(LIVE_STATUS, "r", encoding="utf-8"))
        except Exception:
            existing = None

    if existing and all(existing.get(k) == payload.get(k) for k in ["status", "task", "outcome", "elapsed_sec"]):
        return False

    sync_and_push()
    with open(LIVE_STATUS, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
        f.write("\n")

    subprocess.run(["git", "add", "live-status.json"], cwd=LIVE_REPO, check=False)
    commit = subprocess.run(["git", "commit", "-m", f"Live status: {payload['status']}"], cwd=LIVE_REPO, capture_output=True, text=True)
    if commit.returncode == 0:
        subprocess.run(["git", "push", "origin", "gh-pages"], cwd=LIVE_REPO, check=False)
        return True
    return False


def follow_file(path):
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        f.seek(0, os.SEEK_END)
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.6)
                continue
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except Exception:
                continue
            payload = to_status(obj)
            if payload:
                write_status(payload)


def main():
    while True:
        sf = get_session_file()
        if not sf:
            time.sleep(2)
            continue
        follow_file(sf)


if __name__ == "__main__":
    main()
