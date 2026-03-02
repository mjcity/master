const BUILD = '37';
const canvas = document.getElementById('office');
const ctx = canvas.getContext('2d');
const wrap = document.getElementById('floorWrap');
const TILE = 32;

let mapData = null;
let worldW = 960;
let worldH = 640;
let selectedAgent = null;
let eventCursor = 0;
let tick = 0;

const stateOrder = ['idle', 'walk', 'type', 'read', 'done'];
const desks = [
  { id: 'd1', name: 'Artist Dashboard', tx: 6, ty: 5 },
  { id: 'd2', name: 'Goal Tracker', tx: 14, ty: 5 },
  { id: 'd3', name: 'TechMyMoney', tx: 22, ty: 5 },
  { id: 'd4', name: 'Automation', tx: 10, ty: 13 },
  { id: 'd5', name: 'Media Ops', tx: 19, ty: 13 }
];

const rawAssets = {
  tiles: img(`./assets/tiles/office_tiles_32.png?v=${BUILD}`),
  tilesClean: img(`./assets/imported/v4/tiles_clean.jpg?v=${BUILD}`),
  bubbles: img(`./assets/imported/v4/bubbles.jpg?v=${BUILD}`),
  officeLayout: img(`./assets/imported/v4/office_layout.jpg?v=${BUILD}`),
  officeItems: img(`./assets/imported/v4/office_items_plus_brown.jpg?v=${BUILD}`),
  female: img(`./assets/imported/v4/char_female.jpg?v=${BUILD}`),
  maleBrown: img(`./assets/imported/v4/char_male_brown.jpg?v=${BUILD}`),
  maleBlack: img(`./assets/imported/v4/char_male_black.jpg?v=${BUILD}`),
  maleGray: img(`./assets/imported/v4/char_male_gray.jpg?v=${BUILD}`)
};

const sheetMeta = {
  female: { cols: 6, rows: 3, map: { idle: [0, 2], walk: [0, 5], type: [0, 1], read: [2, 3], done: [4, 4] } },
  maleBrown: { cols: 6, rows: 3, map: { idle: [0, 2], walk: [0, 5], type: [0, 1], read: [2, 3], done: [5, 5] } },
  maleBlack: { cols: 7, rows: 3, map: { idle: [0, 2], walk: [0, 6], type: [0, 1], read: [2, 4], done: [6, 6] } },
  maleGray: { cols: 7, rows: 3, map: { idle: [0, 2], walk: [0, 6], type: [0, 1], read: [2, 4], done: [6, 6] } }
};

const processedSheets = {};

const agents = [
  mkAgent('Nova', 'Frontend', 'maleBlack', 3, 15),
  mkAgent('Byte', 'Automation', 'maleGray', 5, 15),
  mkAgent('Pulse', 'QA', 'female', 7, 15),
  mkAgent('Stack', 'Research', 'maleBrown', 9, 15)
];

function img(src) { const i = new Image(); i.src = src; return i; }
function randId() { return Math.random().toString(36).slice(2, 10); }
function mkAgent(name, role, skin, tx, ty) {
  return { id: randId(), name, role, skin, tx, ty, x: tx, y: ty, target: null, state: 'idle', dir: 1, bubble: '', bubbleUntil: 0 };
}

function log(msg) {
  const feed = document.getElementById('feed');
  const li = document.createElement('li');
  li.textContent = `${new Date().toLocaleTimeString()} • ${msg}`;
  feed.prepend(li);
  while (feed.children.length > 40) feed.removeChild(feed.lastChild);
}

function getLayer(name) { return (mapData?.layers || []).find((l) => l.type === 'tilelayer' && l.name === name); }
function tileAt(layer, tx, ty) { if (!layer) return 0; if (tx < 0 || ty < 0 || tx >= layer.width || ty >= layer.height) return 0; return layer.data[ty * layer.width + tx] || 0; }
function blocked(tx, ty) { const c = getLayer('Collision'); return tileAt(c, tx, ty) > 0; }

function drawLayer(name) {
  const layer = getLayer(name); if (!layer) return;
  const cols = 8;
  for (let y = 0; y < layer.height; y++) {
    for (let x = 0; x < layer.width; x++) {
      const gid = tileAt(layer, x, y); if (!gid) continue;
      const id = gid - 1;
      const sx = (id % cols) * TILE;
      const sy = Math.floor(id / cols) * TILE;
      ctx.drawImage(rawAssets.tiles, sx, sy, TILE, TILE, x * TILE, y * TILE, TILE, TILE);
    }
  }
}

