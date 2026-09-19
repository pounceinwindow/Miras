import { Application, Container, Graphics, Sprite, Texture, Text } from 'pixi.js';
import { IMPACT_FRAMES, IMPACT_DURATION, impactFrame, bindingArt, projectileArt, projectileRotation } from './visual-spec.js';

const sources=import.meta.glob(['/{su_anasy,kremlin,shurale,syuyumbike}/{front,back}/*.png'],{eager:true,query:'?url',import:'default'});
export const ASSET_URLS=sources;
const effectSources=import.meta.glob('/assets/battle/**/*.png',{eager:true,query:'?url',import:'default'});
export const EFFECT_URLS=Object.fromEntries(Object.entries(effectSources).map(([path,url])=>[path.replace('/assets/battle',''),url]));
const clamp=n=>Math.max(0,Math.min(1,n));
const mix=(a,b,p)=>a+(b-a)*p;
const C={bg:0x122b32,water:0x173942,water2:0x1b434b,line:0x2b5358,stone:0x34494a,light:0x68817b,cream:0xf3e6be,gold:0xe2be72,red:0xef8279,cyan:0x72e1dc,leaf:0x9ab967};
export class BattleRenderer {
  constructor(host,onMove){this.host=host;this.onMove=onMove;this.textures={};this.fx=[];this.bindings={};this.overlaySprites=new Map();this.clock=0;this.height=400;this.spriteStates={};this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;}
  async init(onProgress,fighters){
    this.app=new Application();await this.app.init({width:360,height:400,resolution:Math.min(window.devicePixelRatio||1,3),autoDensity:true,antialias:false,backgroundColor:C.bg,roundPixels:true,preference:'webgl'});
    this.host.prepend(this.app.canvas);this.app.canvas.setAttribute('aria-label','Арена с тремя руслами. Нажмите на русло, чтобы перейти.');
    this.app.canvas.setAttribute('role','img');this.app.canvas.style.touchAction='none';
    this.world=new Container();this.app.stage.addChild(this.world);
    this.backdrop=new Sprite();this.ground=new Graphics();this.telegraphs=new Graphics();this.effects=new Graphics();this.world.addChild(this.backdrop,this.ground,this.telegraphs);
    this.actors={player:new Sprite(),enemy:new Sprite()};
    for(const id of ['enemy','player']){this.actors[id].anchor.set(.5,1);this.world.addChild(this.actors[id]);}
    this.artLayers=Object.fromEntries(['gate','bind','shield','shot','impact'].map(name=>[name,new Container()]));
    this.world.addChild(...Object.values(this.artLayers),this.effects);
    this.warningLabels=Array.from({length:3},()=>{const text=new Text({text:'',style:{fontFamily:'monospace',fontSize:11,fontWeight:'bold',fill:C.cream}});text.anchor.set(.5);this.world.addChild(text);return text;});
    const selected=Object.entries(sources).filter(([path])=>!fighters||fighters.some(({hero,face})=>path.startsWith(`/${hero}/${face}/`)));
    const entries=[...selected,...Object.entries(EFFECT_URLS).filter(([path])=>!path.startsWith('/abilities/'))];let count=0;
    await Promise.all(entries.map(async([path,url])=>{
      const image=new Image();image.src=url;await image.decode();
      // Keep the supplied PNG at its original resolution; scale only at rendering time.
      const texture=Texture.from(image);texture.source.scaleMode='nearest';this.textures[path]=texture;
      onProgress?.(++count/entries.length);
    }));
    this.backdrop.texture=this.textures['/background.png'];
    this.app.canvas.addEventListener('pointerdown',event=>{const rect=this.app.canvas.getBoundingClientRect();this.onMove(Math.max(0,Math.min(2,Math.floor((event.clientX-rect.left)/rect.width*3))));});
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(this.host);this.resize();
  }
  resize(){if(!this.app)return;const box=this.host.getBoundingClientRect();this.height=Math.max(255,Math.round(360*box.height/Math.max(1,box.width)));this.app.renderer.resize(360,this.height);this.app.canvas.style.width='100%';this.app.canvas.style.height='100%';this.paintGround();}
  x(lane){return 60+lane*120;}
  y(id){return id==='enemy'?Math.max(130,Math.round(this.height*.34)):this.height-22;}
  paintGround(){
    const texture=this.backdrop.texture;
    const scale=Math.max(405/texture.width,this.height/texture.height);
    this.backdrop.scale.set(scale);
    this.backdrop.position.set(Math.round((360-texture.width*scale)/2),Math.round((this.height-texture.height*scale)/2));
    const g=this.ground;g.clear();
    for(let lane=0;lane<3;lane++){
      const x=this.x(lane);
      for(const id of ['player','enemy']){
        const y=this.y(id);g.rect(x-31,y-4,62,7).fill({color:0x10292f,alpha:.34});
      }
    }
  }
  reset(){this.fx=[];this.bindings={};for(const sprite of this.overlaySprites.values())sprite.destroy();this.overlaySprites.clear();this.clock=0;this.spriteStates={};this.world.position.set(0);}
  event(event,battle){
    const e=battle.entities[event.id],lane=event.lane??e?.lane??1;
    const point={x:this.x(lane),y:this.y(event.id||'enemy')-46};
    if(event.type==='HIT'){
      if(event.damage||event.absorbed)this.fx.push({...point,type:'impact',born:this.clock,life:IMPACT_DURATION});
      if(event.root){const path=bindingArt(event.kind);if(path)this.bindings[event.id]={path,until:e.rootUntil};}
      if(event.damage||event.absorbed)this.fx.push({...point,y:point.y-20,type:'number',text:event.damage?'-'+event.damage:'ЩИТ',born:this.clock,life:1,color:event.id==='player'?C.red:C.cream});
    }
    if(event.type==='MISS')this.fx.push({...point,type:'number',text:'МИМО',born:this.clock,life:.7,color:C.light});
    if(event.type==='MIST')this.fx.push({...point,type:'mistStart',born:this.clock,life:.65});
    if(event.type==='FINISH'&&event.result==='win')for(let i=0;i<12;i++)this.fx.push({type:'confetti',x:12+(i*73)%336,y:-20-(i%5)*15,born:this.clock+i*.015,life:2.8,color:i%2?C.gold:C.cyan,seed:i});
  }
  draw(battle,dt){
    this.clock+=dt;this.usedArt=new Set();const t=battle.time,g=this.effects,tele=this.telegraphs;g.clear();tele.clear();
    const p=battle.entities.player;const selectionX=p.lane*120+17;
    tele.rect(selectionX,this.y('player')-4,86,12).fill({color:C.cyan,alpha:.16});
    tele.rect(selectionX,this.y('player')+9,86,2).fill(C.cyan);
    this.warningLabels.forEach(label=>label.text='');
    for(const warning of battle.pending.flatMap(a=>(a.lanes??[a.lane]).map(lane=>({...a,lane})))){
      const x=warning.lane*120+15,targetY=warning.target==='player'?this.height*.54:0;
      const height=warning.target==='player'?this.height*.46:this.height*.49;
      const remain=warning.due-t,progress=clamp((t-warning.created)/(warning.due-warning.created));
      const color=warning.target==='player'?C.red:C.gold;
      tele.rect(x,targetY,90,height).fill({color,alpha:.07+progress*.1});
      tele.rect(x,targetY,2,height).fill({color,alpha:.7});tele.rect(x+88,targetY,2,height).fill({color,alpha:.7});
      tele.rect(x+7,targetY+height-10,76*progress,3).fill(color);
      if(warning.target==='player'){const label=this.warningLabels[warning.lane];label.text='! '+remain.toFixed(1)+'с';label.position.set(this.x(warning.lane),Math.round(this.height*.57));label.style.fill=C.red;}
    }
    if(battle.pending.some(a=>a.target==='player'&&a.kind==='voice'))for(let lane=0;lane<3;lane++){
      if(!battle.pending.some(a=>a.target==='player'&&(a.lanes??[a.lane]).includes(lane))&&battle.closed.player[lane]<=t){const label=this.warningLabels[lane];label.text='БЕЗОПАСНО';label.position.set(this.x(lane),Math.round(this.height*.57));label.style.fill=C.cyan;}
    }
    for(const id of ['enemy','player']){
      const e=battle.entities[id];for(let lane=0;lane<3;lane++)if(battle.closed[id][lane]>t){
        const x=this.x(lane),y=this.y(id);
        this.art(`gate:${id}:${lane}`,'/gates/kremlin.png',x,y-10,110,1);
        if(id==='player'&&!this.warningLabels[lane].text){const label=this.warningLabels[lane];label.text='× '+Math.ceil(battle.closed[id][lane]-t)+'с';label.position.set(x,y-46);label.style.fill=C.gold;}
      }
      const sprite=this.actors[id],face=id==='player'?'back':'front';
      const texture=this.textures[`/${e.hero}/${face}/${e.pose}.png`];if(texture)sprite.texture=texture;
      const binding=this.bindings[id],bound=!!binding&&binding.until>t&&e.rootUntil>t;
      if(binding&&!bound)delete this.bindings[id];
      const moving=e.movingUntil>t,progress=clamp((t-e.moveStart)/.24);
      const x=moving&&!bound?mix(this.x(e.fromLane),this.x(e.lane),1-(1-progress)**3):this.x(e.lane);
      let y=this.y(id),dx=0,castPulse=0;const direction=id==='player'?-1:1;
      if(!this.reduced&&!bound){
        if(e.pose==='idle'&&battle.status==='playing')y+=Math.round(Math.sin(t*2.8+(id==='enemy'?1:0)));
        if(e.pose==='attack')y+=direction*Math.round(5*Math.sin(clamp((e.poseUntil-t)/.38)*Math.PI));
        if(e.pose==='cast'){
          castPulse=Math.sin(Math.PI*clamp(1-(e.poseUntil-t)/.7));
          y-=Math.round(7*castPulse);dx+=Math.round((id==='player'?-2:2)*castPulse);
        }
        if(e.pose==='hit')dx=Math.round(Math.sin((e.poseUntil-t)*65)*2);
        if(moving)y-=Math.round(Math.sin(progress*Math.PI)*4);
      }
      sprite.position.set(Math.round(x+dx),Math.round(y));sprite.width=Math.round(128*(1+castPulse*.035));sprite.height=Math.round(128*(1+castPulse*.05));
      sprite.rotation=(id==='player'?-1:1)*castPulse*.025;
      sprite.tint=e.pose==='hit'&&Math.floor(t*20)%2?0xffb2a0:0xffffff;sprite.alpha=1;
      this.spriteStates[id]=`${e.hero}/${face}/${e.pose}`;
      if(bound)this.art(`bind:${id}`,binding.path,x,y-(binding.path==='/binds/su_anasy.png'?23:10),108,.95);
      if(e.shield>0&&e.shieldUntil>t){
        this.art(`shield:${id}`,`/shields/${e.hero}.png`,x,this.y(id)-(e.hero==='kremlin'?20:40),e.hero==='kremlin'?132:108,.62);
      }
      if(e.mistUntil>t){
        sprite.alpha=.76;
        if(!this.reduced)for(let j=0;j<8;j++){
          const phase=t*1.9+j*Math.PI/4;
          const mx=Math.round(x+Math.cos(phase)*42),my=Math.round(y-54+Math.sin(phase)*35);
          g.rect(mx,my,7,3).fill({color:C.leaf,alpha:.72});
          g.rect(mx+2,my-2,3,7).fill({color:C.leaf,alpha:.38});
        }
      }
    }
    battle.projectiles.forEach((shot,index)=>{
      const progress=clamp((t-shot.created)/(shot.due-shot.created));
      const y=mix(this.y(shot.source)-45,this.y(shot.target)-45,progress);
      this.art(`shot:${index}`,projectileArt(shot,battle.entities),this.x(shot.lane),y,48,1,projectileRotation(shot));
    });
    this.fx=this.fx.filter(f=>this.clock-f.born<f.life);
    for(const f of this.fx){const age=this.clock-f.born;if(age<0)continue;const progress=age/f.life;
      if(f.type==='impact'){this.art(`impact:${this.fx.indexOf(f)}`,IMPACT_FRAMES[impactFrame(age)],f.x,f.y,76,1);continue;}
      if(f.type==='number'){this.pixelText(f.text,f.x,f.y-(this.reduced?0:Math.round(progress*20)),f.color,1-progress*.6);continue;}
      if(f.type==='mistStart'){
        if(!this.reduced)for(let j=0;j<8;j++){
          const angle=j*Math.PI/4,range=8+progress*37;
          const mx=Math.round(f.x+Math.cos(angle)*range),my=Math.round(f.y+Math.sin(angle)*range);
          g.rect(mx,my,6,3).fill({color:C.leaf,alpha:1-progress});
        }
        continue;
      }
      if(f.type==='confetti'){g.rect(f.x+Math.round(Math.sin(age*3+f.seed)*12),f.y+age*120,3,5).fill({color:f.color,alpha:1-progress});continue;}
    }
    for(const [key,sprite] of this.overlaySprites)if(!this.usedArt.has(key)){sprite.destroy();this.overlaySprites.delete(key);}
  }
  art(key,path,x,y,size,alpha=1,rotation=0){
    const texture=this.textures[path];if(!texture)return;
    const layer=this.artLayers[key.split(':')[0]];
    let sprite=this.overlaySprites.get(key);
    if(!sprite){sprite=new Sprite(texture);sprite.anchor.set(.5);this.overlaySprites.set(key,sprite);}
    sprite.texture=texture;sprite.position.set(Math.round(x),Math.round(y));sprite.width=size;sprite.height=size;sprite.alpha=alpha;sprite.rotation=rotation;
    layer.addChild(sprite);this.usedArt.add(key);
  }
  pixelText(text,x,y,color,alpha){
    const letters={'0':['111','101','101','101','111'],'1':['010','110','010','010','111'],'2':['111','001','111','100','111'],'3':['111','001','111','001','111'],'4':['101','101','111','001','001'],'5':['111','100','111','001','111'],'6':['111','100','111','101','111'],'7':['111','001','010','010','010'],'8':['111','101','111','101','111'],'9':['111','101','111','001','111'],'-':['000','000','111','000','000'],'М':['10001','11011','10101','10001','10001'],'И':['1001','1001','1011','1101','1001'],'О':['111','101','101','101','111'],'Щ':['10101','10101','10101','11111','00001'],'Т':['111','010','010','010','010']};
    letters['.']=['0','0','0','0','1'];letters['!']=['1','1','1','0','1'];
    const chars=[...text],width=chars.reduce((sum,ch)=>sum+((letters[ch]?.[0].length||3)+1)*2,0);let cursor=Math.round(x-width/2);
    for(const ch of chars){const rows=letters[ch]||letters['-'];rows.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1')this.effects.rect(cursor+i*2,Math.round(y)+j*2,2,2).fill({color,alpha});}));cursor+=(rows[0].length+1)*2;}
  }
}
