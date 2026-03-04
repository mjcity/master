#!/usr/bin/env python3
import json
import os
import threading
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

WORKSPACE = "/home/michael/.openclaw/workspace"
SESSIONS_JSON = "/home/michael/.openclaw/agents/main/sessions/sessions.json"
SESSIONS_DIR = "/home/michael/.openclaw/agents/main/sessions"
LIVE_STATUS_FILE = f"{WORKSPACE}/tmp/pixel-agents-live/live-status.json"
TARGET_KEY = "agent:main:telegram:direct:5186415555"
PORT = 8765

state_lock = threading.Lock()
state = {
    "status": "idle",
    "task": "Waiting for request",
    "started_at": "",
    "updated_at": "",
    "elapsed_sec": 0,
    "outcome": "pending",
    "helpers": [],
}
_started_epoch = None
_last_task = "Waiting for request"


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


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


def set_state(status, task, outcome="pending", helpers=None):
    global _started_epoch
    now = time.time()
    if status == "working":
        _started_epoch = now
    if _started_epoch is None:
        _started_epoch = now
    elapsed = max(0, int(now - _started_epoch))

    payload = {
        "status": status,
        "task": task,
        "started_at": datetime.fromtimestamp(_started_epoch, timezone.utc).isoformat().replace("+00:00", "Z"),
        "updated_at": now_iso(),
        "elapsed_sec": elapsed,
        "outcome": outcome,
        "helpers": helpers or [],
    }

    with state_lock:
        state.update(payload)

    os.makedirs(os.path.dirname(LIVE_STATUS_FILE), exist_ok=True)
    with open(LIVE_STATUS_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
        f.write("\n")


def to_status(obj):
    global _last_task
    msg = obj.get("message", {})
    role = msg.get("role")

    if role == "user":
        txt = extract_text(msg.get("content", "")).strip().replace("\n", " ")
        _last_task = txt[:120] or "New request"
        set_state("working", _last_task, "pending", [])
        return

    if role == "toolResult":
        helpers = [
            {"id": 2, "status": "reading", "task": "Analyzing output"},
            {"id": 3, "status": "working", "task": "Executing task"},
        ]
        set_state("reading", _last_task or "Using tools", "pending", helpers)
        return

    if role == "assistant":
        set_state("done", _last_task or "Response delivered", "success", [])
        return


class Handler(BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path.startswith("/status"):
            with state_lock:
                self._send_json(dict(state))
            return
        self._send_json({"ok": True, "service": "pixel-agents-live-bridge", "status": "up"})

    def log_message(self, fmt, *args):
        return


def serve_http():
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    server.serve_forever()


def follow_file(path):
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        f.seek(0, os.SEEK_END)
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.4)
                continue
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except Exception:
                continue
            to_status(obj)


def main():
    set_state("idle", "Waiting for request", "pending", [])
    threading.Thread(target=serve_http, daemon=True).start()
    while True:
        sf = get_session_file()
        if not sf:
            time.sleep(1.0)
            continue
        follow_file(sf)


if __name__ == "__main__":
    main()
