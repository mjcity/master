const TILE = 32;
const BUILD = '31';
const canvas = document.getElementById('office');
const ctx = canvas.getContext('2d');
const wrap = document.getElementById('floorWrap');

const stateOrder = ['idle', 'walk', 'type', 'read', 'done'];
const frameRanges = {
  idle: [0, 3],
  walk: [4, 11],
  type: [12, 15],
  read: [16, 19],
  done: [20, 23]
};

const desks = [
  { id: 'd1', name: 'Artist Dashboard', tx: 6, ty: 5 },
  { id: 'd2', name: 'Goal Tracker', tx: 14, ty: 5 },
  { id: 'd3', name: 'TechMyMoney', tx: 22, ty: 5 },
  { id: 'd4', name: 'Automation', tx: 10, ty: 13 },
  { id: 'd5', name: 'Media Ops', tx: 19, ty: 13 }
];

let selectedAgent = null;
let mapData = null;
let worldW = 960;
let worldH = 640;
let eventCursor = 0;

const assets = {
  tiles: new Image(),
  nova: new Image(),
  byte: new Image(),
  pulse: new Image(),
  stack: new Image()
};

const agents = [
  mkAgent('Nova', 'Frontend', 'nova', 3, 15),
  mkAgent('Byte', 'Automation', 'byte', 5, 15),
  mkAgent('Pulse', 'QA', 'pulse', 7, 15),
  mkAgent('Stack', 'Research', 'stack', 9, 15)
];

function mkAgent(name, role, sheet, tx, ty) {
  return {
    id: Math.random().toString(36).slice(2, 10),
    name,
    role,
    sheet,
    state: 'idle',
    tx,
    ty,
    x: tx,
    y: ty,
    target: null,
    bubble: '',
    bubbleUntil: 0,
    dir: 1
  };
}

function log(msg) {
  const feed = document.getElementById('feed');
  const li = document.createElement('li');
  li.textContent = `${new Date().toLocaleTimeString()} • ${msg}`;
  feed.prepend(li);
  while (feed.children.length > 40) feed.removeChild(feed.lastChild);
}

function renderPanels() {
  const desksEl = document.getElementById('desks');
  desksEl.innerHTML = '';
  desks.forEach((d) => {
    const el = document.createElement('div');
    el.className = 'desk';
    el.innerHTML = `<strong>${d.name}</strong><br><small>tile ${d.tx},${d.ty}</small>`;
    el.onclick = () => assignDesk(d.id);
    desksEl.appendChild(el);
  });

  const agentsEl = document.getElementById('agents');
  agentsEl.innerHTML = '';
  agents.forEach((a) => {
    const el = document.createElement('div');
    el.className = 'agent';
    el.innerHTML = `<div><strong>${a.name}</strong><br><small>${a.role}</small></div><span class="chip ${a.state}">${a.state}</span>`;
    el.onclick = () => { selectedAgent = a.id; renderPanels(); log(`${a.name} selected`); };
    el.ondblclick = () => cycleState(a.id);
    if (selectedAgent === a.id) el.style.outline = '1px solid #6ee7ff';
    agentsEl.appendChild(el);
  });
}

function cycleState(id) {
  const a = agents.find((x) => x.id === id);
  if (!a) return;
  a.state = stateOrder[(stateOrder.indexOf(a.state) + 1) % stateOrder.length];
  say(a, a.state.toUpperCase(), 1200);
  renderPanels();
}

function assignDesk(did) {
  if (!selectedAgent) return log('Select an agent first.');
  const a = agents.find((x) => x.id === selectedAgent);
  const d = desks.find((x) => x.id === did);
  if (!a || !d) return;

  if (isBlocked(d.tx, d.ty)) {
    log(`${d.name} tile blocked by collision map; adjust map or desk`);
    return;
  }

  a.target = { tx: d.tx, ty: d.ty };
  a.state = 'walk';
  say(a, `To ${d.name}`, 1400);
  renderPanels();
  log(`${a.name} assigned to ${d.name}`);
}

function say(agent, text, ms = 1400) {
  agent.bubble = text;
  agent.bubbleUntil = Date.now() + ms;
}

function getLayer(name) {
  return (mapData?.layers || []).find((l) => l.name === name && l.type === 'tilelayer');
}

function tileAt(layer, tx, ty) {
  if (!layer) return 0;
  if (tx < 0 || ty < 0 || tx >= layer.width || ty >= layer.height) return 0;
  return layer.data[ty * layer.width + tx] || 0;
}

function isBlocked(tx, ty) {
  const col = getLayer('Collision');
  return tileAt(col, tx, ty) > 0;
}

function drawMapLayer(layerName) {
  const layer = getLayer(layerName);
  if (!layer) return;

  const tilesetCols = 8;
  for (let ty = 0; ty < layer.height; ty++) {
    for (let tx = 0; tx < layer.width; tx++) {
      const gid = tileAt(layer, tx, ty);
      if (!gid) continue;
      const id = gid - 1;
      const sx = (id % tilesetCols) * TILE;
      const sy = Math.floor(id / tilesetCols) * TILE;
      ctx.drawImage(assets.tiles, sx, sy, TILE, TILE, tx * TILE, ty * TILE, TILE, TILE);
    }
  }
}