function drawOfficeOverlay() {
  if (rawAssets.officeLayout.complete) {
    ctx.globalAlpha = 0.2;
    ctx.drawImage(rawAssets.officeLayout, 0, 0, rawAssets.officeLayout.naturalWidth, rawAssets.officeLayout.naturalHeight, 16, 16, worldW - 32, 120);
    ctx.globalAlpha = 1;
  }
  if (rawAssets.officeItems.complete) {
    const w = rawAssets.officeItems.naturalWidth;
    const h = rawAssets.officeItems.naturalHeight;
    ctx.globalAlpha = 0.24;
    ctx.drawImage(rawAssets.officeItems, 0, 0, w, h, 20, worldH - 230, worldW - 40, 190);
    ctx.globalAlpha = 1;
  }
  if (rawAssets.tilesClean.complete) {
    ctx.globalAlpha = 0.14;
    ctx.drawImage(rawAssets.tilesClean, 0, 0, rawAssets.tilesClean.naturalWidth, rawAssets.tilesClean.naturalHeight, worldW - 220, 8, 210, 110);
    ctx.globalAlpha = 1;
  }
}

function frameFor(agent) {
  const meta = sheetMeta[agent.skin];
  const [s, e] = meta.map[agent.state] || meta.map.idle;
  const count = e - s + 1;
  const col = s + (count > 1 ? (Math.floor(tick / 10) % count) : 0);
  const row = agent.state === 'walk' ? 1 : (agent.state === 'type' || agent.state === 'read' || agent.state === 'done' ? 2 : 0);
  return { col, row };
}

function drawAgent(a) {
  const sheet = processedSheets[a.skin];
  const meta = sheetMeta[a.skin];
  if (!sheet || !meta) return;

  const f = frameFor(a);
  const frame = sheet.frames[f.row * meta.cols + f.col] || sheet.frames[0];
  if (!frame) return;

  const px = a.x * TILE + TILE / 2;
  const py = a.y * TILE + TILE / 2;
  const dw = 72;
  const dh = 72;

  ctx.save();
  if (a.dir < 0) {
    ctx.translate(px, py);
    ctx.scale(-1, 1);
    ctx.drawImage(frame, -dw / 2, -dh + 10, dw, dh);
  } else {
    ctx.drawImage(frame, px - dw / 2, py - dh + 10, dw, dh);
  }
  ctx.restore();

  if (Date.now() < a.bubbleUntil && a.bubble) drawBubble(px, py - 42, a.bubble);
}

function drawBubble(x, y, text) {
  ctx.font = '12px sans-serif';
  const tw = ctx.measureText(text).width;
  const w = Math.max(90, tw + 16);
  const h = 24;
  const bx = x - w / 2;
  const by = y - h;

  if (rawAssets.bubbles.complete) {
    // Use your bubble atlas background (top-left rectangular bubble)
    ctx.drawImage(rawAssets.bubbles, 0, 0, 250, 90, bx - 8, by - 10, w + 16, h + 16);
    ctx.fillStyle = '#111827';
    ctx.fillText(text, bx + (w - tw) / 2, by + 16);
    return;
  }

  ctx.fillStyle = 'rgba(17,24,39,0.95)';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  roundRect(bx, by, w, h, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e5e7eb';
  ctx.fillText(text, bx + (w - tw) / 2, by + 16);
}
function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

function updateAgents() {
  agents.forEach((a) => {
    if (!a.target) return;
    const dx = a.target.tx - a.x;
    const dy = a.target.ty - a.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.05) {
      a.x = a.target.tx; a.y = a.target.ty; a.target = null;
      if (a.state === 'walk') { a.state = 'type'; say(a, 'WORK', 1000); }
      return;
    }
    a.x += dx * 0.08; a.y += dy * 0.08;
    a.state = 'walk'; a.dir = dx < 0 ? -1 : 1;
  });
}

function say(a, text, ms = 1300) { a.bubble = text; a.bubbleUntil = Date.now() + ms; }

