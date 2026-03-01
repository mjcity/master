const TILE = 24;
const desks = [
  { id:'d1', name:'Artist Dashboard', dir:'/artist-dashboard', x:6, y:6 },
  { id:'d2', name:'Goal Tracker', dir:'/mjcitytracker', x:14, y:6 },
  { id:'d3', name:'TechMyMoney', dir:'/techmymoney', x:22, y:6 },
  { id:'d4', name:'Automation', dir:'/scripts', x:9, y:14 },
  { id:'d5', name:'Media Ops', dir:'/content', x:19, y:14 }
];

const statusCycle = ['idle','walk','type','read','done'];
const skins = [
  { skin:'#f2c6a0', hair:'#3b2f2f', shirt:'#2f80ed' },
  { skin:'#f0be98', hair:'#d39c57', shirt:'#111827' },
  { skin:'#8a5a44', hair:'#111827', shirt:'#ef4444' },
  { skin:'#f2c6a0', hair:'#0f172a', shirt:'#f97316' },
  { skin:'#7a4c37', hair:'#e5e7eb', shirt:'#d1d5db' },
  { skin:'#f5cda9', hair:'#5b3b22', shirt:'#f8fafc' },
];

let agents = [
  mkAgent('Nova','Frontend',0),
  mkAgent('Byte','Automation',1),
  mkAgent('Pulse','QA',2),
  mkAgent('Echo','Research',3),
];
let selectedAgent = null;
let lastEventTs = 0;

const cv = document.getElementById('office');
const ctx = cv.getContext('2d');
let tick = 0;

function mkAgent(name, role, skinIdx){
  const s = skins[skinIdx % skins.length];
  return {
    id: crypto.randomUUID().slice(0,8),
    name,
    role,
    status:'idle',
    tx: 2 + Math.random()*4,
    ty: 18 + Math.random()*2,
    x: 2 + Math.random()*4,
    y: 18 + Math.random()*2,
    targetDesk:null,
    bubble:'',
    bubbleUntil:0,
    ...s
  };
}

function renderPanels(){
  const dRoot = document.getElementById('desks');
  dRoot.innerHTML='';
  desks.forEach(d=>{
    const el=document.createElement('div');
    el.className='desk';
    el.dataset.deskId=d.id;
    el.innerHTML=`<strong>${d.name}</strong><br><small>${d.dir}</small>`;
    el.onclick=()=>assignToDesk(d.id);
    el.ondragover=(e)=>{e.preventDefault(); el.classList.add('drop');};
    el.ondragleave=()=>el.classList.remove('drop');
    el.ondrop=(e)=>{
      e.preventDefault(); el.classList.remove('drop');
      const aid=e.dataTransfer.getData('text/agent-id');
      if(aid){ selectedAgent=aid; assignToDesk(d.id); }
    };
    dRoot.appendChild(el);
  });

  const aRoot = document.getElementById('agents');
  aRoot.innerHTML='';
  agents.forEach(a=>{
    const el=document.createElement('div');
    el.className='agent';
    el.draggable=true;
    el.innerHTML=`<div><strong>${a.name}</strong><br><small>${a.role}</small></div><span class="chip ${a.status}">${a.status}</span>`;
    el.onclick=()=>{selectedAgent=a.id; log(`${a.name} selected`); renderPanels();};
    el.ondblclick=()=>cycleStatus(a.id);
    el.ondragstart=(e)=>e.dataTransfer.setData('text/agent-id', a.id);
    if(selectedAgent===a.id) el.style.outline='1px solid #00E5FF';
    aRoot.appendChild(el);
  });
}

function assignToDesk(deskId){
  if(!selectedAgent) return log('Select an agent first.');
  const a = agents.find(x=>x.id===selectedAgent);
  const d = desks.find(x=>x.id===deskId);
  if(!a || !d) return;
  a.targetDesk = deskId;
  a.tx = d.x; a.ty = d.y + 1.8;
  a.status = 'walk';
  speak(a, `To ${d.name}`);
  log(`${a.name} assigned to ${d.name}`);
  renderPanels();
}

