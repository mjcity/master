/* PixelOps V5 - Phaser + 90s palette build */
const TILE = 16;
const GRID_W = 36;
const GRID_H = 18;

const P = {
  INK: 0x101020,
  SHADOW: 0x203040,
  WALL: 0x507090,
  CARPET: 0x2e4660,
  TILE_LIGHT: 0xd0c0c0,
  TILE_HI: 0xf0e8e8,
  WOOD_MID: 0x806030,
  WOOD_DARK: 0x704010,
  DESK: 0x805030,
  PAPER: 0xb0a070,
  PLANT: 0x3e7a4a,
  RED: 0xc04838,
};

const desks = [
  { id:'d1', name:'Artist Dashboard', dir:'/artist-dashboard', tx:6, ty:5 },
  { id:'d2', name:'Goal Tracker', dir:'/mjcitytracker', tx:14, ty:5 },
  { id:'d3', name:'TechMyMoney', dir:'/techmymoney', tx:22, ty:5 },
  { id:'d4', name:'Automation', dir:'/scripts', tx:10, ty:13 },
  { id:'d5', name:'Media Ops', dir:'/content', tx:19, ty:13 }
];

const statusCycle = ['idle','walk','type','read','done'];
const styles = [
  { skin:0xf2c6a0, hair:0x2b1f1f, shirt:0x2f80ed },
  { skin:0xeebd98, hair:0xd39c57, shirt:0x111827 },
  { skin:0x8a5a44, hair:0x111827, shirt:0xef4444 },
  { skin:0xf2c6a0, hair:0x0f172a, shirt:0xf97316 },
  { skin:0x7a4c37, hair:0xe5e7eb, shirt:0xd1d5db },
  { skin:0xf5cda9, hair:0x5b3b22, shirt:0xf8fafc },
];

let selectedAgent = null;
let lastEventTs = 0;
let sceneRef = null;

const agents = [
  mkAgent('Nova','Frontend',0),
  mkAgent('Byte','Automation',1),
  mkAgent('Pulse','QA',2),
  mkAgent('Echo','Research',3),
];

function mkAgent(name, role, idx){
  const s = styles[idx % styles.length];
  return {
    id: crypto.randomUUID().slice(0,8),
    name, role,
    status:'idle',
    tx: 2 + Math.random()*4,
    ty: 15 + Math.random()*2,
    x: 2 + Math.random()*4,
    y: 15 + Math.random()*2,
    targetDesk:null,
    bubble:'', bubbleUntil:0,
    sprite:null, fx:null, bubbleText:null,
    ...s
  };
}

function tileToPx(tx, ty){ return { x: tx*TILE + TILE/2, y: ty*TILE + TILE/2 }; }

function log(msg){
  const feed=document.getElementById('feed');
  const li=document.createElement('li');
  li.textContent=`${new Date().toLocaleTimeString()} • ${msg}`;
  feed.prepend(li);
  while(feed.children.length>40) feed.removeChild(feed.lastChild);
}

function renderPanels(){
  const dRoot=document.getElementById('desks'); dRoot.innerHTML='';
  desks.forEach(d=>{
    const el=document.createElement('div');
    el.className='desk';
    el.innerHTML=`<strong>${d.name}</strong><br><small>${d.dir}</small>`;
    el.onclick=()=>assignToDesk(d.id);
    el.ondragover=(e)=>{e.preventDefault(); el.classList.add('drop');};
    el.ondragleave=()=>el.classList.remove('drop');
    el.ondrop=(e)=>{ e.preventDefault(); el.classList.remove('drop'); const aid=e.dataTransfer.getData('text/agent-id'); if(aid){ selectedAgent=aid; assignToDesk(d.id);} };
    dRoot.appendChild(el);
  });

  const aRoot=document.getElementById('agents'); aRoot.innerHTML='';
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
  const a=agents.find(x=>x.id===selectedAgent);
  const d=desks.find(x=>x.id===deskId);
  if(!a || !d) return;
  a.targetDesk=deskId;
  a.tx=d.tx; a.ty=d.ty+1.5;
  a.status='walk';
  speak(a,`To ${d.name}`);
  renderPanels();
  log(`${a.name} assigned to ${d.name}`);
}

