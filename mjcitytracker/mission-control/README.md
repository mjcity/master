# OpenClaw Mission Control

A polished, GitHub-hostable operational workspace for OpenClaw.

## What this gives you

- A front-end "official space" that feels like a live control room
- Task intake box for sending jobs to OpenClaw
- Real-time stage progression: Intake → Planning → Execution → Validation → Delivery
- Execution stream log
- Telemetry cards for tokens, files, tools, and errors
- Artifact panel for outputs and checkpoints
- Works in two modes:
  - **Simulation mode** for front-end preview on GitHub Pages
  - **Live mode** using a small backend with Server-Sent Events

## Folder structure

- `index.html` — main interface
- `styles.css` — visual system and layout
- `app.js` — front-end logic
- `backend/server.js` — tiny API + SSE stream for live updates
- `backend/package.json` — Node dependencies
- `.github/workflows/deploy.yml` — GitHub Pages deployment workflow

## GitHub Pages deployment

1. Create a new GitHub repo.
2. Upload the contents of this folder.
3. In GitHub, enable **Pages** from the repository settings.
4. Use **GitHub Actions** as the source.
5. Push to `main`.
6. The workflow will publish the static front-end.

## Live backend setup

GitHub Pages only serves static files, so the live streaming layer should run separately.
You can host the backend on:

- Render
- Railway
- Fly.io
- a VPS
- local machine during development

### Start backend locally

```bash
cd backend
npm install
npm start
```

This runs at:

```bash
http://localhost:8787
```

## Hooking OpenClaw into the stream

Replace the mock `buildScript()` flow in `backend/server.js` with your real OpenClaw runtime events.

### Expected task dispatch payload

`POST /api/task`

```json
{
  "task": "Solve the pathfinding bug in my tactics game and show every visible step."
}
```

### Expected streamed event shape

Each SSE message should look like:

```json
{
  "id": "OC-AB12CD34",
  "title": "Solve the pathfinding bug in my tactics game and show every visible step.",
  "stage": "Execution",
  "progress": 57,
  "status": "Running",
  "summary": "Files are being modified and tool calls are being processed.",
  "connected": true,
  "metrics": {
    "tokens": 1330,
    "files": 6,
    "tools": 6,
    "errors": 0
  },
  "log": {
    "tag": "EXECUTOR",
    "message": "Applied code changes and emitted trace output."
  },
  "artifact": {
    "title": "Working Diff",
    "text": "OpenClaw updated target files during live run."
  }
}
```

## Making it feel truly official

Recommended additions for your production version:

- OpenClaw logo and brand mark
- auth gate for private sessions
- persistent task history in Supabase or Firebase
- actual file diffs streamed from the agent
- screenshot panel of current workspace
- multi-agent lanes for planner / coder / reviewer / deployer
- GitHub commit feed and deployment status
- cloud logs and retry state

## Front-end endpoint override

By default the front-end uses:

- API: `http://localhost:8787/api/task`
- Stream: `http://localhost:8787/api/stream`

You can override these by setting before `app.js` loads:

```html
<script>
  window.OPENCLAW_API = "https://your-backend.example.com/api/task";
  window.OPENCLAW_STREAM = "https://your-backend.example.com/api/stream";
</script>
```

## Best production architecture

- **GitHub Pages** → static front-end
- **Render/Railway/Fly** → backend SSE service
- **OpenClaw runtime** → sends step events into backend
- **Optional database** → task history, logs, artifacts, user sessions

## Suggested next build phase

- add authenticated private workspace
- add real GitHub repo browser
- add live file tree and diff viewer
- add task replay timeline
- add model/tool cost tracking
