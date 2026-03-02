const BUILD = '33';
const canvas = document.getElementById('office');
const ctx = canvas.getContext('2d');
const wrap = document.getElementById('floorWrap');
const TILE = 32;

const assets = {
  tiles: img(`./assets/tiles/office_tiles_32.png?v=${BUILD}`),
  nova: img(`./assets/characters/nova.png?v=${BUILD}`),
  byte: img(`./assets/characters/byte.png?v=${BUILD}`),
  pulse: img(`./assets/characters/pulse.png?v=${BUILD}`),
  stack: img(`./assets/characters/stack.png?v=${BUILD}`)
};

let mapData = null;
let worldW = 960;
let worldH = 640;
let selectedAgent = null;
let eventCursor = 0;
let tick = 0;

const stateOrder = ['idle','walk','type','read','done'];
const frames = {
  idle:[0,3], walk:[4,11], type:[12,15], read:[16,19], done:[20,23]
};

const desks = [
  { id:'d1', name:'Artist Dashboard', tx:6, ty:5 },
  { id:'d2', name:'Goal Tracker', tx:14, ty:5 },
  { id:'d3', name:'TechMyMoney', tx:22, ty:5 },
  { id:'d4', name:'Automation', tx:10, ty:13 },
  { id:'d5', name:'Media Ops', tx:19, ty:13 }
];

const agents = [
  mkAgent('Nova','Frontend','nova',3,15),
  mkAgent('Byte','Automation','byte',5,15),
  mkAgent('Pulse','QA','pulse',7,15),
  mkAgent('Stack','Research','stack',9,15)
];

function img(src){ const i = new Image(); i.src = src; return i; }
function mkAgent(name, role, skin, tx, ty){ return { id: randId(), name, role, skin, tx, ty, x:tx, y:ty, target:null, state:'idle', dir:1, bubble:'', bubbleUntil:0 }; }
function randId(){ return Math.random().toString(36).slice(2,10); }

function log(msg){
  const feed = document.getElementById('feed');
  const li = document.createElement('li');
  li.textContent = `${new Date().toLocaleTimeString()} • ${msg}`;
  feed.prepend(li);
  while(feed.children.length > 40) feed.removeChild(feed.lastChild);
}

function getLayer(name){ return (mapData?.layers || []).find(l => l.type==='tilelayer' && l.name===name); }
function tileAt(layer, tx, ty){ if(!layer) return 0; if(tx<0||ty<0||tx>=layer.width||ty>=layer.height) return 0; return layer.data[ty*layer.width+tx] || 0; }
function blocked(tx,ty){ const c=getLayer('Collision'); return tileAt(c,tx,ty)>0; }

function drawLayer(name){
  const layer=getLayer(name); if(!layer) return;
  const cols=8;
  for(let y=0;y<layer.height;y++){
    for(let x=0;x<layer.width;x++){
      const gid=tileAt(layer,x,y); if(!gid) continue;
      const id=gid-1;
      const sx=(id%cols)*TILE, sy=Math.floor(id/cols)*TILE;
      ctx.drawImage(assets.tiles,sx,sy,TILE,TILE,x*TILE,y*TILE,TILE,TILE);
    }
  }
}

function frameFor(a){
  const [s,e]=frames[a.state] || frames.idle;
  const count=e-s+1;
  return s + (count>1 ? (Math.floor(tick/10)%count) : 0);
}

function drawAgent(a){
  const im=assets[a.skin]; if(!im.complete) return;
  const f=frameFor(a);
  const sx=f*32, sy=0;
  const px=a.x*TILE+TILE/2, py=a.y*TILE+TILE/2;
  const dw=64, dh=64;
  ctx.save();
  if(a.dir<0){
    ctx.translate(px,py); ctx.scale(-1,1);
    ctx.drawImage(im,sx,sy,32,32,-dw/2,-dh+8,dw,dh);
  } else {
    ctx.drawImage(im,sx,sy,32,32,px-dw/2,py-dh+8,dw,dh);
  }
  ctx.restore();
  if(Date.now()<a.bubbleUntil && a.bubble) drawBubble(px,py-40,a.bubble);
}