function frameFor(agent, now) {
  const [s, e] = frameRanges[agent.state] || frameRanges.idle;
  const count = e - s + 1;
  const frame = s + (Math.floor(now / 120) % count);
  return frame;
}

function drawAgents(now) {
  agents.forEach((a) => {
    const img = assets[a.sheet];
    if (!img.complete) return;

    const frame = frameFor(a, now);
    const sx = frame * 32;
    const sy = 0;

    const px = a.x * TILE + TILE / 2;
    const py = a.y * TILE + TILE / 2;

    ctx.save();
    if (a.dir < 0) {
      ctx.translate(px, py);
      ctx.scale(-1, 1);
      ctx.drawImage(img, sx, sy, 32, 32, -24, -30, 48, 48);
    } else {
      ctx.drawImage(img, sx, sy, 32, 32, px - 24, py - 30, 48, 48);
    }
    ctx.restore();

    if (Date.now() < a.bubbleUntil && a.bubble) drawBubble(px, py - 24, a.bubble);
  });
}

function drawBubble(x, y, text) {
  ctx.font = '12px sans-serif';
  const w = ctx.measureText(text).width + 12;
  const h = 20;
  const bx = x - w / 2;
  const by = y - h - 10;

  ctx.fillStyle = '#111827';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  roundRect(bx, by, w, h, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e5e7eb';
  ctx.fillText(text, bx + 6, by + 14);
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function updateAgents() {
  agents.forEach((a) => {
    if (!a.target) return;

    const dx = a.target.tx - a.x;
    const dy = a.target.ty - a.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.05) {
      a.x = a.target.tx;
      a.y = a.target.ty;
      a.target = null;
      if (a.state === 'walk') {
        a.state = 'type';
        say(a, 'WORK', 1000);
      }
      return;
    }

    // Stardew-smooth + Pokemon-ish snap end
    const speed = 0.08;
    a.x += dx * speed;
    a.y += dy * speed;
    a.dir = dx < 0 ? -1 : 1;
    if (a.state !== 'walk') a.state = 'walk';
  });
}

function draw(now) {
  ctx.clearRect(0, 0, worldW, worldH);
  drawMapLayer('Ground');
  drawMapLayer('Walls');
  drawMapLayer('Objects');
  updateAgents();
  drawAgents(now);
  requestAnimationFrame(draw);
}

function fitCanvas() {
  const rect = wrap.getBoundingClientRect();
  const maxW = Math.max(320, rect.width - 20);
  const scale = Math.min(maxW / worldW, 1);
  canvas.style.width = `${Math.floor(worldW * scale)}px`;
  canvas.style.height = `${Math.floor(worldH * scale)}px`;
}

async function pollEvents() {
  try {
    const r = await fetch(`./events.json?_=${Date.now()}`);
    if (!r.ok) return;
    const d = await r.json();
    (d.events || []).forEach((e) => {
      if ((e.ts || 0) <= eventCursor) return;
      eventCursor = Math.max(eventCursor, e.ts || 0);
      const a = agents.find((x) => x.name.toLowerCase() === String(e.agent || '').toLowerCase()) || agents[0];
      if (!a) return;
      if (e.status) a.state = e.status;
      if (e.deskId) {
        selectedAgent = a.id;
        assignDesk(e.deskId);
      }
      if (e.msg) {
        say(a, e.msg.slice(0, 16), 1600);
        log(`${a.name}: ${e.msg}`);
      }
    });
    renderPanels();
  } catch {}
}

async function loadMap() {
  const r = await fetch(`./assets/maps/office_map.json?v=${BUILD}`, { cache: 'no-store' });
  mapData = await r.json();
  worldW = mapData.width * TILE;
  worldH = mapData.height * TILE;
  canvas.width = worldW;
  canvas.height = worldH;
}

function waitImage(img) {
  return new Promise((resolve) => {
    if (img.complete) return resolve();
    img.onload = img.onerror = () => resolve();
  });
}

async function init() {
  assets.tiles.src = `./assets/tiles/office_tiles_32.png?v=${BUILD}`;
  assets.nova.src = `./assets/characters/nova.png?v=${BUILD}`;
  assets.byte.src = `./assets/characters/byte.png?v=${BUILD}`;
  assets.pulse.src = `./assets/characters/pulse.png?v=${BUILD}`;
  assets.stack.src = `./assets/characters/stack.png?v=${BUILD}`;

  await Promise.all([loadMap(), ...Object.values(assets).map(waitImage)]);

  renderPanels();
  fitCanvas();
  log('PixelOps clean rebuild ready');
  requestAnimationFrame(draw);
  setInterval(pollEvents, 3000);
}

window.addEventListener('resize', fitCanvas);
init();