function cycleStatus(agentId){
  const a=agents.find(x=>x.id===agentId); if(!a) return;
  a.status = statusCycle[(statusCycle.indexOf(a.status)+1)%statusCycle.length];
  speak(a, a.status.toUpperCase());
  log(`${a.name} → ${a.status}`);
  renderPanels();
}

function speak(agent, text){
  agent.bubble=text;
  agent.bubbleUntil=Date.now()+2200;
}

function draw(){
  tick++;
  ctx.clearRect(0,0,cv.width,cv.height);
  drawTileOffice();
  desks.forEach(drawDeskTile);
  agents.forEach(updateAndDrawAgent);
  requestAnimationFrame(draw);
}

function drawTileOffice(){
  const w = Math.floor(cv.width / TILE), h = Math.floor(cv.height / TILE);
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    const isRoom2 = x>17 && y<8, isRoom3 = x>14 && y>10;
    const base = isRoom2 ? '#d7d7db' : (isRoom3 ? '#5a7a9f' : '#8a6133');
    ctx.fillStyle = base; ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
    ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(x*TILE,y*TILE,1,TILE); ctx.fillRect(x*TILE,y*TILE,TILE,1);
  }
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0,0,cv.width,10); ctx.fillRect(0,0,10,cv.height); ctx.fillRect(cv.width-10,0,10,cv.height); ctx.fillRect(0,cv.height-10,cv.width,10);
  ctx.fillRect(420,0,10,220); ctx.fillRect(340,250,560,10);
  pixelShelf(70,30); pixelShelf(180,30); pixelShelf(290,30); pixelPlant(35,95);
  pixelShelf(565,290); pixelShelf(705,290); pixelPlant(625,290); pixelPlant(785,395);
  pixelMachine(530,35); pixelMachine(590,35);
}
function pixelShelf(x,y){ctx.fillStyle='#6b4f2d';ctx.fillRect(x,y,86,20);ctx.fillStyle='#4b3621';ctx.fillRect(x,y+20,86,4);['#ef4444','#22c55e','#3b82f6','#fbbf24'].forEach((c,i)=>{ctx.fillStyle=c;ctx.fillRect(x+8+i*12,y+6,8,10);});}
function pixelPlant(x,y){ctx.fillStyle='#d1d5db';ctx.fillRect(x,y,14,10);ctx.fillStyle='#16a34a';ctx.fillRect(x+4,y-10,6,10);ctx.fillRect(x+1,y-7,4,7);ctx.fillRect(x+9,y-7,4,7);}
function pixelMachine(x,y){ctx.fillStyle='#9ca3af';ctx.fillRect(x,y,26,38);ctx.fillStyle='#374151';ctx.fillRect(x+5,y+6,16,10);}

function drawDeskTile(d){
  const px=d.x*TILE, py=d.y*TILE;
  ctx.fillStyle='#4b2d16'; ctx.fillRect(px-28,py-16,56,28);
  ctx.fillStyle='#2f2f2f'; ctx.fillRect(px-11,py-24,22,10);
  ctx.fillStyle='#9ca3af'; ctx.fillRect(px-7,py-20,14,6);
  ctx.fillStyle='#cbd5e1'; ctx.font='11px sans-serif'; ctx.fillText(d.name,px-34,py+30);
}

function updateAndDrawAgent(a){
  if(a.targetDesk){
    const dx = a.tx-a.x, dy=a.ty-a.y, dist=Math.hypot(dx,dy);
    if(dist>0.06){ a.x += dx*0.08; a.y += dy*0.08; a.status='walk'; }
    else if(a.status==='walk'){ a.status='type'; }
  }
  drawPixelAgent(a);
  drawBubble(a);
}

