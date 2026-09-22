import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const source=path.join(root,'marketing/store/source');
const play=path.join(root,'marketing/store/google-play');
const apple=path.join(root,'marketing/store/app-store');
const data=async p=>`data:image/${path.extname(p).slice(1)==='svg'?'svg+xml':'png'};base64,${(await fs.readFile(p)).toString('base64')}`;
const shots={
 home:await data(path.join(source,'home.png')),
 map:await data(path.join(source,'map.png')),
 fight:await data(path.join(source,'fight.png')),
 pvp:await data(path.join(source,'pvp.png')),
 su:await data(path.join(root,'public/pixel/su-anasy.png')),
 shurale:await data(path.join(root,'public/pixel/shurale.png')),
 syuyumbike:await data(path.join(root,'public/pixel/syuyumbike.png')),
 icon:await data(path.join(root,'public/favicon.svg')),
};
const browser=await chromium.launch({headless:true});
async function png(file,w,h,html){
 const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
 await page.setContent(`<!doctype html><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#b7ff00;font-family:Arial,sans-serif}.frame{position:relative;width:100%;height:100%;overflow:hidden;background:radial-gradient(circle at 80% 10%,#dfff71 0 14%,transparent 40%),#b7ff00}.grid{position:absolute;inset:0;opacity:.13;background-image:linear-gradient(#006d64 2px,transparent 2px),linear-gradient(90deg,#006d64 2px,transparent 2px);background-size:94px 94px}.paper{position:absolute;background:#fff5db;box-shadow:0 28px 70px rgba(7,59,58,.28)}.title{position:absolute;z-index:3;left:72px;right:72px;top:78px;color:#073b3a;font:900 76px/1.02 Arial,sans-serif;letter-spacing:-2px}.pink{color:#ff2f9a}.phone{position:absolute;z-index:2;background:#073b3a;padding:18px;border:10px solid white;border-radius:68px;box-shadow:0 36px 70px rgba(7,59,58,.35);overflow:hidden}.phone img.screen{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:42px}.hero{position:absolute;z-index:4;object-fit:contain;filter:drop-shadow(0 0 10px white) drop-shadow(0 0 10px white) drop-shadow(0 18px 24px rgba(7,59,58,.28))}.tag{position:absolute;z-index:5;background:#ff2f9a;color:white;padding:16px 24px;font:900 25px Arial,sans-serif;transform:rotate(-3deg)}</style>${html}`);
 await page.screenshot({path:file});await page.close();
}
const slides=[
 ['01-legends.png','ЛЕГЕНДЫ КАЗАНИ<br><span class="pink">ОЖИВАЮТ РЯДОМ</span>',shots.home,shots.su,'right:8px;bottom:45px;width:470px;height:470px','left:172px;top:350px;width:735px;height:1510px'],
 ['02-map.png','НАХОДИ ИСТОРИИ<br><span class="pink">НА КАРТЕ ГОРОДА</span>',shots.map,shots.shurale,'right:10px;bottom:25px;width:470px;height:470px','left:172px;top:350px;width:735px;height:1510px'],
 ['03-battle.png','СРАЖАЙСЯ<br><span class="pink">В ТРЁХ РУСЛАХ</span>',shots.fight,shots.su,'right:0;bottom:30px;width:450px;height:450px','left:172px;top:350px;width:735px;height:1510px'],
 ['04-team.png','СОБИРАЙ<br><span class="pink">СВОЮ КОМАНДУ</span>',shots.pvp,shots.syuyumbike,'right:-5px;bottom:20px;width:475px;height:475px','left:172px;top:350px;width:735px;height:1510px'],
];
for(const [name,title,screen,hero,heroStyle,phoneStyle] of slides){
 await png(path.join(play,name),1080,1920,`<div class="frame"><div class="grid"></div><div class="paper" style="left:-40px;right:-40px;top:54px;height:250px;transform:rotate(-2deg)"></div><div class="title">${title}</div><div class="phone" style="${phoneStyle}"><img class="screen" src="${screen}"></div><img class="hero" style="${heroStyle}" src="${hero}"><div class="tag" style="left:52px;bottom:58px">МИРАС · ЛЕГЕНДЫ РЯДОМ</div></div>`);
 await png(path.join(apple,name),1290,2796,`<div class="frame"><div class="grid"></div><div class="paper" style="left:-48px;right:-48px;top:65px;height:300px;transform:rotate(-2deg)"></div><div class="title" style="left:86px;right:86px;top:94px;font-size:91px">${title}</div><div class="phone" style="left:205px;top:500px;width:878px;height:2050px"><img class="screen" src="${screen}"></div><img class="hero" style="right:8px;bottom:70px;width:560px;height:560px" src="${hero}"><div class="tag" style="left:62px;bottom:76px;font-size:30px">МИРАС · ЛЕГЕНДЫ РЯДОМ</div></div>`);
}
await png(path.join(play,'feature-graphic.png'),1024,500,`<div class="frame"><div class="grid"></div><div class="paper" style="left:55px;top:105px;width:655px;height:245px;transform:rotate(-2deg)"></div><div class="title" style="left:90px;top:145px;font-size:62px;right:330px">МИРАС<br><span class="pink">ЛЕГЕНДЫ РЯДОМ</span></div><img class="hero" src="${shots.su}" style="right:-12px;bottom:-80px;width:430px;height:430px"></div>`);
await png(path.join(play,'icon-512.png'),512,512,`<img src="${shots.icon}" style="width:512px;height:512px">`);
await png(path.join(apple,'icon-1024.png'),1024,1024,`<img src="${shots.icon}" style="width:1024px;height:1024px">`);
await browser.close();
