import './style.css';
import { ABILITY_ART } from './visual-spec.js';
import { Battle, HEROES } from './engine.js';
import { BattleRenderer, ASSET_URLS, EFFECT_URLS } from './renderer.js';
import { PvpConnection, createRoomCode, isPvpConfigured } from './pvp.js';

const $=selector=>document.querySelector(selector);
const battleParams=new URLSearchParams(window.location.search),isPvp=battleParams.get('mode')==='pvp',requestedHero=battleParams.get('player'),requestedEnemy=battleParams.get('enemy'),bonus=battleParams.get('bonus')==='true';
const app=$('#app');
app.innerHTML=`
<main class="game-shell">
  <header class="masthead"><div class="header-actions"><button class="icon-button" id="sound" aria-label="Включить звук" title="Звук выключен">♪</button><button class="icon-button" id="menu" aria-label="Пауза и меню">Ⅱ</button></div><button class="icon-button fullscreen-button" id="fullscreen" aria-label="На весь экран" title="На весь экран">⛶</button></header>
  <section class="combatant enemy-panel" aria-label="Противник"><img id="enemy-portrait" alt=""><div class="combatant-info"><div class="name-row"><span id="enemy-name">Керемль</span><small>СОПЕРНИК</small></div><div class="hp-track"><div id="enemy-bar" class="hp-fill enemy-fill"></div><div id="enemy-shield" class="shield-fill"></div></div><div class="health-meta"><span id="enemy-hp"></span><span id="enemy-status"></span></div></div><div class="timer"><strong id="timer">90</strong><small>СЕК</small></div></section>
  <section class="arena" id="arena"><div class="arena-caption"><span>Ⅰ</span><span>Ⅱ</span><span>Ⅲ</span></div><div class="load-panel" id="loading"><span class="loading-emblem">Ⅲ</span><p id="loading-message">Пробуждаем хранителей…</p><progress id="load-progress" max="1" value="0"></progress></div><div class="toast" id="toast" role="status"></div></section>
  <div class="lane-controls" role="group" aria-label="Выберите русло"><button data-lane="0"><span>Ⅰ</span><small>ЛЕВОЕ</small></button><button data-lane="1"><span>Ⅱ</span><small>СРЕДНЕЕ</small></button><button data-lane="2"><span>Ⅲ</span><small>ПРАВОЕ</small></button></div>
  <section class="combatant player-panel" aria-label="Ваш хранитель"><img id="player-portrait" alt=""><div class="combatant-info"><div class="name-row"><span id="player-name">Су анасы</span><small>ВЫ</small></div><div class="hp-track"><div id="player-bar" class="hp-fill"></div><div id="player-shield" class="shield-fill"></div></div><div class="health-meta"><span id="player-hp"></span><span id="player-status"></span></div></div></section>
  <div class="abilities"><button class="ability" data-ability="0"><img class="ability-symbol" alt=""><span class="ability-copy"><strong></strong><small></small></span><span class="ability-key">Q</span><span class="cooldown"></span></button><button class="ability" data-ability="1"><img class="ability-symbol" alt=""><span class="ability-copy"><strong></strong><small></small></span><span class="ability-key">E</span><span class="cooldown"></span></button></div>
  <footer class="game-footer"><span id="battle-hint">Одно русло — автоматическая атака</span><button id="rules-button">Правила</button></footer>
</main>
<aside class="desktop-note"><span class="eyebrow">ТАТАР.БУ / ИГРОВОЙ ПРОТОТИП</span><h2>Выбери русло.<br>Измени исход.</h2><p>Четыре хранителя, три позиции.<br>Девяносто секунд на победу.</p><div class="key-guide"><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><span>сменить русло</span></div><div class="key-guide"><kbd>Q</kbd><kbd>E</kbd><span>применить умения</span></div><button class="text-button" id="atlas-button">Смотреть все спрайты ↗</button><p class="small-note">Локальная тренировка · без PvP</p></aside>
<dialog id="pause-dialog" class="panel-dialog"><div class="dialog-eyebrow">ВРЕМЯ ОСТАНОВЛЕНО</div><h2>Пауза</h2><p id="pause-reason" class="dialog-description">Можно перевести дух.</p><button class="primary-button" id="resume">Продолжить бой</button><button class="text-button" id="pause-rules">Как играть</button></dialog>
<dialog id="result-dialog" class="panel-dialog"><div class="result-mark" id="result-mark">✦</div><div class="dialog-eyebrow">ДУЭЛЬ ЗАВЕРШЕНА</div><h2 id="result-title"></h2><p id="result-description" class="dialog-description"></p><blockquote class="result-quote" id="result-quote" hidden><img class="result-quote-portrait" id="result-quote-portrait" alt=""><div class="result-quote-bubble"><p id="result-quote-tatar" lang="tt"></p><footer id="result-quote-russian"></footer></div></blockquote><div class="result-stats"><div><strong id="stat-damage"></strong><small>УРОНА</small></div><div><strong id="stat-dodges"></strong><small>УКЛОНЕНИЙ</small></div><div><strong id="stat-reflect"></strong><small>ОТРАЖЕНИЙ</small></div></div><button class="primary-button" id="rematch">Ещё бой</button></dialog>
<dialog id="rules-dialog" class="panel-dialog"><div class="dialog-eyebrow">ТРИ РУСЛА</div><h2>Два решения.<br>Много возможностей.</h2><div class="rules-list"><p><b>Двигайтесь.</b> Нажмите на русло или кнопку Ⅰ / Ⅱ / Ⅲ. Обычные снаряды летят автоматически, когда хранители стоят напротив друг друга.</p><p><b>Следите за предупреждениями.</b> Красное русло и таймер — вражеское умение. Золотое — ваше. Уйдите до попадания.</p><p><b>Удержание ≠ запрет умений.</b> Даже если движение запрещено, можно применить способность. Волна Су анасы и Воля ханбике снимают удержание.</p><p><b>Закрытые ворота.</b> Они закрывают вход в русло на 4 секунды. Если захлопнулись на хранителе, удерживают его до исчезновения; умения остаются доступны.</p><p><b>90 секунд.</b> Побеждает тот, кто первым обнулит здоровье врага. По времени сравнивается доля оставшегося здоровья.</p><p><b>Смена стороны.</b> В меню выберите «Поменять героев»: начнётся новая дуэль за другого хранителя.</p></div><button class="primary-button" id="close-rules">Понятно</button></dialog>
<dialog id="atlas-dialog" class="atlas-dialog"><div class="atlas-header"><div><div class="dialog-eyebrow">40 ИСХОДНЫХ СПРАЙТОВ</div><h2>Все грани хранителей</h2></div><button class="icon-button" id="close-atlas" aria-label="Закрыть атлас">×</button></div><div id="atlas-content"></div><p class="small-note">В бою: снизу — вид со спины, сверху — вид спереди. Оба умения используют cast.</p></dialog>`;

