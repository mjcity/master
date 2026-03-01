const canvas = document.getElementById('office');
const ctx = canvas.getContext('2d');
const wrap = document.getElementById('floorWrap');
const TILE = 32;
const WORLD = { w: 30 * TILE, h: 20 * TILE };

const images = {
  male: loadImg('./assets/imported/char_male.jpg'),
  gray: loadImg('./assets/imported/char_gray.jpg'),
  female: loadImg('./assets/imported/char_female.jpg'),
  red: loadImg('./assets/imported/char_red.jpg'),
  office: loadImg('./assets/imported/office_items.jpg')
};

const desks = [
  { id:'d1', name:'Artist Dashboard', x:180, y:180 },
  { id:'d2', name:'Goal Tracker', x:420, y:180 },
  { id:'d3', name:'TechMyMoney', x:660, y:180 },
  { id:'d4', name:'Automation', x:300, y:430 },
  { id:'d5', name:'Media Ops', x:560, y:430 }
];

const stateOrder = ['idle','walk','type','read','done'];
const agents = [
  mkAgent('Nova','Frontend','male',120,520),
  mkAgent('Byte','Automation','gray',180,520),
  mkAgent('Pulse','QA','female',240,520),
  mkAgent('Echo','Research','red',300,520)
];

let selectedAgent = null;
let ready = false;

function loadImg(src){
  const img = new Image();
  img.src = src;
  return img;
}

function mkAgent(name, role, sheet, x, y){
  return { id: randId(), name, role, sheet, x, y, tx:x, ty:y, state:'idle', bubble:'', bubbleUntil:0, dir:'right' };
}

function randId(){ return Math.random().toString(36).slice(2, 10); }

function log(msg){
  const feed = document.getElementById('feed');
  const li = document.createElement('li');
  li.textContent = `${new Date().toLocaleTimeString()} • ${msg}`;
  feed.prepend(li);
  while(feed.children.length > 40) feed.removeChild(feed.lastChild);
}

function renderPanels(){
  const desksEl = document.getElementById('desks');
  desksEl.innerHTML = '';
  desks.forEach(d => {
    const el = document.createElement('div');
    el.className = 'desk';
    el.innerHTML = `<strong>${d.name}</strong>`;
    el.onclick = () => assignDesk(d.id);
    desksEl.appendChild(el);
  });

  const agentsEl = document.getElementById('agents');
  agentsEl.innerHTML = '';
  agents.forEach(a => {
    const el = document.createElement('div');
    el.className = 'agent';
    el.innerHTML = `<div><strong>${a.name}</strong><br><small>${a.role}</small></div><span class="chip ${a.state}">${a.state}</span>`;
    el.onclick = () => { selectedAgent = a.id; renderPanels(); log(`${a.name} selected`); };
    el.ondblclick = () => cycleState(a.id);
    if(selectedAgent === a.id) el.style.outline = '1px solid #6ee7ff';
    agentsEl.appendChild(el);
  });
}

function assignDesk(did){
  if(!selectedAgent) return log('Select an agent first.');
  const a = agents.find(x => x.id === selectedAgent);
  const d = desks.find(x => x.id === did);
  if(!a || !d) return;
  a.tx = d.x; a.ty = d.y + 24; a.state = 'walk'; a.bubble = `To ${d.name}`; a.bubbleUntil = Date.now()+1800;
  log(`${a.name} assigned to ${d.name}`);
  renderPanels();
}

function cycleState(id){
  const a = agents.find(x => x.id === id); if(!a) return;
  a.state = stateOrder[(stateOrder.indexOf(a.state)+1)%stateOrder.length];
  a.bubble = a.state.toUpperCase(); a.bubbleUntil = Date.now()+1500;
  renderPanels();
}

function frameRect(sheetName, state, t){
  // Assumes 6x3 atlas style from uploaded references
  const img = images[sheetName];
  const cols = 6, rows = 3;
  const fw = img.naturalWidth / cols;
  const fh = img.naturalHeight / rows;

  let row = 0;
  if (state === 'walk') row = 1;
  else if (state === 'type' || state === 'read' || state === 'done') row = 2;

  let col = 0;
  if (state === 'idle') col = 0;
  else if (state === 'walk') col = 1 + (Math.floor(t/140)%4);
  else if (state === 'type') col = 0 + (Math.floor(t/180)%2);
  else if (state === 'read') col = 2 + (Math.floor(t/220)%2);
  else if (state === 'done') col = 5;

  return { sx: col*fw, sy: row*fh, sw: fw, sh: fh };
}

