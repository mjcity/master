const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');

const app = express();
const port = process.env.PORT || 8787;

app.use(cors());
app.use(express.json());

const tasks = new Map();

function buildScript(taskText, taskId) {
  return [
    {
      id: taskId,
      title: taskText,
      stage: 'Intake',
      progress: 10,
      status: 'Queued',
      summary: 'Task received by OpenClaw and converted into a runnable job.',
      connected: true,
      metrics: { tokens: 115, files: 0, tools: 1, errors: 0 },
      log: { tag: 'SYSTEM', message: 'Task registered in runtime queue.' }
    },
    {
      id: taskId,
      title: taskText,
      stage: 'Planning',
      progress: 24,
      status: 'Planning',
      summary: 'Execution strategy and subtask graph assembled.',
      connected: true,
      metrics: { tokens: 448, files: 1, tools: 3, errors: 0 },
      log: { tag: 'PLANNER', message: 'Run graph compiled from user objective.' },
      artifact: { title: 'Plan Draft', text: 'Subtasks and milestones mapped to visible stages.' }
    },
    {
      id: taskId,
      title: taskText,
      stage: 'Execution',
      progress: 57,
      status: 'Running',
      summary: 'Files are being modified and tool calls are being processed.',
      connected: true,
      metrics: { tokens: 1330, files: 6, tools: 6, errors: 0 },
      log: { tag: 'EXECUTOR', message: 'Applied code changes and emitted trace output.' },
      artifact: { title: 'Working Diff', text: 'OpenClaw updated target files during live run.' }
    },
    {
      id: taskId,
      title: taskText,
      stage: 'Validation',
      progress: 82,
      status: 'Reviewing',
      summary: 'OpenClaw is evaluating output quality and runtime integrity.',
      connected: true,
      metrics: { tokens: 1764, files: 8, tools: 8, errors: 0 },
      log: { tag: 'VALIDATOR', message: 'Health checks and acceptance criteria passing.' },
      artifact: { title: 'Validation Trace', text: 'Checks completed without blocking failures.' }
    },
    {
      id: taskId,
      title: taskText,
      stage: 'Delivery',
      progress: 100,
      status: 'Complete',
      summary: 'Final outputs prepared for deployment and user handoff.',
      connected: true,
      metrics: { tokens: 2104, files: 11, tools: 9, errors: 0 },
      log: { tag: 'DELIVERY', message: 'Task bundle finalized.' },
      artifact: { title: 'Final Output', text: 'Deployment-ready deliverables assembled.' }
    }
  ];
}

app.post('/api/task', (req, res) => {
  const taskText = req.body?.task?.trim();
  if (!taskText) return res.status(400).json({ error: 'Task text is required.' });

  const id = `OC-${randomUUID().slice(0, 8).toUpperCase()}`;
  tasks.set(id, buildScript(taskText, id));
  res.json({ id, ok: true });
});

app.get('/api/stream', (req, res) => {
  const taskId = req.query.taskId;
  if (!taskId || !tasks.has(taskId)) return res.status(404).end();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const script = tasks.get(taskId);
  let index = 0;

  const interval = setInterval(() => {
    const item = script[index];
    res.write(`data: ${JSON.stringify(item)}\n\n`);
    index += 1;

    if (index >= script.length) {
      clearInterval(interval);
      setTimeout(() => res.end(), 300);
    }
  }, 1200);

  req.on('close', () => clearInterval(interval));
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'openclaw-mission-control-backend' });
});

app.listen(port, () => {
  console.log(`Mission Control backend listening on http://localhost:${port}`);
});
