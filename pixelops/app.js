const desks = [
  { id:'d1', name:'Artist Dashboard', dir:'/artist-dashboard', x:120, y:120 },
  { id:'d2', name:'Goal Tracker', dir:'/mjcitytracker', x:360, y:120 },
  { id:'d3', name:'TechMyMoney', dir:'/techmymoney', x:600, y:120 },
  { id:'d4', name:'Automation', dir:'/scripts', x:240, y:330 },
  { id:'d5', name:'Media Ops', dir:'/content', x:520, y:330 }
];

const statusCycle = ['idle','walk','type','read','done'];
let agents = [
  mkAgent('Nova','Frontend','#00E5FF'),
  mkAgent('Byte','Automation','#A855F7'),
  mkAgent('Pulse','QA','#34D399')
];
let selectedAgent = null;

const cv = document.getElementById('office');
const ctx = cv.getContext('2d');

function mkAgent(name, role, color){
  return { id: crypto.randomUUID().slice(0,8), name, role, color, status:'idle', x:60+Math.random()*80, y:460, targetDesk:null };
}

function renderPanels(){
  const dRoot = document.getElementById('desks');
  dRoot.innerHTML='';
  desks.forEach(d=>{
    const el=document.createElement('div'); el.className='desk';
    el.innerHTML=`<strong>${d.name}</strong><br><small>${d.dir}</small>`;
    el.onclick=()=>assignToDesk(d.id);
    dRoot.appendChild(el);
  });

  const aRoot = document.getElementById('agents');
  aRoot.innerHTML='';
  agents.forEach(a=>{
    const el=document.createElement('div'); el.className='agent';
    el.innerHTML=`<div><strong>${a.name}</strong><br><small>${a.role}</small></div><span class="chip ${a.status}">${a.status}</span>`;
    el.onclick=()=>{selectedAgent=a.id; log(`${a.name} selected`);};
    el.ondblclick=()=>cycleStatus(a.id);
    if(selectedAgent===a.id) el.style.outline='1px solid #00E5FF';
    aRoot.appendChild(el);
  });
}

function assignToDesk(deskId){
  if(!selectedAgent) return log('Select an agent first.');
  const a = agents.find(x=>x.id===selectedAgent);
  const d = desks.find(x=>x.id===deskId);
  if(!a||!d) return;
  a.targetDesk=deskId;
  a.status='walk';
  log(`${a.name} assigned to ${d.name}`);
  renderPanels();
}

function cycleStatus(agentId){
  const a=agents.find(x=>x.id===agentId); if(!a) return;
  a.status = statusCycle[(statusCycle.indexOf(a.status)+1)%statusCycle.length];
  log(`${a.name} → ${a.status}`);
  renderPanels();
}

function draw(){
  ctx.clearRect(0,0,cv.width,cv.height);
  drawGrid();
  desks.forEach(drawDesk);
  agents.forEach(updateAndDrawAgent);
  requestAnimationFrame(draw);
}

function drawGrid(){
  ctx.fillStyle='#08090d'; ctx.fillRect(0,0,cv.width,cv.height);
  ctx.strokeStyle='rgba(56,189,248,.08)';
  for(let x=0;x<cv.width;x+=24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,cv.height);ctx.stroke();}
  for(let y=0;y<cv.height;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(cv.width,y);ctx.stroke();}
}

function drawDesk(d){
  ctx.fillStyle='#111827'; ctx.fillRect(d.x-42,d.y-26,84,52);
  ctx.strokeStyle='#334155'; ctx.strokeRect(d.x-42,d.y-26,84,52);
  ctx.fillStyle='#00E5FF'; ctx.fillRect(d.x-10,d.y-18,20,8);
  ctx.fillStyle='#94a3b8'; ctx.font='11px sans-serif';
  ctx.fillText(d.name, d.x-38, d.y+40);
}

function updateAndDrawAgent(a){
  if(a.targetDesk){
    const d=desks.find(x=>x.id===a.targetDesk);
    const tx=d.x, ty=d.y+16;
    a.x += (tx-a.x)*0.06;
    a.y += (ty-a.y)*0.06;
    if(Math.hypot(tx-a.x,ty-a.y)<2){
      if(a.status==='walk') a.status='type';
    }
  }
  drawAgent(a);
}

function drawAgent(a){
  const bodyW=14, bodyH=18;
  ctx.fillStyle=a.color; ctx.fillRect(a.x-bodyW/2,a.y-bodyH,bodyW,bodyH);
  ctx.fillStyle='#f8fafc'; ctx.fillRect(a.x-4,a.y-bodyH-8,8,8);
  if(a.status==='type'){ctx.fillStyle='#22d3ee';ctx.fillRect(a.x+10,a.y-10,8,3);} 
  if(a.status==='read'){ctx.fillStyle='#fbbf24';ctx.fillRect(a.x+10,a.y-16,7,10);} 
  if(a.status==='done'){ctx.fillStyle='#34d399';ctx.fillRect(a.x+10,a.y-16,7,7);} 
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
  const palette=['#00E5FF','#A855F7','#34D399','#FF2DAA','#FBBF24'];
  const color=palette[agents.length%palette.length];
  const a=mkAgent(name,role,color);
  agents.push(a); log(`${a.name} spawned`); renderPanels();
};

setInterval(()=>{
  const a=agents[Math.floor(Math.random()*agents.length)];
  if(!a) return;
  if(!a.targetDesk) return;
  const next = a.status==='type' ? 'read' : a.status==='read' ? 'done' : 'type';
  a.status=next; renderPanels(); log(`${a.name} is ${next} at ${(desks.find(d=>d.id===a.targetDesk)||{}).name||'desk'}`);
},7000);

renderPanels();
draw();
