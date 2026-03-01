/* PixelOps V4 - Phaser edition */
const desks = [
  { id:'d1', name:'Artist Dashboard', dir:'/artist-dashboard', x:170, y:160 },
  { id:'d2', name:'Goal Tracker', dir:'/mjcitytracker', x:390, y:160 },
  { id:'d3', name:'TechMyMoney', dir:'/techmymoney', x:610, y:160 },
  { id:'d4', name:'Automation', dir:'/scripts', x:260, y:360 },
  { id:'d5', name:'Media Ops', dir:'/content', x:540, y:360 }
];

const statusCycle = ['idle','walk','type','read','done'];
const skins = [0x2f80ed,0x111827,0xef4444,0xf97316,0xd1d5db,0xf8fafc];

let selectedAgent = null;
let lastEventTs = 0;
const agents = [
  mkAgent('Nova','Frontend',skins[0]),
  mkAgent('Byte','Automation',skins[1]),
  mkAgent('Pulse','QA',skins[2]),
  mkAgent('Echo','Research',skins[3])
];

function mkAgent(name, role, color){
  return { id: crypto.randomUUID().slice(0,8), name, role, color, status:'idle', x:90+Math.random()*80, y:470, targetDesk:null, bubble:'', bubbleUntil:0, sprite:null, bubbleText:null };
}

function log(msg){
  const feed=document.getElementById('feed');
  const li=document.createElement('li');
  li.textContent=`${new Date().toLocaleTimeString()} • ${msg}`;
  feed.prepend(li);
  while(feed.children.length>35) feed.removeChild(feed.lastChild);
}