function cycleStatus(agentId){
  const a=agents.find(x=>x.id===agentId); if(!a) return;
  a.status=statusCycle[(statusCycle.indexOf(a.status)+1)%statusCycle.length];
  speak(a,a.status.toUpperCase());
  renderPanels();
  log(`${a.name} → ${a.status}`);
}

function speak(a,text){
  a.bubble=text; a.bubbleUntil=Date.now()+2200;
  if(a.bubbleText){ a.bubbleText.setText(text).setVisible(true); }
}

class OfficeScene extends Phaser.Scene {
  constructor(){ super('office'); this.tickCount=0; }
  create(){
    sceneRef=this;
    this.drawMap();
    this.placeDesks();
    this.spawnAgents();
    this.time.addEvent({delay:70,loop:true,callback:()=>this.tick()});
  }

  drawMap(){
    const g=this.add.graphics();
    // ground tiles per zone
    for(let y=0;y<GRID_H;y++){
      for(let x=0;x<GRID_W;x++){
        let c = P.WOOD_MID;
        if(x>=22) c=P.TILE_LIGHT;
        if(x>=14 && y>=10) c=P.CARPET;
        g.fillStyle(c,1).fillRect(x*TILE,y*TILE,TILE,TILE);
        // tiny highlight
        g.fillStyle((x+y)%2===0 ? P.TILE_HI : P.SHADOW, 0.08).fillRect(x*TILE,y*TILE,TILE,1);
      }
    }

    // wall outlines / rooms
    g.fillStyle(P.INK,1);
    g.fillRect(0,0,GRID_W*TILE,8);
    g.fillRect(0,0,8,GRID_H*TILE);
    g.fillRect(GRID_W*TILE-8,0,8,GRID_H*TILE);
    g.fillRect(0,GRID_H*TILE-8,GRID_W*TILE,8);
    g.fillRect(20*TILE,0,8,8*TILE);
    g.fillRect(14*TILE,10*TILE,22*TILE,8);

    // decorative shelves / plants / machines
    const deco = this.add.graphics();
    const shelf=(tx,ty)=>{deco.fillStyle(P.WOOD_DARK,1).fillRect(tx*TILE,ty*TILE,5*TILE,1.2*TILE);deco.fillStyle(P.WOOD_MID,1).fillRect(tx*TILE,(ty+1.2)*TILE,5*TILE,0.2*TILE);};
    const plant=(tx,ty)=>{deco.fillStyle(0xd1d5db,1).fillRect(tx*TILE,ty*TILE,0.8*TILE,0.6*TILE);deco.fillStyle(P.PLANT,1).fillRect((tx+0.2)*TILE,(ty-0.8)*TILE,0.4*TILE,0.8*TILE);};
    const machine=(tx,ty)=>{deco.fillStyle(0x9ca3af,1).fillRect(tx*TILE,ty*TILE,1.5*TILE,2.3*TILE);deco.fillStyle(0x374151,1).fillRect((tx+0.25)*TILE,(ty+0.3)*TILE,1*TILE,0.8*TILE);} ;

    shelf(3,2); shelf(9,2); shelf(15,2); plant(2,5.5);
    shelf(24,12); shelf(30,12); plant(27,12); plant(33,15);
    machine(23,2.1); machine(26,2.1);
  }

  placeDesks(){
    const g=this.add.graphics();
    desks.forEach(d=>{
      const p=tileToPx(d.tx,d.ty);
      g.fillStyle(P.DESK,1).fillRect(p.x-24,p.y-14,48,24);
      g.fillStyle(0x2f2f2f,1).fillRect(p.x-10,p.y-24,20,9);
      g.fillStyle(0x9ca3af,1).fillRect(p.x-7,p.y-20,14,5);
      g.fillStyle(P.PAPER,1).fillRect(p.x-20,p.y-10,10,6);
      this.add.text(p.x-36,p.y+18,d.name,{font:'10px Arial',color:'#dbeafe'});
    });
  }