function drawOfficeBackground(){
  // base zones
  ctx.fillStyle = '#805030'; ctx.fillRect(0,0,WORLD.w,WORLD.h);
  ctx.fillStyle = '#d7d7db'; ctx.fillRect(22*TILE,0,8*TILE,10*TILE);
  ctx.fillStyle = '#2e4660'; ctx.fillRect(14*TILE,10*TILE,16*TILE,10*TILE);

  // use uploaded office items sheet as décor strip + sampled items
  const office = images.office;
  if (office.complete) {
    const iw = office.naturalWidth, ih = office.naturalHeight;
    // top furniture strip
    ctx.drawImage(office, 0, 0, iw, Math.floor(ih*0.55), 32, 32, WORLD.w-64, 180);
    // extra icons sampled from lower row
    ctx.drawImage(office, Math.floor(iw*0.62), Math.floor(ih*0.60), Math.floor(iw*0.3), Math.floor(ih*0.35), 70, 300, 320, 180);
    ctx.drawImage(office, Math.floor(iw*0.20), Math.floor(ih*0.55), Math.floor(iw*0.18), Math.floor(ih*0.3), 700, 320, 180, 160);
  }

  // wall borders
  ctx.fillStyle = '#101020';
  ctx.fillRect(0,0,WORLD.w,8); ctx.fillRect(0,0,8,WORLD.h); ctx.fillRect(WORLD.w-8,0,8,WORLD.h); ctx.fillRect(0,WORLD.h-8,WORLD.w,8);
}

function drawDesks(){
  ctx.font = '12px sans-serif';
  desks.forEach(d => {
    ctx.fillStyle = '#704010'; ctx.fillRect(d.x-28,d.y-16,56,26);
    ctx.fillStyle = '#9ca3af'; ctx.fillRect(d.x-10,d.y-24,20,8);
    ctx.fillStyle = '#dbeafe'; ctx.fillText(d.name, d.x-44, d.y+34);
  });
}

function updateAgents(dt){
  agents.forEach(a => {
    const dx = a.tx - a.x, dy = a.ty - a.y;
    const dist = Math.hypot(dx,dy);
    if (dist > 1.5) {
      const step = Math.min(2.8, dist*0.08);
      a.x += (dx/dist)*step;
      a.y += (dy/dist)*step;
      if(a.state !== 'walk') a.state = 'walk';
      a.dir = dx < 0 ? 'left' : 'right';
    } else if (a.state === 'walk') {
      a.state = 'type';
      a.bubble = 'WORK'; a.bubbleUntil = Date.now()+1400;
    }
  });
}

function drawAgents(t){
  agents.forEach(a => {
    const img = images[a.sheet];
    if (!img.complete) return;
    const f = frameRect(a.sheet, a.state, t);
    const dw = 54, dh = 54;

    ctx.save();
    if (a.dir === 'left') {
      ctx.translate(a.x, a.y);
      ctx.scale(-1,1);
      ctx.drawImage(img, f.sx,f.sy,f.sw,f.sh, -dw/2, -dh+8, dw, dh);
    } else {
      ctx.drawImage(img, f.sx,f.sy,f.sw,f.sh, a.x-dw/2, a.y-dh+8, dw, dh);
    }
    ctx.restore();

    if (Date.now() < a.bubbleUntil && a.bubble) {
      drawBubble(a.x, a.y-48, a.bubble);
    }
  });
}

function drawBubble(x,y,text){
  const pad=6;
  ctx.font = '12px sans-serif';
  const w = ctx.measureText(text).width + pad*2;
  const h = 22;
  ctx.fillStyle = '#111827'; ctx.strokeStyle='#334155';
  ctx.beginPath();
  roundRect(ctx, x-w/2, y-h, w, h, 7);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle='#e5e7eb'; ctx.fillText(text, x-w/2+pad, y-7);
}

function roundRect(ctx,x,y,w,h,r){
  ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}

function fitCanvas(){
  const rect = wrap.getBoundingClientRect();
  const maxW = Math.max(320, rect.width - 24);
  const scale = Math.min(maxW / WORLD.w, 1);
  canvas.style.width = `${Math.floor(WORLD.w * scale)}px`;
  canvas.style.height = `${Math.floor(WORLD.h * scale)}px`;
}

function loop(t){
  ctx.clearRect(0,0,WORLD.w,WORLD.h);
  drawOfficeBackground();
  drawDesks();
  updateAgents(16);
  drawAgents(t);
  requestAnimationFrame(loop);
}

async function pollEvents(){
  try {
    const r = await fetch('./events.json?_=' + Date.now());
    if(!r.ok) return;
    const d = await r.json();
    (d.events||[]).forEach(e => {
      if ((e.ts||0) <= (window.__lastEv||0)) return;
      window.__lastEv = Math.max(window.__lastEv||0, e.ts||0);
      const a = agents.find(x => x.name.toLowerCase() === String(e.agent||'').toLowerCase()) || agents[0];
      if(!a) return;
      if (e.status) a.state = e.status;
      if (e.deskId) { selectedAgent = a.id; assignDesk(e.deskId); }
      if (e.msg) { a.bubble = e.msg.slice(0, 16); a.bubbleUntil = Date.now()+1800; log(`${a.name}: ${e.msg}`); }
    });
    renderPanels();
  } catch {}
}

function init(){
  renderPanels();
  fitCanvas();
  requestAnimationFrame(loop);
  setInterval(pollEvents, 3500);
  log('PixelOps rebuilt with uploaded assets');
}

window.addEventListener('resize', fitCanvas);
Promise.all(Object.values(images).map(img => new Promise(res => { if (img.complete) res(); else img.onload = img.onerror = () => res(); }))).then(init);
