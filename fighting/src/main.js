import './style.css';
import { Battle, HEROES } from './engine.js';
import { BattleRenderer, ASSET_URLS } from './renderer.js';

const $=selector=>document.querySelector(selector);
const app=$('#app');
app.innerHTML=`
<main class="game-shell">
  <header class="masthead"><div class="brand-mark" aria-hidden="true">Ⅲ</div><div><h1>ТРИ РУСЛА</h1><p>ХРАНИТЕЛИ · PvE</p></div><div class="header-actions"><button class="icon-button" id="sound" aria-label="Включить звук" title="Звук выключен">♪</button><button class="icon-button" id="menu" aria-label="Пауза и меню">Ⅱ</button></div></header>
  <section class="combatant enemy-panel" aria-label="Противник"><img id="enemy-portrait" alt=""><div class="combatant-info"><div class="name-row"><span id="enemy-name">Керемль</span><small>СОПЕРНИК</small></div><div class="hp-track"><div id="enemy-bar" class="hp-fill enemy-fill"></div><div id="enemy-shield" class="shield-fill"></div></div><div class="health-meta"><span id="enemy-hp"></span><span id="enemy-status"></span></div></div><div class="timer"><strong id="timer">90</strong><small>СЕК</small></div></section>
  <section class="arena" id="arena"><div class="arena-caption"><span>Ⅰ</span><span>Ⅱ</span><span>Ⅲ</span></div><div class="load-panel" id="loading"><span class="loading-emblem">Ⅲ</span><p id="loading-message">Пробуждаем хранителей…</p><progress id="load-progress" max="1" value="0"></progress></div><div class="toast" id="toast" role="status"></div></section>
  <div class="lane-controls" role="group" aria-label="Выберите русло"><button data-lane="0"><span>Ⅰ</span><small>ЛЕВОЕ</small></button><button data-lane="1"><span>Ⅱ</span><small>СРЕДНЕЕ</small></button><button data-lane="2"><span>Ⅲ</span><small>ПРАВОЕ</small></button></div>
  <section class="combatant player-panel" aria-label="Ваш хранитель"><img id="player-portrait" alt=""><div class="combatant-info"><div class="name-row"><span id="player-name">Су анасы</span><small>ВЫ</small></div><div class="hp-track"><div id="player-bar" class="hp-fill"></div><div id="player-shield" class="shield-fill"></div></div><div class="health-meta"><span id="player-hp"></span><span id="player-status"></span></div></div></section>
  <div class="abilities"><button class="ability" data-ability="0"><span class="ability-symbol"></span><span class="ability-copy"><strong></strong><small></small></span><span class="ability-key">Q</span><span class="cooldown"></span></button><button class="ability" data-ability="1"><span class="ability-symbol"></span><span class="ability-copy"><strong></strong><small></small></span><span class="ability-key">E</span><span class="cooldown"></span></button></div>
  <footer class="game-footer"><span id="battle-hint">Одно русло — автоматическая атака</span><button id="rules-button">Правила</button></footer>
</main>
<aside class="desktop-note"><span class="eyebrow">ТАТАР.БУ / ИГРОВОЙ ПРОТОТИП</span><h2>Выбери русло.<br>Измени исход.</h2><p>Четыре хранителя, три позиции.<br>Девяносто секунд на победу.</p><div class="key-guide"><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><span>сменить русло</span></div><div class="key-guide"><kbd>Q</kbd><kbd>E</kbd><span>применить умения</span></div><button class="text-button" id="atlas-button">Смотреть все спрайты ↗</button><p class="small-note">Локальная тренировка · без PvP</p></aside>
<dialog id="pause-dialog" class="panel-dialog"><div class="dialog-eyebrow">ВРЕМЯ ОСТАНОВЛЕНО</div><h2>Пауза</h2><p id="pause-reason" class="dialog-description">Можно перевести дух.</p><button class="primary-button" id="resume">Продолжить бой</button><button class="text-button" id="pause-rules">Как играть</button></dialog>
<dialog id="result-dialog" class="panel-dialog"><div class="result-mark" id="result-mark">✦</div><div class="dialog-eyebrow">ДУЭЛЬ ЗАВЕРШЕНА</div><h2 id="result-title"></h2><p id="result-description" class="dialog-description"></p><div class="result-stats"><div><strong id="stat-damage"></strong><small>УРОНА</small></div><div><strong id="stat-dodges"></strong><small>УКЛОНЕНИЙ</small></div><div><strong id="stat-reflect"></strong><small>ОТРАЖЕНИЙ</small></div></div><button class="primary-button" id="rematch">Ещё бой</button></dialog>
<dialog id="rules-dialog" class="panel-dialog"><div class="dialog-eyebrow">ТРИ РУСЛА</div><h2>Два решения.<br>Много возможностей.</h2><div class="rules-list"><p><b>Двигайтесь.</b> Нажмите на русло или кнопку Ⅰ / Ⅱ / Ⅲ. Обычные снаряды летят автоматически, когда хранители стоят напротив друг друга.</p><p><b>Следите за предупреждениями.</b> Красное русло и таймер — вражеское умение. Золотое — ваше. Уйдите до попадания.</p><p><b>Удержание ≠ запрет умений.</b> Даже если движение запрещено, можно применить способность. Волна Су анасы и Воля ханбике снимают удержание.</p><p><b>Закрытые ворота.</b> Выйти из закрытого русла можно, войти обратно — нельзя до окончания таймера.</p><p><b>90 секунд.</b> Побеждает тот, кто первым обнулит здоровье врага. По времени сравнивается доля оставшегося здоровья.</p><p><b>Смена стороны.</b> В меню выберите «Поменять героев»: начнётся новая дуэль за другого хранителя.</p></div><button class="primary-button" id="close-rules">Понятно</button></dialog>
<dialog id="atlas-dialog" class="atlas-dialog"><div class="atlas-header"><div><div class="dialog-eyebrow">40 ИСХОДНЫХ СПРАЙТОВ</div><h2>Все грани хранителей</h2></div><button class="icon-button" id="close-atlas" aria-label="Закрыть атлас">×</button></div><div id="atlas-content"></div><p class="small-note">В бою: снизу — вид со спины, сверху — вид спереди. Оба умения используют cast.</p></dialog>`;

