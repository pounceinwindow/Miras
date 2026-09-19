import { Application, Container, Graphics, Sprite, Texture, Text } from 'pixi.js';
import { HEROES } from './engine.js';

const sources=import.meta.glob(['/{su_anasy,kremlin,shurale,syuyumbike}/{front,back}/*.png'],{eager:true,query:'?url',import:'default'});
export const ASSET_URLS=sources;
const clamp=n=>Math.max(0,Math.min(1,n));
const mix=(a,b,p)=>a+(b-a)*p;
const C={bg:0x122b32,water:0x173942,water2:0x1b434b,line:0x2b5358,stone:0x34494a,light:0x68817b,cream:0xf3e6be,gold:0xe2be72,red:0xef8279,cyan:0x72e1dc};
export class BattleRenderer {
  constructor(host,onMove){this.host=host;this.onMove=onMove;this.textures={};this.fx=[];this.clock=0;this.height=400;this.spriteStates={};this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;}
  async init(onProgress){
    this.app=new Application();await this.app.init({width:360,height:400,resolution:Math.min(window.devicePixelRatio||1,3),autoDensity:true,antialias:false,backgroundColor:C.bg,roundPixels:true,preference:'webgl'});
    this.host.prepend(this.app.canvas);this.app.canvas.setAttribute('aria-label','Арена с тремя руслами. Нажмите на русло, чтобы перейти.');
    this.app.canvas.setAttribute('role','img');this.app.canvas.style.touchAction='none';
    this.world=new Container();this.app.stage.addChild(this.world);
    this.ground=new Graphics();this.telegraphs=new Graphics();this.effects=new Graphics();this.world.addChild(this.ground,this.telegraphs);
    this.actors={player:new Sprite(),enemy:new Sprite()};
    for(const id of ['enemy','player']){this.actors[id].anchor.set(.5,1);this.world.addChild(this.actors[id]);}
    this.world.addChild(this.effects);
    this.warningLabels=Array.from({length:3},()=>{const text=new Text({text:'',style:{fontFamily:'monospace',fontSize:11,fontWeight:'bold',fill:C.cream}});text.anchor.set(.5);this.world.addChild(text);return text;});
    const entries=Object.entries(sources);let count=0;
    await Promise.all(entries.map(async([path,url])=>{
      const image=new Image();image.src=url;await image.decode();
      // Keep the supplied PNG at its original resolution; scale only at rendering time.
      const texture=Texture.from(image);texture.source.scaleMode='nearest';this.textures[path]=texture;
      onProgress?.(++count/entries.length);
    }));
    this.app.canvas.addEventListener('pointerdown',event=>{const rect=this.app.canvas.getBoundingClientRect();this.onMove(Math.max(0,Math.min(2,Math.floor((event.clientX-rect.left)/rect.width*3))));});
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(this.host);this.resize();
  }
  resize(){if(!this.app)return;const box=this.host.getBoundingClientRect();this.height=Math.max(255,Math.round(360*box.height/Math.max(1,box.width)));this.app.renderer.resize(360,this.height);this.app.canvas.style.width='100%';this.app.canvas.style.height='100%';this.paintGround();}
  x(lane){return 60+lane*120;}
  y(id){return id==='enemy'?Math.max(130,Math.round(this.height*.34)):this.height-22;}
  paintGround(){
    const g=this.ground,h=this.height;g.clear();g.rect(0,0,360,h).fill(C.bg);
    for(let lane=0;lane<3;lane++){
      const x=lane*120;
      g.rect(x+10,0,100,h).fill(C.water);g.rect(x+18,0,84,h).fill(C.water2);
      for(let row=0;row<Math.ceil(h/24);row++){
        const y=row*24;g.rect(x+2,y,6,16).fill(C.stone);g.rect(x+111,y+8,6,16).fill(C.stone);
        g.rect(x+28+(row%3)*17,y+8,15,2).fill({color:C.cyan,alpha:.12});g.rect(x+43+(row%2)*27,y+18,8,1).fill({color:C.cyan,alpha:.1});
      }
      for(const id of ['player','enemy']){
        const y=this.y(id);g.rect(x+23,y-6,74,12).fill(0x10292f);g.rect(x+15,y-3,90,6).fill(0x10292f);
        g.rect(x+30,y+8,60,1).fill({color:C.light,alpha:.4});
      }
    }
    g.rect(0,Math.round(h*.51),360,1).fill({color:C.light,alpha:.3});
    for(let i=0;i<9;i++)g.rect(12+i*42,Math.round(h*.51)-2,3,5).fill(C.light);
  }
  reset(){this.fx=[];this.clock=0;this.spriteStates={};this.world.position.set(0);}
  event(event,battle){
    const e=battle.entities[event.id],lane=event.lane??e?.lane??1;
    const point={x:this.x(lane),y:this.y(event.id||'enemy')-46};
    if(event.type==='HIT'){
      this.fx.push({...point,type:'hit',born:this.clock,life:.4,color:C.cream});
      this.fx.push({...point,y:point.y-20,type:'number',text:event.damage?'-'+event.damage:event.absorbed?'ЩИТ':'!',born:this.clock,life:1,color:event.id==='player'?C.red:C.cream});
    }
    if(event.type==='MISS')this.fx.push({...point,type:'number',text:'МИМО',born:this.clock,life:.7,color:C.light});
    if(event.type==='REFLECT')this.fx.push({...point,type:'burst',born:this.clock,life:.6,color:C.cyan});
    if(event.type==='CAST')this.fx.push({...point,type:{su_anasy:'water',kremlin:'stone',shurale:'leaf',syuyumbike:'royal'}[event.hero],born:this.clock,life:.8,color:HEROES[event.hero].color,slot:event.slot});
    if(event.type==='ABSORB')this.fx.push({...point,type:'leaf',born:this.clock,life:.5,color:HEROES.shurale.color});
    if(event.type==='IMPACT')this.fx.push({...point,y:this.y(event.id)-18,type:{seal:'stone',tickle:'vines',voice:'royal'}[event.kind]||'burst',born:this.clock,life:.65,color:HEROES[battle.entities[event.source].hero].color});
    if(event.type==='FINISH'&&event.result==='win')for(let i=0;i<26;i++)this.fx.push({type:'confetti',x:12+(i*73)%336,y:-20-(i%5)*15,born:this.clock+i*.015,life:2.8,color:i%2?C.gold:C.cyan,seed:i});
  }
  draw(battle,dt){
    this.clock+=dt;const t=battle.time,g=this.effects,tele=this.telegraphs;g.clear();tele.clear();
    const p=battle.entities.player;const selectionX=p.lane*120+17;
    tele.rect(selectionX,this.y('player')-4,86,12).fill({color:C.cyan,alpha:.16});
    tele.rect(selectionX,this.y('player')+9,86,2).fill(C.cyan);
    this.warningLabels.forEach(label=>label.text='');
    for(const warning of battle.pending.flatMap(a=>(a.lanes??[a.lane]).map(lane=>({...a,lane})))){
      const x=warning.lane*120+15,targetY=warning.target==='player'?this.height*.54:0;
      const height=warning.target==='player'?this.height*.46:this.height*.49;
      const remain=warning.due-t,progress=clamp((t-warning.created)/(warning.due-warning.created));
      const color=warning.target==='player'?C.red:C.gold;
      tele.rect(x,targetY,90,height).fill({color,alpha:.13+progress*.14});
      tele.rect(x,targetY,2,height).fill({color,alpha:.8});tele.rect(x+88,targetY,2,height).fill({color,alpha:.8});
      tele.rect(x+7,targetY+height-10,76*progress,3).fill(color);
      for(let k=0;k<4;k++)tele.rect(x+14+k*19,targetY+height-18,6,2).fill(color);
      if(warning.target==='player'){const label=this.warningLabels[warning.lane];label.text='! '+remain.toFixed(1)+'с';label.position.set(this.x(warning.lane),Math.round(this.height*.57));label.style.fill=C.red;}
    }
    if(battle.pending.some(a=>a.target==='player'&&a.kind==='voice'))for(let lane=0;lane<3;lane++){
      if(!battle.pending.some(a=>a.target==='player'&&(a.lanes??[a.lane]).includes(lane))&&battle.closed.player[lane]<=t){const label=this.warningLabels[lane];label.text='БЕЗОПАСНО';label.position.set(this.x(lane),Math.round(this.height*.57));label.style.fill=C.cyan;}
    }
    for(const id of ['enemy','player']){
      const e=battle.entities[id];for(let lane=0;lane<3;lane++)if(battle.closed[id][lane]>t){
        const x=this.x(lane),y=id==='player'?this.height*.62:this.height*.4;
        for(let j=0;j<5;j++){tele.rect(x-35+j*15,y,11,9).fill(C.gold);tele.rect(x-35+j*15,y+10,11,4).fill(0x947b50);}
        if(id==='player'&&!this.warningLabels[lane].text){const label=this.warningLabels[lane];label.text='× '+Math.ceil(battle.closed[id][lane]-t)+'с';label.position.set(x,y-10);label.style.fill=C.gold;}
      }
      const sprite=this.actors[id],face=id==='player'?'back':'front';
      const texture=this.textures[`/${e.hero}/${face}/${e.pose}.png`];if(texture)sprite.texture=texture;
      const moving=e.movingUntil>t,progress=clamp((t-e.moveStart)/.24);
      const x=moving?mix(this.x(e.fromLane),this.x(e.lane),1-(1-progress)**3):this.x(e.lane);
      let y=this.y(id),dx=0;const direction=id==='player'?-1:1;
      if(!this.reduced){
        if(e.pose==='idle'&&battle.status==='playing')y+=Math.round(Math.sin(t*2.8+(id==='enemy'?1:0)));
        if(e.pose==='attack')y+=direction*Math.round(5*Math.sin(clamp((e.poseUntil-t)/.38)*Math.PI));
        if(e.pose==='cast')y-=Math.round(3*Math.sin(clamp((e.poseUntil-t)/.7)*Math.PI));
        if(e.pose==='hit')dx=Math.round(Math.sin((e.poseUntil-t)*65)*2);
        if(moving)y-=Math.round(Math.sin(progress*Math.PI)*4);
      }
      sprite.position.set(Math.round(x+dx),Math.round(y));sprite.width=128;sprite.height=128;
      sprite.tint=e.pose==='hit'&&Math.floor(t*20)%2?0xffb2a0:0xffffff;sprite.alpha=1;
      this.spriteStates[id]=`${e.hero}/${face}/${e.pose}`;
      if(e.shield>0&&e.shieldUntil>t){
        const color=HEROES[e.hero].color;g.rect(x-43,y-65,3,57).fill(color);g.rect(x+40,y-65,3,57).fill(color);g.rect(x-33,y-76,66,3).fill(color);g.rect(x-40,y-68,7,3).fill(color);g.rect(x+33,y-68,7,3).fill(color);g.rect(x-32,y-8,64,3).fill(color);
      }
      if(e.reflectUntil>t){for(let j=0;j<7;j++)g.rect(x-45+j*14,y-15+Math.round(Math.sin(t*8+j)*4),10,3).fill(C.cyan);g.rect(x-40,y-72,80,2).fill({color:C.cyan,alpha:.55});}
      if(e.rootUntil>t){for(let j=0;j<6;j++)g.rect(x-33+j*12,y-9,8,5).fill(C.gold);g.rect(x-35,y-4,72,2).fill(C.gold);}
      if(e.mistUntil>t){
        sprite.alpha=.78;
        for(let j=0;j<12;j++){const phase=t*1.7+j*.52,mx=x+Math.round(Math.cos(phase)*44),my=y-53+Math.round(Math.sin(phase)*43);g.rect(mx,my,7,3).fill({color:HEROES.shurale.color,alpha:.8});g.rect(mx+2,my-2,3,7).fill({color:HEROES.shurale.color,alpha:.5});}
      }
      if(e.weakenUntil>t){for(let j=0;j<2;j++){const sy=y-93+j*9;g.rect(x+35,sy,3,9).fill(0xe5a8c1);g.rect(x+32,sy+5,9,2).fill(0xe5a8c1);}g.rect(x-22,y+3,44,2).fill(0xe5a8c1);}
    }
    for(const shot of battle.projectiles){const progress=clamp((t-shot.created)/(shot.due-shot.created)),x=this.x(shot.lane),y=mix(this.y(shot.source)-45,this.y(shot.target)-45,progress),dir=shot.target==='player'?1:-1,color=shot.reflected?C.cream:HEROES[battle.entities[shot.source].hero].color;
      g.rect(x-2,y-5,5,10).fill(color);g.rect(x-4,y-2,9,4).fill(color);g.rect(x-1,y-dir*12,3,4).fill({color,alpha:.5});
    }
    this.fx=this.fx.filter(f=>this.clock-f.born<f.life);
    for(const f of this.fx){const age=this.clock-f.born;if(age<0)continue;const progress=age/f.life;
      if(f.type==='number'){this.pixelText(f.text,f.x,f.y-(this.reduced?0:Math.round(progress*20)),f.color,1-progress*.6);continue;}
      if(f.type==='confetti'){g.rect(f.x+Math.round(Math.sin(age*3+f.seed)*12),f.y+age*120,3,5).fill({color:f.color,alpha:1-progress});continue;}
      if(f.type==='vines'){for(let side of [-1,1])for(let j=0;j<3;j++){const x=f.x+side*(18+j*7),y=f.y-8-j*6-Math.round(Math.sin(progress*Math.PI)*12);g.rect(x,y,3,24).fill({color:f.color,alpha:1-progress});g.rect(x+(side<0?0:-7),y,10,3).fill({color:f.color,alpha:1-progress});}continue;}
      if(f.type==='royal'){const r=8+Math.round(progress*35);g.rect(f.x-r,f.y-r,2*r,2).fill({color:f.color,alpha:1-progress});g.rect(f.x-r,f.y+r,2*r,2).fill({color:f.color,alpha:1-progress});g.rect(f.x-r,f.y-r,2,2*r).fill({color:f.color,alpha:1-progress});g.rect(f.x+r,f.y-r,2,2*r).fill({color:f.color,alpha:1-progress});}
      const n=f.type==='hit'?8:12;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,r=8+progress*(f.type==='water'?48:25),sx=f.x+Math.cos(a)*r,sy=f.y+Math.sin(a)*r+(f.type==='stone'?progress*progress*22:0);g.rect(Math.round(sx),Math.round(sy),f.type==='stone'?5:3,f.type==='water'?2:3).fill({color:f.color,alpha:1-progress});}
      if(f.type==='hit'&&progress<.4){g.rect(f.x-12,f.y-1,24,3).fill(C.cream);g.rect(f.x-1,f.y-12,3,24).fill(C.cream);}
    }
  }
  pixelText(text,x,y,color,alpha){
    const letters={'0':['111','101','101','101','111'],'1':['010','110','010','010','111'],'2':['111','001','111','100','111'],'3':['111','001','111','001','111'],'4':['101','101','111','001','001'],'5':['111','100','111','001','111'],'6':['111','100','111','101','111'],'7':['111','001','010','010','010'],'8':['111','101','111','101','111'],'9':['111','101','111','001','111'],'-':['000','000','111','000','000'],'М':['10001','11011','10101','10001','10001'],'И':['1001','1001','1011','1101','1001'],'О':['111','101','101','101','111'],'Щ':['10101','10101','10101','11111','00001'],'Т':['111','010','010','010','010']};
    letters['.']=['0','0','0','0','1'];letters['!']=['1','1','1','0','1'];
    const chars=[...text],width=chars.reduce((sum,ch)=>sum+((letters[ch]?.[0].length||3)+1)*2,0);let cursor=Math.round(x-width/2);
    for(const ch of chars){const rows=letters[ch]||letters['-'];rows.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1')this.effects.rect(cursor+i*2,Math.round(y)+j*2,2,2).fill({color,alpha});}));cursor+=(rows[0].length+1)*2;}
  }
}
