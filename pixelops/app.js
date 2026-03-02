const BUILD = '32';
const canvas = document.getElementById('office');
const ctx = canvas.getContext('2d');
const wrap = document.getElementById('floorWrap');

const WORLD_W = 1200;
const WORLD_H = 760;
canvas.width = WORLD_W;
canvas.height = WORLD_H;

const assets = {
  office: img('./assets/imported/v2/office_items.jpg?v=' + BUILD),
  tilesPack: img('./assets/imported/v2/tiles_and_brown_sheet.jpg?v=' + BUILD),
  bubbles: img('./assets/imported/v2/bubbles.jpg?v=' + BUILD),
  maleBrown: img('./assets/imported/v2/char_male_brown.jpg?v=' + BUILD),
  maleBlack: img('./assets/imported/v2/char_male_black.jpg?v=' + BUILD),
  maleGray: img('./assets/imported/v2/char_male_gray.jpg?v=' + BUILD),
  female: img('./assets/imported/v2/char_female_blonde.jpg?v=' + BUILD)
};

const stateOrder = ['idle', 'walk', 'type', 'read', 'done'];
const desks = [
  { id:'d1', name:'Artist Dashboard', x:220, y:250 },
  { id:'d2', name:'Goal Tracker', x:470, y:250 },
  { id:'d3', name:'TechMyMoney', x:760, y:250 },
  { id:'d4', name:'Automation', x:360, y:520 },
  { id:'d5', name:'Media Ops', x:640, y:520 }
];

const spriteMeta = {
  maleBrown: { cols: 6, rows: 3 },
  maleBlack: { cols: 7, rows: 3 },
  maleGray: { cols: 7, rows: 3 },
  female: { cols: 6, rows: 3 }
};

const agents = [
  mkAgent('Nova','Frontend','maleBlack',120,650),
  mkAgent('Byte','Automation','maleGray',200,650),
  mkAgent('Pulse','QA','female',280,650),
  mkAgent('Echo','Research','maleBrown',360,650)
];

let selectedAgent = null;
let eventCursor = 0;
let frameTick = 0;

function img(src){ const i = new Image(); i.src = src; return i; }

function mkAgent(name, role, sheet, x, y){
  return { id: Math.random().toString(36).slice(2,10), name, role, sheet, x, y, tx:x, ty:y, state:'idle', dir:1, bubble:'', bubbleUntil:0 };
}

function log(msg){
  const feed=document.getElementById('feed');
  const li=document.createElement('li');
  li.textContent = `${new Date().toLocaleTimeString()} • ${msg}`;
  feed.prepend(li);
  while(feed.children.length>40) feed.removeChild(feed.lastChild);
}

function renderPanels(){
  const desksEl = document.getElementById('desks');
  desksEl.innerHTML='';
  desks.forEach(d => {
    const el=document.createElement('div');
    el.className='desk';
    el.innerHTML=`<strong>${d.name}</strong>`;
    el.onclick=()=>assignDesk(d.id);
    desksEl.appendChild(el);
  });

  const agentsEl = document.getElementById('agents');
  agentsEl.innerHTML='';
  agents.forEach(a => {
    const el=document.createElement('div');
    el.className='agent';
    el.innerHTML=`<div><strong>${a.name}</strong><br><small>${a.role}</small></div><span class="chip ${a.state}">${a.state}</span>`;
    el.onclick=()=>{selectedAgent=a.id; renderPanels(); log(`${a.name} selected`);};
    el.ondblclick=()=>cycleState(a.id);
    if(selectedAgent===a.id) el.style.outline='1px solid #6ee7ff';
    agentsEl.appendChild(el);
  });
}

function assignDesk(id){
  if(!selectedAgent) return log('Select an agent first.');
  const a=agents.find(x=>x.id===selectedAgent);
  const d=desks.find(x=>x.id===id);
  if(!a||!d) return;
  a.tx=d.x; a.ty=d.y+34; a.state='walk'; a.bubble=`To ${d.name}`; a.bubbleUntil=Date.now()+1600;
  log(`${a.name} assigned to ${d.name}`);
  renderPanels();
}

function cycleState(id){
  const a=agents.find(x=>x.id===id); if(!a) return;
  a.state = stateOrder[(stateOrder.indexOf(a.state)+1)%stateOrder.length];
  a.bubble = a.state.toUpperCase();
  a.bubbleUntil = Date.now()+1200;
  renderPanels();
}

function drawBackground(){
  // Use uploaded tile/furniture atlases only
  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0,0,WORLD_W,WORLD_H);

  if (assets.tilesPack.complete) {
    // Floors/walls strip from top of tiles pack
    ctx.drawImage(assets.tilesPack, 0, 0, assets.tilesPack.naturalWidth, Math.floor(assets.tilesPack.naturalHeight*0.36), 0, 0, WORLD_W, 220);
    // Props strip
    ctx.drawImage(assets.tilesPack, 0, Math.floor(assets.tilesPack.naturalHeight*0.36), assets.tilesPack.naturalWidth, Math.floor(assets.tilesPack.naturalHeight*0.64), 40, 220, WORLD_W-80, 300);
  }

  if (assets.office.complete) {
    // Overlay richer office furniture for depth
    const iw = assets.office.naturalWidth, ih = assets.office.naturalHeight;
    ctx.drawImage(assets.office, 0, Math.floor(ih*0.35), iw, Math.floor(ih*0.55), 90, 180, WORLD_W-180, 360);
  }

  // dark footer walk lane
  ctx.fillStyle = '#05070d';
  ctx.fillRect(0, 560, WORLD_W, 200);
}