  spawnAgents(){
    agents.forEach(a=>{
      const p=tileToPx(a.x,a.y);
      const c=this.add.container(p.x,p.y);
      // legs
      const legL=this.add.rectangle(-3,-1,3,6,0x1f2937).setOrigin(0.5,1);
      const legR=this.add.rectangle(3,-1,3,6,0x1f2937).setOrigin(0.5,1);
      const body=this.add.rectangle(0,-2,12,10,a.shirt).setOrigin(0.5,1);
      const armL=this.add.rectangle(-7,-5,2,6,a.skin).setOrigin(0.5,1);
      const armR=this.add.rectangle(7,-5,2,6,a.skin).setOrigin(0.5,1);
      const head=this.add.rectangle(0,-12,10,8,a.skin).setOrigin(0.5,1);
      const hair=this.add.rectangle(0,-16,12,4,a.hair).setOrigin(0.5,1);
      const fx=this.add.rectangle(11,-5,7,3,0x00e5ff).setOrigin(0.5,1).setVisible(false);
      c.add([legL,legR,body,armL,armR,head,hair,fx]);
      a.sprite=c; a.legL=legL; a.legR=legR; a.fx=fx;
      a.bubbleText=this.add.text(p.x,p.y-22,'',{font:'10px Arial',backgroundColor:'#111827',color:'#e5e7eb',padding:{x:4,y:2}}).setOrigin(0.5,1).setVisible(false);
    });
  }

  tick(){
    this.tickCount++;
    agents.forEach(a=>{
      if(a.targetDesk){
        const p=tileToPx(a.tx,a.ty);
        const dx=p.x-a.sprite.x, dy=p.y-a.sprite.y;
        const dist=Math.hypot(dx,dy);
        if(dist>1.4){
          a.sprite.x += dx*0.09; a.sprite.y += dy*0.09;
          a.status='walk';
        }else if(a.status==='walk'){
          a.status='type';
          speak(a,'WORK');
        }
      }

      // animate legs for walk
      const step=(this.tickCount%12<6)?0:1;
      if(a.status==='walk'){
        a.legL.y = -1 + (step?1:0);
        a.legR.y = -1 + (step?0:1);
      }else{
        a.legL.y = -1; a.legR.y=-1;
      }

      a.fx.setVisible(['type','read','done'].includes(a.status));
      a.fx.fillColor = a.status==='read' ? P.AMBER || 0xFBBF24 : a.status==='done' ? 0x34D399 : 0x00E5FF;

      if(a.bubbleText){
        a.bubbleText.setPosition(a.sprite.x,a.sprite.y-24);
        if(Date.now()>a.bubbleUntil) a.bubbleText.setVisible(false);
      }
    });
  }
}

async function pollEvents(){
  try {
    const res=await fetch('./events.json?_='+Date.now());
    if(!res.ok) return;
    const data=await res.json();
    (data.events||[]).forEach(e=>{
      if((e.ts||0)<=lastEventTs) return;
      lastEventTs=Math.max(lastEventTs,e.ts||0);
      const a=agents.find(x=>x.name.toLowerCase()===String(e.agent||'').toLowerCase()) || agents[0];
      if(!a) return;
      if(e.status) a.status=e.status;
      if(e.deskId){ selectedAgent=a.id; assignToDesk(e.deskId); }
      if(e.msg){ speak(a,e.msg.slice(0,18)); log(`${a.name}: ${e.msg}`); }
    });
    renderPanels();
  } catch {}
}

function bootPhaser(){
  const canvas = document.getElementById('office');
  const parent = canvas.parentElement;
  canvas.style.display='none';
  const holder=document.createElement('div'); holder.id='phaser-holder';
  parent.insertBefore(holder, canvas);

  new Phaser.Game({
    type: Phaser.CANVAS,
    width: GRID_W*TILE,
    height: GRID_H*TILE,
    parent: 'phaser-holder',
    pixelArt: true,
    backgroundColor: '#08090d',
    scene: [OfficeScene]
  });
}

function init(){
  const s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js';
  s.onload=()=>bootPhaser();
  document.body.appendChild(s);

  document.getElementById('addAgent').onclick=()=>{
    const name=prompt('Agent name?','Agent '+(agents.length+1)); if(!name) return;
    const role=prompt('Role?','Generalist')||'Generalist';
    const a=mkAgent(name,role,agents.length);
    agents.push(a);
    if(sceneRef){ sceneRef.spawnAgents(); }
    renderPanels(); log(`${a.name} spawned`);
  };

  renderPanels();
  log('PixelOps v5 loaded (90s palette build)');
  setInterval(pollEvents, 3500);
}

init();