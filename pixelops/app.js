/* PixelOps V6 - Phaser Tiled map pipeline */
const TILE = 16;
const statusCycle = ['idle','walk','type','read','done'];
const desks = [
  { id:'d1', name:'Artist Dashboard', dir:'/artist-dashboard', tx:6, ty:5 },
  { id:'d2', name:'Goal Tracker', dir:'/mjcitytracker', tx:14, ty:5 },
  { id:'d3', name:'TechMyMoney', dir:'/techmymoney', tx:22, ty:5 },
  { id:'d4', name:'Automation', dir:'/scripts', tx:10, ty:13 },
  { id:'d5', name:'Media Ops', dir:'/content', tx:19, ty:13 }
];
const styles = [
  { skin:0xf2c6a0, hair:0x2b1f1f, shirt:0x2f80ed },
  { skin:0xeebd98, hair:0xd39c57, shirt:0x111827 },
  { skin:0x8a5a44, hair:0x111827, shirt:0xef4444 },
  { skin:0xf2c6a0, hair:0x0f172a, shirt:0xf97316 },
];

let selectedAgent = null;
let lastEventTs = 0;
let sceneRef = null;

const agents = [mkAgent('Nova','Frontend',0), mkAgent('Byte','Automation',1), mkAgent('Pulse','QA',2), mkAgent('Echo','Research',3)];

function mkAgent(name, role, i){
  return { id: crypto.randomUUID().slice(0,8), name, role, status:'idle', tx:4+i, ty:14, x:4+i, y:14, targetDesk:null, bubble:'', bubbleUntil:0, ...styles[i%styles.length] };
}

function tileToPx(tx, ty){ return { x: tx*TILE + TILE/2, y: ty*TILE + TILE/2 }; }
function log(msg){ const f=document.getElementById('feed'); const li=document.createElement('li'); li.textContent=`${new Date().toLocaleTimeString()} • ${msg}`; f.prepend(li); while(f.children.length>40) f.removeChild(f.lastChild); }

function renderPanels(){
  const dRoot=document.getElementById('desks'); dRoot.innerHTML='';
  desks.forEach(d=>{
    const el=document.createElement('div'); el.className='desk'; el.innerHTML=`<strong>${d.name}</strong><br><small>${d.dir}</small>`;
    el.onclick=()=>assignToDesk(d.id);
    el.ondragover=(e)=>{e.preventDefault(); el.classList.add('drop');};
    el.ondragleave=()=>el.classList.remove('drop');
    el.ondrop=(e)=>{e.preventDefault(); el.classList.remove('drop'); const aid=e.dataTransfer.getData('text/agent-id'); if(aid){selectedAgent=aid; assignToDesk(d.id);} };
    dRoot.appendChild(el);
  });
  const aRoot=document.getElementById('agents'); aRoot.innerHTML='';
  agents.forEach(a=>{
    const el=document.createElement('div'); el.className='agent'; el.draggable=true;
    el.innerHTML=`<div><strong>${a.name}</strong><br><small>${a.role}</small></div><span class="chip ${a.status}">${a.status}</span>`;
    el.onclick=()=>{selectedAgent=a.id; renderPanels();};
    el.ondblclick=()=>cycleStatus(a.id);
    el.ondragstart=(e)=>e.dataTransfer.setData('text/agent-id',a.id);
    if(selectedAgent===a.id) el.style.outline='1px solid #00E5FF';
    aRoot.appendChild(el);
  });
}

function assignToDesk(did){
  if(!selectedAgent) return log('Select an agent first.');
  const a=agents.find(x=>x.id===selectedAgent), d=desks.find(x=>x.id===did); if(!a||!d) return;
  a.targetDesk=did; a.tx=d.tx; a.ty=d.ty+1.5; a.status='walk'; speak(a,`To ${d.name}`); log(`${a.name} assigned to ${d.name}`); renderPanels();
}
function cycleStatus(id){ const a=agents.find(x=>x.id===id); if(!a) return; a.status=statusCycle[(statusCycle.indexOf(a.status)+1)%statusCycle.length]; speak(a,a.status.toUpperCase()); renderPanels(); }
function speak(a,t){ a.bubble=t; a.bubbleUntil=Date.now()+2200; if(a.bubbleText) a.bubbleText.setText(t).setVisible(true); }