function drawBubble(x,y,text){
  ctx.font='12px sans-serif';
  const w=ctx.measureText(text).width+12;
  const h=22;
  const bx=x-w/2, by=y-h;
  ctx.fillStyle='#111827'; ctx.strokeStyle='#334155'; ctx.lineWidth=1;
  roundRect(bx,by,w,h,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#e5e7eb'; ctx.fillText(text,bx+6,by+14);
}
function roundRect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

function updateAgents(){
  agents.forEach(a=>{
    if(!a.target) return;
    const dx=a.target.tx-a.x, dy=a.target.ty-a.y;
    const d=Math.hypot(dx,dy);
    if(d<0.05){
      a.x=a.target.tx; a.y=a.target.ty; a.target=null;
      if(a.state==='walk'){ a.state='type'; say(a,'WORK',1000); }
      return;
    }
    a.x += dx*0.08; a.y += dy*0.08;
    a.state='walk'; a.dir = dx<0?-1:1;
  });
}

function say(a,text,ms=1300){ a.bubble=text; a.bubbleUntil=Date.now()+ms; }

function renderPanels(){
  const d=document.getElementById('desks'); d.innerHTML='';
  desks.forEach(x=>{ const el=document.createElement('div'); el.className='desk'; el.innerHTML=`<strong>${x.name}</strong>`; el.onclick=()=>assignDesk(x.id); d.appendChild(el); });
  const a=document.getElementById('agents'); a.innerHTML='';
  agents.forEach(x=>{
    const el=document.createElement('div'); el.className='agent';
    el.innerHTML=`<div><strong>${x.name}</strong><br><small>${x.role}</small></div><span class="chip ${x.state}">${x.state}</span>`;
    el.onclick=()=>{ selectedAgent=x.id; renderPanels(); log(`${x.name} selected`); };
    el.ondblclick=()=>cycleState(x.id);
    if(selectedAgent===x.id) el.style.outline='1px solid #6ee7ff';
    a.appendChild(el);
  });
}

function assignDesk(id){
  if(!selectedAgent) return log('Select an agent first.');
  const a=agents.find(x=>x.id===selectedAgent), d=desks.find(x=>x.id===id); if(!a||!d) return;
  if(blocked(d.tx,d.ty)) return log(`${d.name} blocked by collision`);
  a.target={tx:d.tx,ty:d.ty}; a.state='walk'; say(a,`To ${d.name}`,1500); renderPanels(); log(`${a.name} assigned to ${d.name}`);
}

function cycleState(id){ const a=agents.find(x=>x.id===id); if(!a) return; a.state=stateOrder[(stateOrder.indexOf(a.state)+1)%stateOrder.length]; say(a,a.state.toUpperCase(),900); renderPanels(); }

function fit(){
  const rect=wrap.getBoundingClientRect();
  const maxW=Math.max(320, rect.width-20);
  const scale=Math.min(maxW/worldW,1);
  canvas.style.width=`${Math.floor(worldW*scale)}px`;
  canvas.style.height=`${Math.floor(worldH*scale)}px`;
}

function draw(){
  tick++;
  ctx.clearRect(0,0,worldW,worldH);
  drawLayer('Ground');
  drawLayer('Walls');
  drawLayer('Objects');
  updateAgents();
  agents.forEach(drawAgent);
  requestAnimationFrame(draw);
}

async function pollEvents(){
  try{
    const r=await fetch('./events.json?_='+Date.now()); if(!r.ok) return;
    const d=await r.json();
    (d.events||[]).forEach(e=>{
      if((e.ts||0)<=eventCursor) return;
      eventCursor=Math.max(eventCursor,e.ts||0);
      const a=agents.find(x=>x.name.toLowerCase()===String(e.agent||'').toLowerCase()) || agents[0];
      if(!a) return;
      if(e.status) a.state=e.status;
      if(e.deskId){ selectedAgent=a.id; assignDesk(e.deskId); }
      if(e.msg){ say(a,e.msg.slice(0,16),1500); log(`${a.name}: ${e.msg}`); }
    });
    renderPanels();
  }catch{}
}

async function loadMap(){
  const r=await fetch(`./assets/maps/office_map.json?v=${BUILD}`,{cache:'no-store'});
  mapData=await r.json();
  worldW=mapData.width*TILE; worldH=mapData.height*TILE;
  canvas.width=worldW; canvas.height=worldH;
}

function wait(i){ return new Promise(res=>{ if(i.complete) return res(); i.onload=i.onerror=()=>res(); }); }

async function init(){
  await Promise.all([loadMap(), ...Object.values(assets).map(wait)]);
  renderPanels();
  fit();
  log('PixelOps v33 visual fix loaded');
  requestAnimationFrame(draw);
  setInterval(pollEvents,3000);
}

window.addEventListener('resize', fit);
init();