const battleParams=new URLSearchParams(window.location.search),requestedHero=battleParams.get('player'),requestedEnemy=battleParams.get('enemy');
let playerHero=Object.hasOwn(HEROES,requestedHero)?requestedHero:'su_anasy',enemyHero=Object.hasOwn(HEROES,requestedEnemy)&&requestedEnemy!==playerHero?requestedEnemy:playerHero==='kremlin'?'shurale':'kremlin',battle=new Battle(),renderer,loaded=false,returnDialog=null,soundOn=false,audio=null,resultTimer=null,toastTimer=null;
const stateNames={idle:'Ожидание',attack:'Атака',cast:'Умение',hit:'Попадание',defeat:'Поражение'};
const portraits=(hero,face='front',pose='idle')=>ASSET_URLS[`/${hero}/${face}/${pose}.png`];
const abilityHints={su_anasy:['Отражение + очищение','Урон + удержание'],kremlin:['Щит · 32 урона','Урон + закрытие'],shurale:['Удержание · 2 с','Защита от автоатак'],syuyumbike:['Очищение + щит 22','Два русла + ослабление']};
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2100);}
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
function playSound(type){
  if(!soundOn||!audio)return;const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type='square';
  const frequency={ATTACK:310,HIT:130,CAST:560,REFLECT:880,FINISH:660,MOVE:220}[type];if(!frequency)return;
  oscillator.frequency.setValueAtTime(frequency,audio.currentTime);oscillator.frequency.exponentialRampToValueAtTime(frequency*.55,audio.currentTime+.09);gain.gain.setValueAtTime(.018,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.12);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+.13);
}
function updateSelection(){
  for(const [id,hero]of [['player',playerHero],['enemy',enemyHero]]){$(`#${id}-name`).textContent=HEROES[hero].name;$(`#${id}-portrait`).src=portraits(hero);}
  document.querySelectorAll('[data-ability]').forEach((button,i)=>{const a=HEROES[playerHero].abilities[i];button.querySelector('strong').textContent=a.short;button.querySelector('.ability-symbol').textContent=a.icon;button.querySelector('.ability-copy small').textContent=abilityHints[playerHero][i];button.setAttribute('aria-label',`${a.name}. ${a.description}`);button.title=a.description;});
}
function configure(){clearTimeout(resultTimer);closeDialogs();battle=new Battle({player:playerHero,enemy:enemyHero});renderer?.reset();updateSelection();updateHUD();}
function swap(){[playerHero,enemyHero]=[enemyHero,playerHero];battle=new Battle({player:playerHero,enemy:enemyHero});renderer?.reset();updateSelection();updateHUD();}
function start(){if(!loaded)return;clearTimeout(resultTimer);closeDialogs();battle=new Battle({player:playerHero,enemy:enemyHero});renderer.reset();battle.start();updateHUD();audio?.resume();}
function pause(reason='Можно перевести дух.'){
  if(battle.status!=='playing')return;battle.pause();$('#pause-reason').textContent=reason;if(!document.querySelector('dialog[open]'))$('#pause-dialog').showModal();
}
function openSub(dialog){const current=document.querySelector('dialog[open]');returnDialog=current?.id||null;if(!current&&battle.status==='playing'){battle.pause();returnDialog='pause-dialog';}current?.close();$(dialog).showModal();}
function closeSub(dialog){$(dialog).close();if(returnDialog)$(`#${returnDialog}`).showModal();returnDialog=null;}
function statuses(e){const result=[];if(e.rootUntil>battle.time)result.push('Удержание '+(e.rootUntil-battle.time).toFixed(1)+'с');if(e.shield>0)result.push('Щит '+Math.ceil(e.shield));if(e.reflectUntil>battle.time)result.push('Отражение');if(e.mistUntil>battle.time)result.push('Морок '+(e.mistUntil-battle.time).toFixed(1)+'с');if(e.weakenUntil>battle.time)result.push('Автоатака −50%');return result.join(' · ');}
function updateHUD(){
  const active=battle.status==='playing';
  $('#timer').textContent=Math.ceil(battle.limit-battle.time);$('.timer').classList.toggle('urgent',battle.time>75);
  for(const id of ['player','enemy']){const e=battle.entities[id];$(`#${id}-bar`).style.width=`${e.hp/e.maxHp*100}%`;$(`#${id}-shield`).style.width=`${Math.min(100,e.shield/e.maxHp*100)}%`;$(`#${id}-hp`).textContent=`${Math.ceil(e.hp)} / ${e.maxHp}`;$(`#${id}-status`).textContent=statuses(e);}
  const p=battle.entities.player;
  document.querySelectorAll('[data-lane]').forEach(button=>{const lane=Number(button.dataset.lane),closed=battle.closed.player[lane]>battle.time,root=p.rootUntil>battle.time;button.disabled=!active||root||closed&&lane!==p.lane;button.classList.toggle('selected',p.lane===lane);button.classList.toggle('closed',closed);button.setAttribute('aria-pressed',String(p.lane===lane));button.setAttribute('aria-label',`${['Левое','Среднее','Правое'][lane]} русло${closed?', вход закрыт':''}${root?', движение удерживается':''}`);});
  document.querySelectorAll('[data-ability]').forEach((button,i)=>{const remaining=Math.max(0,p.cooldowns[i]-battle.time);button.disabled=!active||remaining>0;button.querySelector('.cooldown').textContent=remaining>0?remaining.toFixed(1):'';button.style.setProperty('--cooldown',`${remaining/HEROES[p.hero].abilities[i].cooldown*100}%`);});
  $('#battle-hint').textContent=battle.status==='paused'?'Бой на паузе':p.rootUntil>battle.time?'Движение запрещено · умения доступны':p.reflectUntil>battle.time?'Волна отражает снаряды, но не наземные атаки':'Одно русло — автоматическая атака';
}
function showResult(event){
  if(battle.status!=='finished')return;closeDialogs();
  $('#result-title').textContent={win:'Ваша победа',lose:'Ещё одна попытка?',draw:'Равные силы'}[event.result];$('#result-mark').textContent=event.result==='win'?'✦':event.result==='draw'?'◇':'↻';
  $('#result-description').textContent=event.timeout?'Время вышло. Итог — по доле оставшегося здоровья.':event.result==='win'?'Русла на вашей стороне. Попробуете другого хранителя?':'Изучите предупреждения и используйте защиту вовремя.';
  $('#stat-damage').textContent=battle.stats.damage;$('#stat-dodges').textContent=battle.stats.dodges;$('#stat-reflect').textContent=battle.stats.reflections;$('#result-dialog').showModal();
}
$('#rematch').onclick=start;
$('#resume').onclick=()=>{if(document.hidden||!navigator.onLine){$('#pause-reason').textContent='Вернитесь в игру и восстановите соединение.';return;}$('#pause-dialog').close();battle.resume();};
$('#menu').onclick=()=>{if(battle.status==='playing')pause();else if(battle.status==='paused')$('#pause-dialog').showModal();};
$('#rules-button').onclick=()=>openSub('#rules-dialog');$('#pause-rules').onclick=()=>openSub('#rules-dialog');$('#close-rules').onclick=()=>closeSub('#rules-dialog');
for(const id of ['atlas-button','pause-atlas']){const el=$('#'+id);if(el)el.onclick=()=>openSub('#atlas-dialog');}
$('#close-atlas').onclick=()=>closeSub('#atlas-dialog');
$('#atlas-content').innerHTML=Object.entries(HEROES).map(([hero,config])=>`<section class="atlas-section"><h3>${config.name}</h3>${['front','back'].map(face=>`<p class="atlas-facing">${face==='front'?'СПЕРЕДИ · СОПЕРНИК':'СЗАДИ · ВАШ ГЕРОЙ'}</p><div class="sprite-grid">${Object.entries(stateNames).map(([state,label])=>`<figure><img loading="lazy" src="${portraits(hero,face,state)}" alt="${config.name}: ${label}, ${face==='front'?'спереди':'сзади'}"><figcaption>${label}<small>${state}</small></figcaption></figure>`).join('')}</div>`).join('')}</section>`).join('');
document.querySelectorAll('[data-lane]').forEach(button=>button.onclick=()=>battle.move('player',Number(button.dataset.lane)));
document.querySelectorAll('[data-ability]').forEach(button=>button.onclick=()=>battle.cast('player',Number(button.dataset.ability)));
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('cancel',event=>{event.preventDefault();if(dialog.id==='atlas-dialog'||dialog.id==='rules-dialog')closeSub('#'+dialog.id);else if(dialog.id==='pause-dialog')$('#resume').click();}));
document.addEventListener('keydown',event=>{
  if(event.repeat||event.altKey||event.ctrlKey||event.metaKey)return;if(event.code==='Escape'&&!document.querySelector('dialog[open]')){pause();return;}if(document.querySelector('dialog[open]'))return;
  if(['Digit1','Digit2','Digit3'].includes(event.code)){event.preventDefault();battle.move('player',Number(event.code.slice(-1))-1);}
  if(event.code==='ArrowLeft'||event.code==='ArrowRight'){event.preventDefault();battle.move('player',battle.entities.player.lane+(event.code==='ArrowLeft'?-1:1));}
  if(event.code==='KeyQ'||event.code==='KeyE'){event.preventDefault();battle.cast('player',event.code==='KeyQ'?0:1);}
  if(event.code==='Space'){event.preventDefault();pause();}
});
$('#sound').onclick=async()=>{soundOn=!soundOn;$('#sound').classList.toggle('enabled',soundOn);$('#sound').setAttribute('aria-label',soundOn?'Выключить звук':'Включить звук');$('#sound').title=soundOn?'Звук включён':'Звук выключен';if(soundOn){const Audio=window.AudioContext||window.webkitAudioContext;if(Audio){audio??=new Audio();await audio.resume();playSound('CAST');}}};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('Бой остановлен, пока вы были вне игры.');});
let offlineTimer;window.addEventListener('offline',()=>{offlineTimer=setTimeout(()=>pause('Нет соединения. Бой сохранён на паузе.'),1500);});window.addEventListener('online',()=>clearTimeout(offlineTimer));
updateSelection();updateHUD();
try{
  renderer=new BattleRenderer($('#arena'),lane=>battle.move('player',lane));
  await renderer.init(progress=>{$('#load-progress').value=progress;});loaded=true;$('#loading').hidden=true;
  let lastTime=performance.now(),lastHUD=0;
  const loop=now=>{const delta=(now-lastTime)/1000;lastTime=now;if(delta>1.5&&battle.status==='playing')pause('Бой приостановлен после перерыва.');battle.step(delta);
    for(const event of battle.drain()){renderer.event(event,battle);playSound(event.type);if(event.type==='BLOCKED')toast(event.reason);if(event.type==='FINISH'){clearTimeout(resultTimer);resultTimer=setTimeout(()=>showResult(event),1200);}}
    renderer.draw(battle,battle.status==='paused'?0:Math.min(delta,.05));if(now-lastHUD>50){updateHUD();lastHUD=now;}requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);start();
  // Read-only diagnostic snapshot for local acceptance tests; gameplay has no test shortcuts.
  window.__battleSnapshot=()=>({status:battle.status,time:battle.time,result:battle.result,player:{...battle.entities.player},enemy:{...battle.entities.enemy},sprites:{...renderer.spriteStates},assets:Object.keys(renderer.textures).length});
}catch(error){console.error(error);$('#loading-message').textContent='Не удалось загрузить игру. Обновите страницу в браузере с WebGL.';$('#load-progress').hidden=true;}