function drawPixelAgent(a){
  const px=Math.round(a.x*TILE), py=Math.round(a.y*TILE), frame=Math.floor(tick/14)%2;
  ctx.fillStyle='#1f2937';
  if(a.status==='walk'){ctx.fillRect(px-5,py-2,3,6);ctx.fillRect(px+2,py-1+frame,3,6);} else {ctx.fillRect(px-4,py-1,3,6);ctx.fillRect(px+1,py-1,3,6);}
  ctx.fillStyle=a.shirt; ctx.fillRect(px-6,py-12,12,10);
  ctx.fillStyle=a.skin; ctx.fillRect(px-7,py-10,2,6); ctx.fillRect(px+5,py-10,2,6);
  ctx.fillStyle=a.skin; ctx.fillRect(px-5,py-20,10,8);
  ctx.fillStyle=a.hair; ctx.fillRect(px-6,py-22,12,5);
  if(a.status==='type'){ ctx.fillStyle='#00E5FF'; ctx.fillRect(px+9,py-13,7,3); }
  if(a.status==='read'){ ctx.fillStyle='#FBBF24'; ctx.fillRect(px+10,py-18,7,9); }
  if(a.status==='done'){ ctx.fillStyle='#34D399'; ctx.fillRect(px+9,py-18,7,7); }
}

function drawBubble(a){
  if(!a.bubble || Date.now()>a.bubbleUntil) return;
  const px=Math.round(a.x*TILE), py=Math.round(a.y*TILE)-26;
  ctx.font='11px sans-serif';
  const w=Math.max(40,ctx.measureText(a.bubble).width+14);
  ctx.fillStyle='#111827'; ctx.fillRect(px-w/2,py-18,w,16);
  ctx.strokeStyle='#334155'; ctx.strokeRect(px-w/2,py-18,w,16);
  ctx.fillStyle='#e5e7eb'; ctx.fillText(a.bubble, px-w/2+6, py-6);
}

function log(msg){
  const feed=document.getElementById('feed');
  const li=document.createElement('li');
  li.textContent=`${new Date().toLocaleTimeString()} • ${msg}`;
  feed.prepend(li);
  while(feed.children.length>35) feed.removeChild(feed.lastChild);
}

document.getElementById('addAgent').onclick=()=>{
  const name=prompt('Agent name?','Agent '+(agents.length+1)); if(!name) return;
  const role=prompt('Role?','Generalist')||'Generalist';
  const a=mkAgent(name,role,agents.length);
  agents.push(a); speak(a,'Spawned'); log(`${a.name} spawned`); renderPanels();
};

// Simulated live events feed (drop-in ready for OpenClaw event JSON)
async function pollEvents(){
  try {
    const res = await fetch('./events.json?_=' + Date.now());
    if(!res.ok) return;
    const ev = await res.json();
    (ev.events || []).forEach(e => {
      if((e.ts||0) <= lastEventTs) return;
      lastEventTs = Math.max(lastEventTs, e.ts || 0);
      const a = agents.find(x => x.name.toLowerCase() === String(e.agent||'').toLowerCase()) || agents[0];
      if(!a) return;
      if(e.status) a.status = e.status;
      if(e.deskId){ selectedAgent = a.id; assignToDesk(e.deskId); }
      if(e.msg) { speak(a, e.msg.slice(0, 18)); log(`${a.name}: ${e.msg}`); }
    });
    renderPanels();
  } catch {}
}
setInterval(pollEvents, 4000);

setInterval(()=>{
  const a=agents[Math.floor(Math.random()*agents.length)];
  if(!a || !a.targetDesk) return;
  const next = a.status==='type' ? 'read' : a.status==='read' ? 'done' : 'type';
  a.status=next; speak(a, next.toUpperCase());
  renderPanels();
  log(`${a.name} is ${next} at ${(desks.find(d=>d.id===a.targetDesk)||{}).name||'desk'}`);
}, 7000);

renderPanels();
log('PixelOps v3 loaded');
draw();