/* PixelOps V7 - Real tileset + sprite sheets */
const TILE = 16;
const statusCycle = ['idle','walk','type','read','done'];
const desks = [
  { id:'d1', name:'Artist Dashboard', dir:'/artist-dashboard', tx:6, ty:5 },
  { id:'d2', name:'Goal Tracker', dir:'/mjcitytracker', tx:14, ty:5 },
  { id:'d3', name:'TechMyMoney', dir:'/techmymoney', tx:22, ty:5 },
  { id:'d4', name:'Automation', dir:'/scripts', tx:10, ty:13 },
  { id:'d5', name:'Media Ops', dir:'/content', tx:19, ty:13 }
];

let selectedAgent = null;
let lastEventTs = 0;

const agents = [
  mkAgent('Nova','Frontend','nova',0),
  mkAgent('Byte','Automation','byte',1),
  mkAgent('Pulse','QA','pulse',2),
  mkAgent('Stack','Research','stack',3)
];

function makeId(){
  try {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
      return globalThis.crypto.randomUUID().slice(0, 8);
    }
  } catch {}
  return Math.random().toString(36).slice(2, 10);
}

function mkAgent(name, role, texture, i){
  return {
    id: makeId(),
    name, role, texture,
    status:'idle',
    tx: 4 + i,
    ty: 14,
    targetDesk:null,
    sprite:null,
    bubbleText:null,
    bubbleUntil:0,
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
    el.ondrop=(e)=>{e.preventDefault(); el.classList.remove('drop'); const aid=e.dataTransfer.getData('text/agent-id'); if(aid){ selectedAgent=aid; assignToDesk(d.id);} };
    dRoot.appendChild(el);
  });

  const aRoot=document.getElementById('agents'); aRoot.innerHTML='';
  agents.forEach(a=>{
    const el=document.createElement('div');
    el.className='agent';
    el.draggable=true;
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
  const a=agents.find(x=>x.id===selectedAgent), d=desks.find(x=>x.id===did);
  if(!a || !d) return;
  a.targetDesk=did;
  a.tx=d.tx; a.ty=d.ty+1.5;
  a.status='walk';
  speak(a, `To ${d.name}`);
  playAnim(a);
  renderPanels();
  log(`${a.name} assigned to ${d.name}`);
}

function cycleStatus(id){
  const a=agents.find(x=>x.id===id); if(!a) return;
  a.status=statusCycle[(statusCycle.indexOf(a.status)+1)%statusCycle.length];
  speak(a,a.status.toUpperCase());
  playAnim(a);
  renderPanels();
  log(`${a.name} → ${a.status}`);
}

function speak(agent, text){
  if(!agent) return;
  agent.bubbleUntil = Date.now() + 2200;
  if(agent.bubbleText){
    agent.bubbleText.setText(text).setVisible(true);
  }
}

function playAnim(agent){
  if(!agent?.sprite) return;
  const key = `${agent.texture}_${animForStatus(agent.status)}`;
  if(agent.sprite.anims?.animationManager?.exists(key)) agent.sprite.play(key, true);
}

function animForStatus(status){
  if(status==='walk') return 'walk';
  if(status==='type') return 'type';
  if(status==='read') return 'read';
  if(status==='done') return 'done';
  return 'idle';
}

let OfficeScene;
function defineOfficeScene(){
OfficeScene = class OfficeScene extends Phaser.Scene {
  constructor(){ super('OfficeScene'); }
  preload(){
    this.load.tilemapTiledJSON('office','./assets/maps/office_map.json');
    this.load.image('office_tiles','./assets/tiles/office_tiles.png');

    ['nova','byte','pulse','stack'].forEach(k=>{
      this.load.spritesheet(k, `./assets/characters/${k}.png`, { frameWidth: 32, frameHeight: 32 });
    });
  }

  create(){
    const map=this.make.tilemap({key:'office'});
    const tileset=map.addTilesetImage('office_tiles','office_tiles');
    this.groundLayer = map.createLayer('Ground',tileset,0,0);
    this.wallsLayer = map.createLayer('Walls',tileset,0,0);
    this.objectsLayer = map.createLayer('Objects',tileset,0,0);
    this.collisionLayer = map.createLayer('Collision',tileset,0,0);
    this.collisionLayer.setCollisionByExclusion([-1,0]);

    this.physics.world.setBounds(0,0,map.widthInPixels,map.heightInPixels);
    this.textures.each(t => t.setFilter(Phaser.Textures.FilterMode.NEAREST));
    this.createAnimations();
    this.spawnAgents(map);

    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setZoom(1);

    // user zoom controls (desktop/laptop)
    this.input.on('wheel', (_p, _go, _dx, dy) => {
      const z = Phaser.Math.Clamp(this.cameras.main.zoom - (dy > 0 ? 0.1 : -0.1), 0.8, 3);
      this.cameras.main.setZoom(z);
    });

    this.time.addEvent({delay:60,loop:true,callback:()=>this.tickMove()});
  }

  createAnimations(){
    const ranges = {
      // preserve provided frame rows/timing layout across 24-frame strip
      idle: {start:0,end:3,rate:6},
      walk: {start:4,end:11,rate:10},
      type: {start:12,end:15,rate:8},
      read: {start:16,end:19,rate:7},
      done: {start:20,end:23,rate:6}
    };
    ['nova','byte','pulse','stack'].forEach(tex=>{
      Object.entries(ranges).forEach(([name,r])=>{
        const key=`${tex}_${name}`;
        if(this.anims.exists(key)) return;
        this.anims.create({ key, frames: this.anims.generateFrameNumbers(tex,{start:r.start,end:r.end}), frameRate:r.rate, repeat:-1 });
      });
    });
  }

  spawnAgents(map){
    const spawns = map.getObjectLayer('Spawns');
    const spawnByName = (n, defX, defY) => (spawns?.objects || []).find(o=>o.name===n) || {x:defX,y:defY};

    agents.forEach((a,i)=>{
      const sp = spawnByName(`spawn_${a.texture}`, 64 + (i*28), 220);
      const s=this.physics.add.sprite(sp.x, sp.y, a.texture, 0);
      s.setCollideWorldBounds(true);
      s.setDepth(10);
      a.sprite=s;
      a.tx = Math.round(sp.x / TILE);
      a.ty = Math.round(sp.y / TILE);
      playAnim(a);

      // wire collisions to Tiled Collision layer
      this.physics.add.collider(s, this.collisionLayer);
      a.bubbleText=this.add.text(sp.x,sp.y-22,'',{font:'10px Arial',backgroundColor:'#111827',color:'#e5e7eb',padding:{x:4,y:2}}).setOrigin(0.5,1).setVisible(false).setDepth(20);
    });
  }

  tickMove(){
    agents.forEach(a=>{
      if(!a.sprite) return;
      if(a.targetDesk){
        const p=tileToPx(a.tx,a.ty);
        const dx=p.x-a.sprite.x, dy=p.y-a.sprite.y;
        const dist=Math.hypot(dx,dy);
        if(dist>2){
          a.sprite.setVelocity(dx*3.8, dy*3.8);
          if(a.status!=='walk'){ a.status='walk'; playAnim(a); }
        } else {
          a.sprite.setVelocity(0,0);
          if(a.status==='walk'){ a.status='type'; playAnim(a); speak(a,'WORK'); }
        }
      } else {
        a.sprite.setVelocity(0,0);
      }

      if(a.bubbleText){
        a.bubbleText.setPosition(a.sprite.x, a.sprite.y-20);
        if(Date.now()>a.bubbleUntil) a.bubbleText.setVisible(false);
      }
    });
  }
};
}

async function pollEvents(){
  try{
    const r=await fetch('./events.json?_='+Date.now());
    if(!r.ok) return;
    const data=await r.json();
    (data.events||[]).forEach(e=>{
      if((e.ts||0)<=lastEventTs) return;
      lastEventTs = Math.max(lastEventTs, e.ts||0);
      const a=agents.find(x=>x.name.toLowerCase()===String(e.agent||'').toLowerCase()) || agents[0];
      if(!a) return;
      if(e.status){ a.status=e.status; playAnim(a); }
      if(e.deskId){ selectedAgent=a.id; assignToDesk(e.deskId); }
      if(e.msg){ speak(a, e.msg.slice(0,18)); log(`${a.name}: ${e.msg}`); }
    });
    renderPanels();
  } catch {}
}

function init(){
  if (window.__pixelopsBooted) return;
  window.__pixelopsBooted = true;

  const script=document.createElement('script');
  script.src='https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js';
  script.onload=()=>{
    defineOfficeScene();
    const oldCanvas=document.getElementById('office');
    const parent=oldCanvas.parentElement;
    oldCanvas.style.display='none';
    const holder=document.createElement('div'); holder.id='phaser-holder';
    parent.insertBefore(holder,oldCanvas);
    new Phaser.Game({
      type:Phaser.CANVAS,
      width:36*TILE,
      height:18*TILE,
      parent:'phaser-holder',
      pixelArt:true,
      backgroundColor:'#08090d',
      scale:{ mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      physics:{default:'arcade'},
      scene:[OfficeScene]
    });
  };
  document.body.appendChild(script);

  document.getElementById('addAgent').onclick=()=>{
    const name=prompt('Agent name?','Agent '+(agents.length+1)); if(!name) return;
    const role=prompt('Role?','Generalist')||'Generalist';
    const tex=['nova','byte','pulse','stack'][agents.length%4];
    const a=mkAgent(name,role,tex,agents.length); agents.push(a);
    renderPanels(); log(`${a.name} spawned`);
  };

  renderPanels();
  log('PixelOps v7 loaded (real assets)');
  setInterval(pollEvents, 3000);
}

function ensureBoot(){
  try {
    if (!window.__pixelopsBooted) init();
    if (document.querySelectorAll('#desks .desk').length === 0) renderPanels();
    if (document.querySelectorAll('#feed li').length === 0) log('Bootstrapped');
  } catch {}
}

// multi-pass boot for stubborn browsers / cached partial loads
ensureBoot();
window.addEventListener('DOMContentLoaded', ensureBoot);
window.addEventListener('load', ensureBoot);
setTimeout(ensureBoot, 600);
setTimeout(ensureBoot, 1500);