function drawDesks(){
  ctx.font='12px sans-serif';
  desks.forEach(d => {
    ctx.fillStyle='#704010'; ctx.fillRect(d.x-35, d.y-22, 70, 30);
    ctx.fillStyle='#9ca3af'; ctx.fillRect(d.x-12, d.y-30, 24, 10);
    ctx.fillStyle='#dbeafe'; ctx.fillText(d.name, d.x-52, d.y+26);
  });
}

function frameFor(agent){
  const meta = spriteMeta[agent.sheet] || { cols: 6, rows: 3 };
  const base = {
    idle: [0, 2],
    walk: [0, meta.cols - 1],
    type: [Math.max(0, meta.cols - 2), Math.max(0, meta.cols - 1)],
    read: [Math.max(0, meta.cols - 3), Math.max(0, meta.cols - 2)],
    done: [meta.cols - 1, meta.cols - 1]
  };
  const [s,e] = base[agent.state] || base.idle;
  const c = e - s + 1;
  const col = s + (c>1 ? (Math.floor(frameTick/10) % c) : 0);
  const row = agent.state === 'walk' ? 1 : (agent.state === 'type' || agent.state === 'read' || agent.state === 'done' ? 2 : 0);
  return { col, row, cols: meta.cols, rows: meta.rows };
}

function drawAgent(agent){
  const sheet = assets[agent.sheet];
  if (!sheet.complete) return;
  const f = frameFor(agent);
  const fw = sheet.naturalWidth / f.cols;
  const fh = sheet.naturalHeight / f.rows;
  const sx = Math.floor(f.col * fw);
  const sy = Math.floor(f.row * fh);
  const dw = 70, dh = 70;

  ctx.save();
  if (agent.dir < 0) {
    ctx.translate(agent.x, agent.y);
    ctx.scale(-1, 1);
    ctx.drawImage(sheet, sx, sy, fw, fh, -dw/2, -dh+8, dw, dh);
  } else {
    ctx.drawImage(sheet, sx, sy, fw, fh, agent.x-dw/2, agent.y-dh+8, dw, dh);
  }
  ctx.restore();

  if (Date.now() < agent.bubbleUntil && agent.bubble) drawBubble(agent.x, agent.y-44, agent.bubble);
}

function drawBubble(x,y,text){
  if (assets.bubbles.complete) {
    const bw = 180, bh = 58;
    // use first rectangular bubble cell as background from uploaded sheet
    ctx.drawImage(assets.bubbles, 0, 0, 200, 80, x-bw/2, y-bh, bw, bh);
    ctx.fillStyle='#111827';
    ctx.font='12px sans-serif';
    const m = ctx.measureText(text).width;
    ctx.fillStyle='#111827';
    ctx.fillText(text, x-m/2, y-22);
  } else {
    ctx.fillStyle='#111827';
    ctx.fillRect(x-60,y-36,120,24);
    ctx.fillStyle='#e5e7eb';
    ctx.fillText(text,x-50,y-20);
  }
}

function updateAgents(){
  agents.forEach(a => {
    const dx = a.tx - a.x, dy = a.ty - a.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1.2) {
      a.x += dx * 0.075;
      a.y += dy * 0.075;
      a.state = 'walk';
      a.dir = dx < 0 ? -1 : 1;
    } else if (a.state === 'walk') {
      a.state = 'type';
      a.bubble = 'WORK';
      a.bubbleUntil = Date.now() + 1000;
    }
  });
}

function fitCanvas(){
  const rect = wrap.getBoundingClientRect();
  const maxW = Math.max(320, rect.width - 20);
  const scale = Math.min(maxW / WORLD_W, 1);
  canvas.style.width = `${Math.floor(WORLD_W * scale)}px`;
  canvas.style.height = `${Math.floor(WORLD_H * scale)}px`;
}

async function pollEvents(){
  try {
    const r = await fetch('./events.json?_=' + Date.now());
    if(!r.ok) return;
    const d = await r.json();
    (d.events||[]).forEach(e => {
      if ((e.ts||0) <= eventCursor) return;
      eventCursor = Math.max(eventCursor, e.ts||0);
      const a = agents.find(x => x.name.toLowerCase() === String(e.agent||'').toLowerCase()) || agents[0];
      if(!a) return;
      if(e.status) a.state = e.status;
      if(e.deskId){ selectedAgent = a.id; assignDesk(e.deskId); }
      if(e.msg){ a.bubble = e.msg.slice(0,16); a.bubbleUntil = Date.now()+1600; log(`${a.name}: ${e.msg}`); }
    });
    renderPanels();
  } catch {}
}

function loop(){
  frameTick++;
  ctx.clearRect(0,0,WORLD_W,WORLD_H);
  drawBackground();
  drawDesks();
  updateAgents();
  agents.forEach(drawAgent);
  requestAnimationFrame(loop);
}

function waitImage(i){
  return new Promise(res => { if(i.complete) return res(); i.onload=i.onerror=()=>res(); });
}

async function init(){
  await Promise.all(Object.values(assets).map(waitImage));
  renderPanels();
  fitCanvas();
  log('PixelOps upgraded with latest uploaded assets');
  requestAnimationFrame(loop);
  setInterval(pollEvents, 3000);
}

window.addEventListener('resize', fitCanvas);
init();
