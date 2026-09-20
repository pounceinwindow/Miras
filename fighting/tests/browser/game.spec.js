import {test,expect} from '@playwright/test';

test('mobile: all sprites, switch sides, fight, casts and pause',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/fighting/index.html');await expect(page.locator('#arena')).toBeVisible({timeout:30000});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect.poll(()=>page.evaluate(()=>window.__battleSnapshot?.().status)).toBe('playing');
  await expect.poll(()=>page.evaluate(()=>window.__battleSnapshot?.().assets)).toBeGreaterThanOrEqual(40);
  await expect.poll(()=>page.evaluate(()=>window.__battleSnapshot?.().sprites.player)).toContain('su_anasy/back');
  await page.locator('[data-lane="0"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__battleSnapshot().player.lane)).toBe(0);
  await page.locator('[data-ability="0"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__battleSnapshot().player.reflectUntil)).toBeGreaterThan(0);
  await expect(page.locator('[data-lane="2"]')).toBeEnabled();
  await expect(page.locator('[data-ability="1"]')).toBeEnabled();
  await page.locator('[data-ability="1"]').click();
  await page.screenshot({path:'test-results/mobile-cast.png'});
  await page.locator('#menu').click();await expect(page.locator('#pause-dialog')).toBeVisible();
  const paused=await page.evaluate(()=>window.__battleSnapshot().time);await page.waitForTimeout(300);expect(await page.evaluate(()=>window.__battleSnapshot().time)).toBe(paused);
  await page.locator('#resume').click();await expect.poll(()=>page.evaluate(()=>window.__battleSnapshot().status)).toBe('playing');
  await page.locator('#menu').click();
  expect(errors).toEqual([]);
});


test('320px and desktop: fit and healthy rendering',async({page})=>{
  for(const viewport of [{width:320,height:640},{width:1440,height:1000}]){
    await page.setViewportSize(viewport);await page.goto('/fighting/index.html');await expect(page.locator('#arena')).toBeVisible({timeout:30000});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(page.locator('#arena canvas')).toBeVisible();
    await expect.poll(async()=>{const a=await page.locator('#arena').boundingBox(),c=await page.locator('#arena canvas').boundingBox();return Math.abs(a.width-c.width)<1&&Math.abs(a.height-c.height)<1}).toBe(true);
    const buttons=await page.locator('.abilities').boundingBox();expect(buttons.y+buttons.height).toBeLessThanOrEqual(viewport.height);
    await page.screenshot({path:`test-results/game-${viewport.width}.png`});
    await page.locator('#menu').click();
  }
});

test('ability buttons use supplied artwork',async({page})=>{
  await page.goto('/fighting/index.html');
  await expect.poll(()=>page.evaluate(()=>window.__battleSnapshot?.().status)).toBe('playing');
  const icons=await page.locator('.ability-symbol').evaluateAll(images=>images.map(image=>({tag:image.tagName,width:image.naturalWidth})));
  expect(icons).toHaveLength(2);
  expect(icons.every(icon=>icon.tag==='IMG'&&icon.width>0)).toBe(true);
});

test('ordinary impact displays all four supplied frames',async({page})=>{
  await page.goto('/fighting/index.html?player=su_anasy&enemy=kremlin');
  await expect.poll(()=>page.evaluate(()=>window.__battleSnapshot?.().status)).toBe('playing');
  const frames=await page.evaluate(()=>new Promise(resolve=>{
    const seen=new Set(),start=performance.now();
    const sample=()=>{
      for(const visual of window.__battleSnapshot().visuals)if(visual.key.startsWith('impact:'))seen.add(visual.texture);
      if(seen.size===4||performance.now()-start>6000)resolve([...seen].sort());else requestAnimationFrame(sample);
    };sample();
  }));
  expect(frames).toEqual([1,2,3,4].map(n=>`/impacts/${n}.png`));
});

test('shield follows lane travel smoothly without vertical bobbing',async({page})=>{
  await page.goto('/fighting/index.html?player=syuyumbike&enemy=shurale');
  await expect.poll(()=>page.evaluate(()=>window.__battleSnapshot?.().status)).toBe('playing');
  await page.locator('[data-ability="0"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__battleSnapshot().visuals.some(visual=>visual.key==='shield:player'))).toBe(true);
  const samples=await page.evaluate(async()=>{
    const shield=()=>window.__battleSnapshot().visuals.find(visual=>visual.key==='shield:player');
    const positions=[shield()];document.querySelector('[data-lane="2"]').click();
    for(let i=0;i<24;i++){await new Promise(requestAnimationFrame);positions.push(shield());}
    return positions;
  });
  const xs=samples.map(visual=>visual.x),ys=samples.map(visual=>visual.y);
  expect(xs[0]).toBe(180);
  expect(xs.some(x=>x>180&&x<300)).toBe(true);
  expect(xs.at(-1)).toBe(300);
  expect(new Set(ys).size).toBe(1);
});