function renderPanels() {
  const d = document.getElementById('desks'); d.innerHTML = '';
  desks.forEach((x) => {
    const el = document.createElement('div'); el.className = 'desk';
    el.innerHTML = `<strong>${x.name}</strong>`;
    el.onclick = () => assignDesk(x.id);
    d.appendChild(el);
  });

  const a = document.getElementById('agents'); a.innerHTML = '';
  agents.forEach((x) => {
    const el = document.createElement('div'); el.className = 'agent';
    el.innerHTML = `<div><strong>${x.name}</strong><br><small>${x.role}</small></div><span class="chip ${x.state}">${x.state}</span>`;
    el.onclick = () => { selectedAgent = x.id; renderPanels(); log(`${x.name} selected`); };
    el.ondblclick = () => cycleState(x.id);
    if (selectedAgent === x.id) el.style.outline = '1px solid #6ee7ff';
    a.appendChild(el);
  });
}

function assignDesk(id) {
  if (!selectedAgent) return log('Select an agent first.');
  const a = agents.find((x) => x.id === selectedAgent);
  const d = desks.find((x) => x.id === id);
  if (!a || !d) return;
  if (blocked(d.tx, d.ty)) return log(`${d.name} blocked by collision`);
  a.target = { tx: d.tx, ty: d.ty };
  a.state = 'walk';
  say(a, `To ${d.name}`, 1500);
  renderPanels();
  log(`${a.name} assigned to ${d.name}`);
}

function cycleState(id) {
  const a = agents.find((x) => x.id === id); if (!a) return;
  a.state = stateOrder[(stateOrder.indexOf(a.state) + 1) % stateOrder.length];
  say(a, a.state.toUpperCase(), 900);
  renderPanels();
}

function fit() {
  const rect = wrap.getBoundingClientRect();
  const maxW = Math.max(320, rect.width - 20);
  const scale = Math.min(maxW / worldW, 1);
  canvas.style.width = `${Math.floor(worldW * scale)}px`;
  canvas.style.height = `${Math.floor(worldH * scale)}px`;
}

function draw() {
  tick++;
  ctx.clearRect(0, 0, worldW, worldH);
  drawLayer('Ground');
  drawLayer('Walls');
  drawLayer('Objects');
  drawOfficeOverlay();
  updateAgents();
  agents.forEach(drawAgent);
  requestAnimationFrame(draw);
}

async function pollEvents() {
  try {
    const r = await fetch('./events.json?_=' + Date.now()); if (!r.ok) return;
    const d = await r.json();
    (d.events || []).forEach((e) => {
      if ((e.ts || 0) <= eventCursor) return;
      eventCursor = Math.max(eventCursor, e.ts || 0);
      const a = agents.find((x) => x.name.toLowerCase() === String(e.agent || '').toLowerCase()) || agents[0];
      if (!a) return;
      if (e.status) a.state = e.status;
      if (e.deskId) { selectedAgent = a.id; assignDesk(e.deskId); }
      if (e.msg) { say(a, e.msg.slice(0, 16), 1500); log(`${a.name}: ${e.msg}`); }
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

function wait(i) { return new Promise((res) => { if (i.complete) return res(); i.onload = i.onerror = () => res(); }); }

function buildProcessedSheet(image, cols, rows) {
  const fw = Math.floor(image.naturalWidth / cols);
  const fh = Math.floor(image.naturalHeight / rows);
  const frames = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const can = document.createElement('canvas');
      can.width = fw; can.height = fh;
      const cctx = can.getContext('2d');
      cctx.drawImage(image, c * fw, r * fh, fw, fh, 0, 0, fw, fh);

      const imgData = cctx.getImageData(0, 0, fw, fh);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const rr = d[i], gg = d[i + 1], bb = d[i + 2];
        // Chroma-key near-black backdrop from uploaded jpg sheets
        if (rr < 24 && gg < 24 && bb < 24) d[i + 3] = 0;
      }
      cctx.putImageData(imgData, 0, 0);
      frames.push(can);
    }
  }
  return { frames, fw, fh };
}

async function init() {
  await Promise.all([loadMap(), ...Object.values(rawAssets).map(wait)]);

  Object.keys(sheetMeta).forEach((k) => {
    processedSheets[k] = buildProcessedSheet(rawAssets[k], sheetMeta[k].cols, sheetMeta[k].rows);
  });

  renderPanels();
  fit();
  log('PixelOps v37: your latest image pack is active');
  requestAnimationFrame(draw);
  setInterval(pollEvents, 3000);
}

window.addEventListener('resize', fit);
init();