class OfficeScene extends Phaser.Scene {
  constructor(){ super('OfficeScene'); this.tickCount=0; }
  preload(){ this.load.tilemapTiledJSON('office','./assets/maps/office_map.json'); }
  create(){
    sceneRef=this;
    this.makeGeneratedTileset();

    const map=this.make.tilemap({key:'office'});
    const tileset=map.addTilesetImage('office_tiles','office_tiles');
    map.createLayer('Ground',tileset,0,0);
    map.createLayer('Walls',tileset,0,0);
    map.createLayer('Objects',tileset,0,0);
    const collision=map.createLayer('Collision',tileset,0,0);
    collision.setCollisionByExclusion([-1,0]);

    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setZoom(2.2);

    this.spawnAgents();
    this.time.addEvent({delay:70,loop:true,callback:()=>this.tick()});
  }

  makeGeneratedTileset(){
    const tex=this.textures.createCanvas('office_tiles',256,256);
    const c=tex.getContext();
    const drawTile=(id,fill,stroke)=>{ const tx=((id-1)%16)*16, ty=Math.floor((id-1)/16)*16; c.fillStyle=fill; c.fillRect(tx,ty,16,16); c.strokeStyle=stroke||'rgba(0,0,0,.25)'; c.strokeRect(tx+0.5,ty+0.5,15,15); };
    drawTile(1,'#806030','#704010'); // wood
    drawTile(2,'#d0c0c0','#f0e8e8'); // tile
    drawTile(3,'#2E4660','#203040'); // carpet
    drawTile(4,'#507090','#101020'); // wall
    drawTile(5,'#805030','#704010'); // desk
    tex.refresh();
  }

  spawnAgents(){
    agents.forEach(a=>{
      const p=tileToPx(a.x,a.y);
      const c=this.add.container(p.x,p.y);
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
      a.bubbleText=this.add.text(p.x,p.y-24,'',{font:'10px Arial',backgroundColor:'#111827',color:'#e5e7eb',padding:{x:4,y:2}}).setOrigin(0.5,1).setVisible(false);
    });
  }

  tick(){
    this.tickCount++;
    agents.forEach(a=>{
      if(a.targetDesk){
        const p=tileToPx(a.tx,a.ty);
        const dx=p.x-a.sprite.x, dy=p.y-a.sprite.y;
        const dist=Math.hypot(dx,dy);
        if(dist>1.4){ a.sprite.x+=dx*0.09; a.sprite.y+=dy*0.09; a.status='walk'; }
        else if(a.status==='walk'){ a.status='type'; speak(a,'WORK'); }
      }
      const step=(this.tickCount%12<6)?0:1;
      if(a.status==='walk'){ a.legL.y=-1+(step?1:0); a.legR.y=-1+(step?0:1); } else { a.legL.y=-1; a.legR.y=-1; }
      a.fx.setVisible(['type','read','done'].includes(a.status));
      a.fx.fillColor = a.status==='read' ? 0xFBBF24 : a.status==='done' ? 0x34D399 : 0x00E5FF;
      if(a.bubbleText){ a.bubbleText.setPosition(a.sprite.x,a.sprite.y-24); if(Date.now()>a.bubbleUntil) a.bubbleText.setVisible(false); }
    });
  }
}

async function pollEvents(){
  try{
    const r=await fetch('./events.json?_='+Date.now()); if(!r.ok) return; const data=await r.json();
    (data.events||[]).forEach(e=>{
      if((e.ts||0)<=lastEventTs) return; lastEventTs=Math.max(lastEventTs,e.ts||0);
      const a=agents.find(x=>x.name.toLowerCase()===String(e.agent||'').toLowerCase())||agents[0]; if(!a) return;
      if(e.status) a.status=e.status; if(e.deskId){ selectedAgent=a.id; assignToDesk(e.deskId);} if(e.msg){ speak(a,e.msg.slice(0,18)); log(`${a.name}: ${e.msg}`); }
    });
    renderPanels();
  }catch{}
}

function init(){
  const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js';
  s.onload=()=>{
    const canvas=document.getElementById('office'); const parent=canvas.parentElement; canvas.style.display='none';
    const holder=document.createElement('div'); holder.id='phaser-holder'; parent.insertBefore(holder,canvas);
    new Phaser.Game({type:Phaser.CANVAS,width:GRID_W*TILE,height:GRID_H*TILE,parent:'phaser-holder',pixelArt:true,backgroundColor:'#08090d',scene:[OfficeScene]});
  };
  document.body.appendChild(s);

  document.getElementById('addAgent').onclick=()=>{
    const name=prompt('Agent name?','Agent '+(agents.length+1)); if(!name) return;
    const role=prompt('Role?','Generalist')||'Generalist';
    const a=mkAgent(name,role,agents.length%styles.length); agents.push(a);
    if(sceneRef) sceneRef.spawnAgents();
    renderPanels(); log(`${a.name} spawned`);
  };

  renderPanels();
  log('PixelOps v6 loaded (Tiled map pipeline)');
  setInterval(pollEvents,3500);
}

init();