let playerHero=Object.hasOwn(HEROES,requestedHero)?requestedHero:'su_anasy',enemyHero=Object.hasOwn(HEROES,requestedEnemy)&&requestedEnemy!==playerHero?requestedEnemy:playerHero==='kremlin'?'shurale':'kremlin',battle=new Battle(),renderer,loaded=false,returnDialog=null,soundOn=false,audio=null,resultTimer=null,toastTimer=null,lastResult=null;
let pvpConnection=null,pvpRole=null,pvpMatched=false,lastNetworkState=0,networkEvents=[];
const stateNames={idle:'Ожидание',attack:'Атака',cast:'Умение',hit:'Попадание',defeat:'Поражение'};
const portraits=(hero,face='front',pose='idle')=>ASSET_URLS[`/${hero}/${face}/${pose}.png`];
const abilityHints={su_anasy:['Отражение + очищение','Урон + удержание'],kremlin:['Щит · 32 урона','Урон + закрытие'],shurale:['Удержание · 2 с','Защита от автоатак'],syuyumbike:['Очищение + щит 22','Два русла + ослабление']};
const defeatLines={
  su_anasy:{tatar:'Көчеңне таныдым. Алда безне уртак юл көтә.',russian:'Я признаю твою силу. Впереди нас ждёт общий путь.'},
  kremlin:{tatar:'Мин синең ныклыгыңны күрдем. Хәзер бу тарихны бергә сакларбыз.',russian:'Я увидел твою стойкость. Теперь будем хранить эту историю вместе.'},
  shurale:{tatar:'Хәйләң дә, көчең дә бар икән. Мин синең белән.',russian:'У тебя есть и хитрость, и сила. Я с тобой.'},
  syuyumbike:{tatar:'Син сынмадың. Хәзер Казан хәтерен бергә сакларбыз.',russian:'Ты не сломился. Теперь мы вместе сохраним память Казани.'},
};
if(isPvp){
  $('.desktop-note .small-note').textContent='Сетевая дуэль · Supabase Realtime';
  app.insertAdjacentHTML('beforeend',`
    <dialog id="pvp-dialog" class="panel-dialog">
      <div class="dialog-eyebrow">СЕТЕВАЯ ДУЭЛЬ</div>
      <h2>Выберите хранителя</h2>
      <p class="dialog-description">Создайте комнату или введите код друга.<br>Бой начнётся, когда подключатся оба игрока.</p>
      <label class="pvp-hero-label" for="player-select">Ваш хранитель</label>
      <select class="pvp-hero-select" id="player-select">${Object.entries(HEROES).map(([key,hero])=>`<option value="${key}">${hero.name}</option>`).join('')}</select>
      <div class="hero-description" id="hero-description"></div>
      <div class="pvp-controls" id="pvp-controls">
      <button class="primary-button" id="create-room">Создать комнату</button>
      <div class="pvp-divider"><span>или</span></div>
      <label for="room-code">Код комнаты друга</label>
      <div class="pvp-join-row"><input id="room-code" maxlength="6" autocomplete="off" placeholder="XXXXXX"><button class="secondary-button" id="join-room">Войти</button></div>
      <div class="pvp-room-status" id="pvp-room-status" hidden><small>КОД КОМНАТЫ</small><button id="copy-room" title="Скопировать код"></button><p id="pvp-status-text">Ждём второго игрока…</p><button class="text-button" id="leave-room">Выйти из комнаты</button></div>
      </div>
      <button class="text-button" id="pvp-atlas">Все позы персонажей</button>
    </dialog>`);
  $('#player-select').value=playerHero;
  $('#player-select').onchange=()=>{playerHero=$('#player-select').value;updatePvpSelection();};
  $('#room-code').oninput=event=>{event.target.value=event.target.value.toUpperCase().replace(/[^A-Z2-9]/g,'').slice(0,6);};
}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2100);}
const clone=value=>JSON.parse(JSON.stringify(value));
const swapSide=id=>id==='player'?'enemy':id==='enemy'?'player':id;
const localResult=result=>result==='win'?'lose':result==='lose'?'win':result;
function battleSnapshot(){
  return clone({time:battle.time,limit:battle.limit,status:battle.status,result:battle.result,entities:battle.entities,pending:battle.pending,projectiles:battle.projectiles,closed:battle.closed,serial:battle.serial,stats:battle.stats});
}
function flipEvent(event){
  const next={...event};
  for(const key of ['id','source','target'])if(next[key])next[key]=swapSide(next[key]);
  if(next.type==='FINISH')next.result=localResult(next.result);
  return next;
}
function guestState(state){
  const next=clone(state),hostPlayer=next.entities.player,hostEnemy=next.entities.enemy;
  next.entities={player:{...hostEnemy,id:'player'},enemy:{...hostPlayer,id:'enemy'}};
  next.closed={player:next.closed.enemy,enemy:next.closed.player};
  next.pending=next.pending.map(item=>({...item,source:swapSide(item.source),target:swapSide(item.target)}));
  next.projectiles=next.projectiles.map(item=>({...item,source:swapSide(item.source),target:swapSide(item.target)}));
  next.result=localResult(next.result);
  return next;
}
function applyGuestState(payload){
  if(!payload?.state||pvpRole!=='guest')return;
  const state=guestState(payload.state),wasFinished=battle.status==='finished';
  if(state.status==='playing')state.time=Math.max(state.time,battle.time);
  Object.assign(battle,state);
  for(const event of payload.events??[])renderer?.event(flipEvent(event),battle);
  updateHUD();
  const finish=(payload.events??[]).find(event=>event.type==='FINISH');
  if(finish&&!wasFinished){clearTimeout(resultTimer);resultTimer=setTimeout(()=>showResult(flipEvent(finish)),1200);}
}
function setRoomUi(code,message){
  if(!isPvp)return;
  $('#pvp-room-status').hidden=false;$('#copy-room').textContent=code;$('#pvp-status-text').textContent=message;
  $('#create-room').hidden=true;$('.pvp-divider').hidden=true;$('#room-code').parentElement.previousElementSibling.hidden=true;$('#room-code').parentElement.hidden=true;
  $('#player-select').disabled=true;
}
async function leavePvp(message='Комната закрыта.',notify=true){
  await pvpConnection?.close(notify);pvpConnection=null;pvpRole=null;pvpMatched=false;networkEvents=[];
  closeDialogs();battle=new Battle({player:playerHero,enemy:enemyHero,ai:false});renderer?.reset();updateSelection();updateHUD();
  $('#pvp-room-status').hidden=true;$('#create-room').hidden=false;$('.pvp-divider').hidden=false;$('#room-code').parentElement.previousElementSibling.hidden=false;$('#room-code').parentElement.hidden=false;$('#player-select').disabled=false;$('#pvp-dialog').showModal();
  if(message)toast(message);
}
function beginPvp({ownHero,opponentHero}){
  if(pvpMatched)return;pvpMatched=true;playerHero=ownHero;enemyHero=opponentHero;
  battle=new Battle({player:playerHero,enemy:enemyHero,ai:false});renderer?.reset();updateSelection();updateHUD();
  setRoomUi(pvpConnection.room,`Соперник выбрал ${HEROES[opponentHero].name}. Начинаем…`);
  if(pvpRole==='host')setTimeout(()=>{if(!pvpConnection||battle.status!=='ready')return;closeDialogs();battle.start();},650);
  else closeDialogs();
}
async function connectPvp(role,room){
  if(!isPvpConfigured){toast('Добавьте ключи Supabase и перезапустите игру.');return;}
  const code=room.trim().toUpperCase();if(code.length!==6){toast('Введите шестизначный код комнаты.');return;}
  pvpRole=role;setRoomUi(code,role==='host'?'Ждём второго игрока…':'Подключаемся к другу…');
  pvpConnection=new PvpConnection({
    role,room:code,hero:playerHero,onMatched:beginPvp,onState:applyGuestState,
    onInput:({action,value})=>{if(pvpRole!=='host'||battle.status!=='playing')return;if(action==='move')battle.move('enemy',value);if(action==='cast')battle.cast('enemy',value);},
    onLeave:()=>void leavePvp('Соперник вышел из комнаты.',false),onError:()=>toast('Нестабильное соединение с комнатой.'),
  });
  try{await pvpConnection.connect();}
  catch(error){console.error(error);await leavePvp('Не удалось подключиться к комнате.');}
}
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
function playSound(type){
  if(!soundOn||!audio)return;const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type='square';
  const frequency={ATTACK:310,HIT:130,CAST:560,REFLECT:880,FINISH:660,MOVE:220}[type];if(!frequency)return;
  oscillator.frequency.setValueAtTime(frequency,audio.currentTime);oscillator.frequency.exponentialRampToValueAtTime(frequency*.55,audio.currentTime+.09);gain.gain.setValueAtTime(.018,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.12);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+.13);
}
function updateSelection(){
  for(const [id,hero]of [['player',playerHero],['enemy',enemyHero]]){$(`#${id}-name`).textContent=HEROES[hero].name;$(`#${id}-portrait`).src=portraits(hero);}
  document.querySelectorAll('[data-ability]').forEach((button,i)=>{const a=HEROES[playerHero].abilities[i];button.querySelector('strong').textContent=a.short;button.querySelector('.ability-symbol').src=EFFECT_URLS[`/abilities/${playerHero}/${ABILITY_ART[playerHero][i]}.png`];button.querySelector('.ability-copy small').textContent=abilityHints[playerHero][i];button.setAttribute('aria-label',`${a.name}. ${a.description}`);button.title=a.description;});
  updatePvpSelection();
}
function updatePvpSelection(){if(isPvp&&$('#hero-description'))$('#hero-description').innerHTML=HEROES[playerHero].abilities.map(ability=>`<p><b>${ability.name}</b><span>${ability.description}</span></p>`).join('');}
function configure(){clearTimeout(resultTimer);closeDialogs();battle=new Battle({player:playerHero,enemy:enemyHero,ai:!isPvp,bonus});renderer?.reset();updateSelection();updateHUD();if(isPvp)$('#pvp-dialog').showModal();}
function swap(){[playerHero,enemyHero]=[enemyHero,playerHero];battle=new Battle({player:playerHero,enemy:enemyHero,bonus});renderer?.reset();updateSelection();updateHUD();}
function start(){if(!loaded||isPvp)return;clearTimeout(resultTimer);closeDialogs();lastResult=null;battle=new Battle({player:playerHero,enemy:enemyHero,bonus});renderer.reset();battle.start();updateHUD();audio?.resume();}
function pause(reason='Можно перевести дух.'){
  if(isPvp){toast('В сетевой дуэли паузы нет.');return;}
  if(battle.status!=='playing')return;battle.pause();$('#pause-reason').textContent=reason;if(!document.querySelector('dialog[open]'))$('#pause-dialog').showModal();
}
function openSub(dialog){const current=document.querySelector('dialog[open]');returnDialog=current?.id||null;if(!isPvp&&!current&&battle.status==='playing'){battle.pause();returnDialog='pause-dialog';}current?.close();$(dialog).showModal();}
function closeSub(dialog){$(dialog).close();if(returnDialog)$(`#${returnDialog}`).showModal();returnDialog=null;}
function statuses(e){const result=[];if(e.gateTrapUntil>battle.time)result.push('Ворота '+(e.gateTrapUntil-battle.time).toFixed(1)+'с');else if(e.rootUntil>battle.time)result.push('Удержание '+(e.rootUntil-battle.time).toFixed(1)+'с');if(e.shield>0)result.push('Щит '+Math.ceil(e.shield));if(e.reflectUntil>battle.time)result.push('Отражение');if(e.mistUntil>battle.time)result.push('Морок '+(e.mistUntil-battle.time).toFixed(1)+'с');if(e.weakenUntil>battle.time)result.push('Автоатака −50%');return result.join(' · ');}
function updateHUD(){
  const active=battle.status==='playing';
  $('#timer').textContent=Math.ceil(battle.limit-battle.time);$('.timer').classList.toggle('urgent',battle.time>75);
  for(const id of ['player','enemy']){const e=battle.entities[id];$(`#${id}-bar`).style.width=`${e.hp/e.maxHp*100}%`;$(`#${id}-shield`).style.width=`${Math.min(100,e.shield/e.maxHp*100)}%`;$(`#${id}-hp`).textContent=`${Math.ceil(e.hp)} / ${e.maxHp}`;$(`#${id}-status`).textContent=statuses(e);}
  const p=battle.entities.player;
  document.querySelectorAll('[data-lane]').forEach(button=>{const lane=Number(button.dataset.lane),closed=battle.closed.player[lane]>battle.time,root=p.rootUntil>battle.time,trapped=p.gateTrapUntil>battle.time;button.disabled=!active||root||trapped||closed&&lane!==p.lane;button.classList.toggle('selected',p.lane===lane);button.classList.toggle('closed',closed);button.setAttribute('aria-pressed',String(p.lane===lane));button.setAttribute('aria-label',`${['Левое','Среднее','Правое'][lane]} русло${closed?', вход закрыт':''}${trapped?', ворота удерживают':root?', движение удерживается':''}`);});
  document.querySelectorAll('[data-ability]').forEach((button,i)=>{const remaining=Math.max(0,p.cooldowns[i]-battle.time);button.disabled=!active||remaining>0;button.querySelector('.cooldown').textContent=remaining>0?remaining.toFixed(1):'';button.style.setProperty('--cooldown',`${remaining/HEROES[p.hero].abilities[i].cooldown*100}%`);});
  $('#battle-hint').textContent=battle.status==='paused'?'Бой на паузе':p.gateTrapUntil>battle.time?'Ворота удерживают · умения доступны':p.rootUntil>battle.time?'Движение запрещено · умения доступны':p.reflectUntil>battle.time?'Волна отражает снаряды, но не наземные атаки':'Одно русло — автоматическая атака';
}
function showResult(event){
  if(battle.status!=='finished')return;closeDialogs();
  lastResult=event.result;
  $('#result-title').textContent={win:'Ваша победа',lose:'Ещё одна попытка?',draw:'Равные силы'}[event.result];$('#result-mark').textContent=event.result==='win'?'✦':event.result==='draw'?'◇':'↻';
  $('#result-description').textContent=event.timeout?'Время вышло. Итог — по доле оставшегося здоровья.':event.result==='win'?(isPvp?'Вы переиграли друга на трёх руслах.':'Противник усмирён и присоединяется к твоей коллекции.'):(isPvp?'Друг оказался сильнее в этой дуэли.':'Изучите предупреждения и используйте защиту вовремя.');
  const defeatLine=!isPvp&&event.result==='win'?defeatLines[enemyHero]:null;
  $('#result-quote').hidden=!defeatLine;
  if(defeatLine){$('#result-quote-portrait').src=portraits(enemyHero,'front','idle');$('#result-quote-portrait').alt=HEROES[enemyHero].name;$('#result-quote-tatar').textContent=defeatLine.tatar;$('#result-quote-russian').textContent=defeatLine.russian;}
  $('#rematch').textContent=isPvp?'Новая комната':event.result==='win'?'В коллекцию':'Ещё бой';
  $('#stat-damage').textContent=battle.stats.damage;$('#stat-dodges').textContent=battle.stats.dodges;$('#stat-reflect').textContent=battle.stats.reflections;$('#result-dialog').showModal();
  window.parent.postMessage({type:'miras:battle-finished',result:event.result,player:playerHero,enemy:enemyHero,duration_sec:Math.round(battle.time),mode:isPvp?'pvp':'pve'},window.location.origin);
}
$('#rematch').onclick=()=>{if(isPvp){void leavePvp('Создайте новую комнату для реванша.');return;}if(lastResult==='win'){window.parent.postMessage({type:'miras:open-collection'},window.location.origin);if(window.parent===window)window.location.assign('/collection');return;}start();};
$('#resume').onclick=()=>{if(document.hidden||!navigator.onLine){$('#pause-reason').textContent='Вернитесь в игру и восстановите соединение.';return;}$('#pause-dialog').close();battle.resume();};
$('#menu').onclick=()=>{if(battle.status==='playing')pause();else if(battle.status==='paused')$('#pause-dialog').showModal();};
const hostDocument=window.parent===window?document:window.parent.document,fullscreenTarget=window.frameElement||document.documentElement,fullscreenButton=$('#fullscreen');
const currentFullscreenElement=()=>hostDocument.fullscreenElement||hostDocument.webkitFullscreenElement;
fullscreenButton.onclick=async()=>{try{if(currentFullscreenElement()){if(hostDocument.exitFullscreen)await hostDocument.exitFullscreen();else if(hostDocument.webkitExitFullscreen)await hostDocument.webkitExitFullscreen();else toast('Сверните игру жестом браузера.');}else if(fullscreenTarget.requestFullscreen)await fullscreenTarget.requestFullscreen({navigationUI:'hide'});else if(fullscreenTarget.webkitRequestFullscreen)await fullscreenTarget.webkitRequestFullscreen();else toast('Добавьте игру на главный экран телефона.');}catch{toast('Браузер не разрешил изменить полноэкранный режим.');}};
const syncFullscreenButton=()=>{const isFullscreen=Boolean(currentFullscreenElement());fullscreenButton.textContent=isFullscreen?'⤢':'⛶';fullscreenButton.setAttribute('aria-label',isFullscreen?'Свернуть':'На весь экран');fullscreenButton.title=isFullscreen?'Свернуть':'На весь экран';};
hostDocument.addEventListener('fullscreenchange',syncFullscreenButton);
hostDocument.addEventListener('webkitfullscreenchange',syncFullscreenButton);
$('#rules-button').onclick=()=>openSub('#rules-dialog');$('#pause-rules').onclick=()=>openSub('#rules-dialog');$('#close-rules').onclick=()=>closeSub('#rules-dialog');
for(const id of ['atlas-button','pause-atlas','pvp-atlas']){const el=$('#'+id);if(el)el.onclick=()=>openSub('#atlas-dialog');}
$('#close-atlas').onclick=()=>closeSub('#atlas-dialog');
$('#atlas-content').innerHTML=Object.entries(HEROES).map(([hero,config])=>`<section class="atlas-section"><h3>${config.name}</h3>${['front','back'].map(face=>`<p class="atlas-facing">${face==='front'?'СПЕРЕДИ · СОПЕРНИК':'СЗАДИ · ВАШ ГЕРОЙ'}</p><div class="sprite-grid">${Object.entries(stateNames).map(([state,label])=>`<figure><img loading="lazy" src="${portraits(hero,face,state)}" alt="${config.name}: ${label}, ${face==='front'?'спереди':'сзади'}"><figcaption>${label}<small>${state}</small></figcaption></figure>`).join('')}</div>`).join('')}</section>`).join('');
function playerMove(lane){if(isPvp&&pvpRole==='guest'){battle.move('player',lane);void pvpConnection?.sendInput('move',lane);}else battle.move('player',lane);}
function playerCast(slot){if(isPvp&&pvpRole==='guest'){battle.cast('player',slot);void pvpConnection?.sendInput('cast',slot);}else battle.cast('player',slot);}
document.querySelectorAll('[data-lane]').forEach(button=>button.onclick=()=>playerMove(Number(button.dataset.lane)));
document.querySelectorAll('[data-ability]').forEach(button=>button.onclick=()=>playerCast(Number(button.dataset.ability)));
if(isPvp){
  $('#create-room').onclick=()=>void connectPvp('host',createRoomCode());
  $('#join-room').onclick=()=>void connectPvp('guest',$('#room-code').value);
  $('#room-code').onkeydown=event=>{if(event.key==='Enter')void connectPvp('guest',$('#room-code').value);};
  $('#leave-room').onclick=()=>void leavePvp();
  $('#copy-room').onclick=async()=>{const code=$('#copy-room').textContent;try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(code);else throw new Error();toast('Код комнаты скопирован.');}catch{toast(`Код комнаты: ${code}`);}};
}
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('cancel',event=>{event.preventDefault();if(dialog.id==='atlas-dialog'||dialog.id==='rules-dialog')closeSub('#'+dialog.id);else if(dialog.id==='pause-dialog')$('#resume').click();}));
document.addEventListener('keydown',event=>{
  if(event.repeat||event.altKey||event.ctrlKey||event.metaKey)return;if(event.code==='Escape'&&!document.querySelector('dialog[open]')){pause();return;}if(document.querySelector('dialog[open]'))return;
  if(['Digit1','Digit2','Digit3'].includes(event.code)){event.preventDefault();playerMove(Number(event.code.slice(-1))-1);}
  if(event.code==='ArrowLeft'||event.code==='ArrowRight'){event.preventDefault();playerMove(battle.entities.player.lane+(event.code==='ArrowLeft'?-1:1));}
  if(event.code==='KeyQ'||event.code==='KeyE'){event.preventDefault();playerCast(event.code==='KeyQ'?0:1);}
  if(event.code==='Space'){event.preventDefault();pause();}
});
$('#sound').onclick=async()=>{soundOn=!soundOn;$('#sound').classList.toggle('enabled',soundOn);$('#sound').setAttribute('aria-label',soundOn?'Выключить звук':'Включить звук');$('#sound').title=soundOn?'Звук включён':'Звук выключен';if(soundOn){const Audio=window.AudioContext||window.webkitAudioContext;if(Audio){audio??=new Audio();await audio.resume();playSound('CAST');}}};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!isPvp)pause('Бой остановлен, пока вы были вне игры.');});
let offlineTimer;window.addEventListener('offline',()=>{offlineTimer=setTimeout(()=>isPvp?toast('Нет соединения с соперником.'):pause('Нет соединения. Бой сохранён на паузе.'),1500);});window.addEventListener('online',()=>clearTimeout(offlineTimer));
window.addEventListener('pagehide',()=>{void pvpConnection?.close();});
updateSelection();updateHUD();
try{
  renderer=new BattleRenderer($('#arena'),playerMove);
  await renderer.init(progress=>{$('#load-progress').value=progress;});loaded=true;$('#loading').hidden=true;
  let lastTime=performance.now(),lastHUD=0;
  const loop=now=>{const delta=(now-lastTime)/1000;lastTime=now;if(delta>1.5&&battle.status==='playing'&&!isPvp)pause('Бой приостановлен после перерыва.');if(!isPvp||pvpRole==='host')battle.step(delta);else if(pvpRole==='guest'&&battle.status==='playing')battle.time=Math.min(battle.limit,battle.time+Math.min(delta,.1));
    const events=battle.drain();for(const event of events){renderer.event(event,battle);playSound(event.type);if(event.type==='BLOCKED')toast(event.reason);if(event.type==='FINISH'){clearTimeout(resultTimer);resultTimer=setTimeout(()=>showResult(event),1200);}}
    if(isPvp&&pvpRole==='host'&&pvpMatched){networkEvents.push(...events.map(clone));if(now-lastNetworkState>=50){void pvpConnection?.sendState(battleSnapshot(),networkEvents.splice(0));lastNetworkState=now;}}
    renderer.draw(battle,battle.status==='paused'?0:Math.min(delta,.05));if(now-lastHUD>50){updateHUD();lastHUD=now;}requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);if(isPvp)$('#pvp-dialog').showModal();else start();
  // Read-only diagnostic snapshot for local acceptance tests; gameplay has no test shortcuts.
  window.__battleSnapshot=()=>({status:battle.status,time:battle.time,result:battle.result,player:{...battle.entities.player},enemy:{...battle.entities.enemy},sprites:{...renderer.spriteStates},assets:Object.keys(renderer.textures).length,visuals:[...renderer.overlaySprites].map(([key,sprite])=>({key,x:sprite.x,y:sprite.y,texture:Object.keys(renderer.textures).find(path=>renderer.textures[path]===sprite.texture)}))});
}catch(error){console.error(error);$('#loading-message').textContent='Не удалось загрузить игру. Обновите страницу в браузере с WebGL.';$('#load-progress').hidden=true;}