function renderPanels(){
  const dRoot = document.getElementById('desks');
  dRoot.innerHTML='';
  desks.forEach(d=>{
    const el=document.createElement('div');
    el.className='desk';
    el.innerHTML=`<strong>${d.name}</strong><br><small>${d.dir}</small>`;
    el.onclick=()=>assignToDesk(d.id);
    el.ondragover=(e)=>{e.preventDefault(); el.classList.add('drop');};
    el.ondragleave=()=>el.classList.remove('drop');
    el.ondrop=(e)=>{e.preventDefault(); el.classList.remove('drop'); const aid=e.dataTransfer.getData('text/agent-id'); if(aid){selectedAgent=aid; assignToDesk(d.id);} };
    dRoot.appendChild(el);
  });

  const aRoot = document.getElementById('agents');
  aRoot.innerHTML='';
  agents.forEach(a=>{
    const el=document.createElement('div');
    el.className='agent';
    el.draggable=true;
    el.innerHTML=`<div><strong>${a.name}</strong><br><small>${a.role}</small></div><span class="chip ${a.status}">${a.status}</span>`;
    el.onclick=()=>{selectedAgent=a.id; renderPanels(); log(`${a.name} selected`);};
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
  a.status='walk';
  speak(a, `To ${d.name}`);
  log(`${a.name} assigned to ${d.name}`);
  renderPanels();
}

function cycleStatus(agentId){
  const a=agents.find(x=>x.id===agentId); if(!a) return;
  a.status = statusCycle[(statusCycle.indexOf(a.status)+1)%statusCycle.length];
  speak(a, a.status.toUpperCase());
  renderPanels();
  log(`${a.name} → ${a.status}`);
}

function speak(a, text){
  a.bubble=text; a.bubbleUntil=Date.now()+2000;
  if(a.bubbleText){ a.bubbleText.setText(text).setVisible(true); }
}

class OfficeScene extends Phaser.Scene {
  constructor(){ super('office'); }
  preload(){}
  create(){
    this.drawBackground();
    this.drawDesks();
    this.spawnAgents();
    this.time.addEvent({ delay: 100, loop: true, callback: ()=>this.tick() });
  }

  drawBackground(){
    const g = this.add.graphics();
    g.fillStyle(0x8a6133,1).fillRect(0,0,900,520);
    g.fillStyle(0xd7d7db,1).fillRect(430,0,470,250);
    g.fillStyle(0x5a7a9f,1).fillRect(350,260,550,260);
    g.fillStyle(0x1f2937,1);
    g.fillRect(0,0,900,10); g.fillRect(0,0,10,520); g.fillRect(890,0,10,520); g.fillRect(0,510,900,10);
    g.fillRect(420,0,10,220); g.fillRect(340,250,560,10);
  }

  drawDesks(){
    const g=this.add.graphics();
    desks.forEach(d=>{
      g.fillStyle(0x4b2d16,1).fillRect(d.x-32,d.y-18,64,28);
      g.fillStyle(0x2f2f2f,1).fillRect(d.x-12,d.y-26,24,10);
      g.fillStyle(0x9ca3af,1).fillRect(d.x-8,d.y-22,16,6);
      this.add.text(d.x-42,d.y+22,d.name,{font:'11px Arial',color:'#cbd5e1'});
    });
  }

  spawnAgents(){
    agents.forEach(a=>{
      const container=this.add.container(a.x,a.y);
      const body=this.add.rectangle(0,0,14,18,a.color).setOrigin(0.5,1);
      const head=this.add.rectangle(0,-18,10,8,0xf2c6a0).setOrigin(0.5,1);
      const hair=this.add.rectangle(0,-22,12,4,0x222222).setOrigin(0.5,1);
      const fx=this.add.rectangle(12,-8,8,3,0x00e5ff).setOrigin(0.5,1).setVisible(false);
      container.add([body,head,hair,fx]);
      a.sprite=container;
      a.fx=fx;
      a.bubbleText=this.add.text(a.x,a.y-30,'',{font:'11px Arial',backgroundColor:'#111827',color:'#e5e7eb',padding:{x:5,y:2}}).setOrigin(0.5,1).setVisible(false);
    });
  }

  tick(){
    agents.forEach(a=>{
      if(a.targetDesk){
        const d=desks.find(x=>x.id===a.targetDesk);
        if(d){
          const tx=d.x, ty=d.y+12;
          const dx=tx-a.sprite.x, dy=ty-a.sprite.y;
          const dist=Math.hypot(dx,dy);
          if(dist>2){
            a.sprite.x += dx*0.08; a.sprite.y += dy*0.08; a.status='walk';
          } else if(a.status==='walk') a.status='type';
        }
      }
      a.fx.setVisible(a.status==='type' || a.status==='read' || a.status==='done');
      if(a.status==='read') a.fx.fillColor=0xFBBF24;
      else if(a.status==='done') a.fx.fillColor=0x34D399;
      else a.fx.fillColor=0x00E5FF;

      if(a.bubbleText){
        a.bubbleText.setPosition(a.sprite.x,a.sprite.y-30);
        if(Date.now()>a.bubbleUntil) a.bubbleText.setVisible(false);
      }
    });
  }
}

function bootPhaser(){
  const canvas = document.getElementById('office');
  const parent = canvas.parentElement;
  canvas.style.display='none';
  const holder = document.createElement('div');
  holder.id='phaser-holder';
  parent.insertBefore(holder, canvas);

  new Phaser.Game({
    type: Phaser.CANVAS,
    width: 900,
    height: 520,
    parent: 'phaser-holder',
    pixelArt: true,
    backgroundColor: '#08090d',
    scene: [OfficeScene]
  });
}

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
      if(e.deskId){ selectedAgent=a.id; assignToDesk(e.deskId); }
      if(e.msg){ speak(a, e.msg.slice(0,22)); log(`${a.name}: ${e.msg}`); }
    });
    renderPanels();
  } catch {}
}

function init(){
  const script=document.createElement('script');
  script.src='https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js';
  script.onload=()=>{ bootPhaser(); };
  document.body.appendChild(script);

  document.getElementById('addAgent').onclick=()=>{
    const name=prompt('Agent name?','Agent '+(agents.length+1)); if(!name) return;
    const role=prompt('Role?','Generalist')||'Generalist';
    const a=mkAgent(name,role,skins[agents.length%skins.length]);
    agents.push(a); renderPanels(); log(`${a.name} spawned`);
  };

  renderPanels();
  log('PixelOps v4 Phaser loaded');
  setInterval(pollEvents, 4000);
}

init();