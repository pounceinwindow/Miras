export const HEROES = {
  su_anasy: {name:'Су анасы', title:'Хранительница воды', hp:120, damage:8, interval:1.35, color:0x57d9dc,
    abilities:[{name:'Обратная волна', short:'Волна', icon:'≈', cooldown:8, description:'Снимает удержание. Отражает снаряды 1,6 с и наносит 14 урона по своему руслу.'}, {name:'Золотой гребень', short:'Гребень', icon:'⋔',cooldown:7,description:'Через 0,8 с наносит 18 урона в отмеченном русле и удерживает цель 2 с.'}]},
  kremlin: {name:'Керемль',title:'Белокаменный хранитель',hp:144,damage:9,interval:1.55,color:0xe9c879,
    abilities:[{name:'Белокаменная стена',short:'Стена',icon:'▥',cooldown:9,description:'Щит на 32 урона на 4 с. Запрещает себе движение на 2 с. Умения доступны.'},{name:'Печать ворот',short:'Печать',icon:'◇',cooldown:7.5,description:'Через 1,6 с наносит 24 наземного урона и закрывает вход в русло на 4 с. Если ворота захлопнутся на цели, она не сможет двигаться до их исчезновения.'}]},
  shurale: {name:'Шурале',title:'Лесной хитрец',hp:124,damage:9,interval:1.4,color:0x9ab967,
    abilities:[{name:'Щекотка',short:'Щекотка',icon:'⌁',cooldown:7,description:'Через 1,4 с удерживает цель в отмеченном русле на 2 с. Не наносит урон.'},{name:'Лесной морок',short:'Морок',icon:'♧',cooldown:9,description:'На 3 с защищает от обычных снарядов. Умения проходят сквозь морок.'}]},
  syuyumbike: {name:'Сююмбике',title:'Воля ханбике',hp:128,damage:8,interval:1.4,color:0xe5a8c1,
    abilities:[{name:'Воля ханбике',short:'Воля',icon:'♜',cooldown:8,description:'Снимает удержание и даёт щит на 22 урона на 4 с.'},{name:'Глас Казани',short:'Глас',icon:'◈',cooldown:9,description:'Через 1,5 с наносит 20 урона по двум руслам. На 4 с вдвое ослабляет автоатаку попавшей под удар цели.'}]},
};
const other=id=>id==='player'?'enemy':'player';
const affects=(attack,lane)=>(attack.lanes??[attack.lane]).includes(lane);
function entity(id,hero){return {id,hero,hp:HEROES[hero].hp,maxHp:HEROES[hero].hp,lane:1,fromLane:1,moveStart:0,movingUntil:0,nextMove:0,rootUntil:0,gateTrapUntil:0,reflectUntil:0,mistUntil:0,weakenUntil:0,shield:0,shieldUntil:0,cooldowns:[0,0],nextAuto:0.9,pose:'idle',poseUntil:0};}
export class Battle {
  constructor({player='su_anasy',enemy='kremlin',bonus=false,random=Math.random,ai=true}={}){
    this.entities={player:entity('player',player),enemy:entity('enemy',enemy)};
    if(bonus){this.entities.enemy.hp=Math.floor(this.entities.enemy.hp*0.9);this.entities.enemy.maxHp=this.entities.enemy.hp;}
    this.time=0;this.limit=90;this.status='ready';this.result=null;this.events=[];this.pending=[];this.projectiles=[];this.closed={player:[0,0,0],enemy:[0,0,0]};this.serial=0;this.random=random;this.ai=ai;this.nextThink=.6;this.stats={damage:0,reflections:0,dodges:0};
  }
  emit(type,detail={}){const event={type,time:this.time,...detail};this.events.push(event);return event;}
  drain(){return this.events.splice(0);}
  start(){if(this.status==='ready'){this.status='playing';this.emit('START');}}
  pause(){if(this.status==='playing'){this.status='paused';this.emit('PAUSE');}}
  resume(){if(this.status==='paused'){this.status='playing';this.emit('RESUME');}}
  setPose(e,pose,duration){e.pose=pose;e.poseUntil=this.time+duration;}
  move(id,lane){
    const e=this.entities[id];if(this.status!=='playing'||!Number.isInteger(lane)||lane<0||lane>2||e.hp<=0||lane===e.lane)return false;
    if(e.gateTrapUntil>this.time){if(id==='player')this.emit('BLOCKED',{reason:'Ворота удерживают: умения доступны'});return false;}
    if(e.rootUntil>this.time){if(id==='player')this.emit('BLOCKED',{reason:'Удержание: умения доступны'});return false;}
    if(e.nextMove>this.time)return false;
    if(this.closed[id][lane]>this.time){if(id==='player')this.emit('BLOCKED',{reason:'Вход закрыт. Выберите другое русло'});return false;}
    e.fromLane=e.lane;e.lane=lane;e.moveStart=this.time;e.movingUntil=this.time+.24;e.nextMove=this.time+.3;this.emit('MOVE',{id,from:e.fromLane,lane});return true;
  }
  canCast(id,slot){const e=this.entities[id];return this.status==='playing'&&e.hp>0&&Number.isInteger(slot)&&slot>=0&&slot<2&&e.cooldowns[slot]<=this.time;}
  cast(id,slot){
    if(!this.canCast(id,slot))return false;
    const e=this.entities[id],target=this.entities[other(id)],ability=HEROES[e.hero].abilities[slot];
    e.cooldowns[slot]=this.time+ability.cooldown;this.setPose(e,'cast',.7);e.nextAuto=Math.max(e.nextAuto,this.time+.7);
    this.emit('CAST',{id,hero:e.hero,slot,lane:e.lane,name:ability.name});
    if(e.hero==='su_anasy'&&slot===0){
      e.rootUntil=0;e.reflectUntil=this.time+1.6;
      this.pending.push({uid:++this.serial,kind:'wave',source:id,target:target.id,lane:e.lane,created:this.time,due:this.time+.3,damage:14,ground:true});
    }else if(e.hero==='su_anasy'){
      this.pending.push({uid:++this.serial,kind:'comb',source:id,target:target.id,lane:target.lane,created:this.time,due:this.time+.8,damage:18,root:2,ground:false});
    }else if(e.hero==='shurale'){
      if(slot===0)this.pending.push({uid:++this.serial,kind:'tickle',source:id,target:target.id,lane:target.lane,created:this.time,due:this.time+1.4,damage:0,root:2,ground:true});
      else {e.mistUntil=this.time+3;this.emit('MIST',{id});}
    }else if(e.hero==='syuyumbike'){
      if(slot===0){e.rootUntil=0;e.shield=22;e.shieldUntil=this.time+4;this.emit('SHIELD',{id,amount:22});}
      else this.pending.push({uid:++this.serial,kind:'voice',source:id,target:target.id,lanes:[target.lane,(target.lane+1)%3],created:this.time,due:this.time+1.5,damage:20,weaken:4,ground:true});
    }else if(slot===0){e.shield=32;e.shieldUntil=this.time+4;e.rootUntil=Math.max(e.rootUntil,this.time+2);this.emit('SHIELD',{id,amount:32});}
    else this.pending.push({uid:++this.serial,kind:'seal',source:id,target:target.id,lane:target.lane,created:this.time,due:this.time+1.6,damage:24,ground:true});
    return true;
  }
  hurt(id,damage,source,{root=0,weaken=0,kind='auto',lane}={}){
    const e=this.entities[id];if(e.hp<=0)return;
    const shield=e.shieldUntil>this.time?e.shield:0,absorbed=Math.min(shield,damage);e.shield=Math.max(0,shield-absorbed);const actual=Math.min(e.hp,damage-absorbed);e.hp-=actual;
    if(root&&e.hp>0)e.rootUntil=Math.max(e.rootUntil,this.time+root);
    if(weaken&&e.hp>0)e.weakenUntil=Math.max(e.weakenUntil,this.time+weaken);
    if(e.hp>0)this.setPose(e,'hit',.28);else this.setPose(e,'defeat',Infinity);
    if(source==='player')this.stats.damage+=actual;
    this.emit('HIT',{id,source,damage:actual,absorbed,kind,lane:lane??e.lane,root,weaken});
  }
  resolve(a){
    if(a.kind==='seal'){
      this.closed[a.target][a.lane]=this.time+4;
      const trapped=this.entities[a.target].lane===a.lane&&this.entities[a.target].movingUntil<=this.time;
      if(trapped)this.entities[a.target].gateTrapUntil=this.closed[a.target][a.lane];
      this.emit('CLOSE',{id:a.target,lane:a.lane,trapped});
    }
    const target=this.entities[a.target];
    for(const lane of a.lanes??[a.lane])this.emit('IMPACT',{...a,lane,id:a.target});
    if(!affects(a,target.lane)||target.movingUntil>this.time){if(a.target==='player')this.stats.dodges++;this.emit('MISS',{id:a.target,lane:target.lane});return;}
    if(a.kind==='auto'&&target.mistUntil>this.time){this.emit('ABSORB',{id:target.id,lane:target.lane});return;}
    if(!a.ground&&target.reflectUntil>this.time&&!a.reflected){
      this.emit('REFLECT',{id:target.id,lane:a.lane});if(target.id==='player')this.stats.reflections++;
      this.projectiles.push({uid:++this.serial,kind:a.kind,source:target.id,target:a.source,lane:a.lane,created:this.time,due:this.time+.45,damage:a.damage,root:a.root,reflected:true});return;
    }
    this.hurt(a.target,a.damage,a.source,a);
  }
  think(){
    const e=this.entities.enemy,p=this.entities.player,t=this.time;
    // Respond only to visible telegraphs, with a reaction window; never inspect future inputs.
    const danger=this.pending.find(a=>a.target==='enemy'&&affects(a,e.lane)&&a.due-t<.65&&a.due-t>.16);
    if(e.rootUntil>t&&['su_anasy','syuyumbike'].includes(e.hero)&&this.canCast('enemy',0)){this.cast('enemy',0);return;}
    if(danger){const safe=[0,1,2].filter(l=>l!==e.lane&&this.closed.enemy[l]<=t&&!this.pending.some(a=>a.target==='enemy'&&affects(a,l)));if(safe.length&&this.random()<.65){this.move('enemy',safe[Math.floor(this.random()*safe.length)]);return;}}
    const offense=e.hero==='shurale'?0:1,defense=1-offense;
    if(this.canCast('enemy',offense)&&this.random()<.55){this.cast('enemy',offense);return;}
    const defend=['kremlin','syuyumbike'].includes(e.hero)?e.hp<e.maxHp*.85:e.lane===p.lane;
    if(this.canCast('enemy',defense)&&defend&&this.random()<.6){this.cast('enemy',defense);return;}
    if(e.lane!==p.lane&&this.random()<.7)this.move('enemy',p.lane);
    else if(this.random()<.12)this.move('enemy',Math.floor(this.random()*3));
  }
  finish(){
    const p=this.entities.player,e=this.entities.enemy;
    if(p.hp<=0||e.hp<=0){this.result=p.hp<=0&&e.hp<=0?'draw':e.hp<=0?'win':'lose';}
    else if(this.time>=this.limit){const diff=p.hp/p.maxHp-e.hp/e.maxHp;this.result=Math.abs(diff)<.00001?'draw':diff>0?'win':'lose';}
    if(this.result){this.status='finished';this.pending=[];this.projectiles=[];this.emit('FINISH',{result:this.result,timeout:p.hp>0&&e.hp>0});}
  }
  step(dt){
    if(this.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;
    // Bounded fixed substeps make gameplay independent of animation/render speed.
    let remaining=Math.min(dt,.25);
    while(remaining>0&&this.status==='playing'){const delta=Math.min(remaining,1/60);remaining-=delta;this.tick(delta);}
  }
  tick(dt){
    this.time=Math.min(this.limit,this.time+dt);
    for(const e of Object.values(this.entities)){
      if(e.shieldUntil<=this.time)e.shield=0;
      if(e.poseUntil<=this.time&&e.hp>0)e.pose='idle';
    }
    if(this.ai&&this.time>=this.nextThink){this.nextThink=this.time+.38+this.random()*.28;this.think();}
    const due=this.pending.filter(a=>a.due<=this.time);this.pending=this.pending.filter(a=>a.due>this.time);
    const shots=this.projectiles.filter(a=>a.due<=this.time);this.projectiles=this.projectiles.filter(a=>a.due>this.time);
    for(const a of [...due,...shots])this.resolve(a);
    this.finish();if(this.status!=='playing')return;
    for(const e of Object.values(this.entities)){
      const target=this.entities[other(e.id)],config=HEROES[e.hero];
      if(e.lane===target.lane&&e.movingUntil<=this.time&&target.movingUntil<=this.time&&e.nextAuto<=this.time&&e.pose!=='cast'){
        e.nextAuto=this.time+config.interval;this.setPose(e,'attack',.38);
        const shot={uid:++this.serial,kind:'auto',source:e.id,target:target.id,lane:e.lane,created:this.time,due:this.time+.48,damage:config.damage*(e.weakenUntil>this.time?.5:1)};this.projectiles.push(shot);this.emit('ATTACK',{id:e.id,lane:e.lane});
      }
    }
  }
}
