import {test,expect} from '@playwright/test';

test('mobile: all sprites, switch sides, fight, casts and pause',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await expect(page.locator('#start')).toBeEnabled({timeout:30000});
  await expect(page.locator('#setup-dialog')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#setup-atlas').click();await expect(page.locator('#atlas-dialog')).toBeVisible();
  await expect(page.locator('#atlas-content img')).toHaveCount(40);
  const images=page.locator('#atlas-content img');for(let i=0;i<40;i++){await images.nth(i).scrollIntoViewIfNeeded();await expect.poll(()=>images.nth(i).evaluate(img=>img.complete&&img.naturalWidth>96)).toBe(true);}
  await page.locator('#close-atlas').click();await page.locator('#swap').click();
  await expect(page.locator('#chosen-name')).toHaveText('Керемль');
  await page.locator('#start').click();
  await expect.poll(()=>page.evaluate(()=>window.__battleSnapshot().status)).toBe('playing');
  await expect.poll(()=>page.evaluate(()=>window.__battleSnapshot().assets)).toBe(40);
  await expect.poll(()=>page.evaluate(()=>window.__battleSnapshot().sprites.player)).toContain('kremlin/back');
  await page.locator('[data-lane="0"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__battleSnapshot().player.lane)).toBe(0);
  await page.locator('[data-ability="0"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__battleSnapshot().player.shield)).toBe(32);
  await expect(page.locator('[data-lane="2"]')).toBeDisabled();
  await expect(page.locator('[data-ability="1"]')).toBeEnabled();
  await page.locator('[data-ability="1"]').click();
  await page.screenshot({path:'test-results/mobile-cast.png'});
  await page.locator('#menu').click();await expect(page.locator('#pause-dialog')).toBeVisible();
  const paused=await page.evaluate(()=>window.__battleSnapshot().time);await page.waitForTimeout(300);expect(await page.evaluate(()=>window.__battleSnapshot().time)).toBe(paused);
  await page.locator('#resume').click();await expect.poll(()=>page.evaluate(()=>window.__battleSnapshot().status)).toBe('playing');
  await page.locator('#menu').click();await page.locator('#new-match').click();await page.locator('#swap').click();await page.locator('#start').click();
  expect((await page.evaluate(()=>window.__battleSnapshot())).player.hero).toBe('su_anasy');
  await page.locator('[data-ability="0"]').click();
  const wave=await page.evaluate(()=>window.__battleSnapshot());expect(wave.player.reflectUntil).toBeGreaterThan(wave.time);
  await page.locator('[data-ability="1"]').click();
  await page.screenshot({path:'test-results/mobile-water.png'});
  await page.locator('#menu').click();
  expect(errors).toEqual([]);
});

test('new heroes: independent selection, original poses, both abilities and swap',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:320,height:740});await page.goto('/');await expect(page.locator('#start')).toBeEnabled({timeout:30000});
  await expect(page.locator('#player-select option')).toHaveCount(4);await expect(page.locator('#enemy-select option')).toHaveCount(4);
  await page.locator('#player-select').selectOption('shurale');await page.locator('#enemy-select').selectOption('syuyumbike');
  await page.screenshot({path:'test-results/four-heroes-selection.png'});
  await page.locator('#start').click();
  await expect.poll(()=>page.evaluate(()=>window.__battleSnapshot().sprites.player)).toContain('shurale/back');
  await expect.poll(()=>page.evaluate(()=>window.__battleSnapshot().sprites.enemy)).toContain('syuyumbike/front');
  await expect(page.locator('[data-ability="0"] strong')).toHaveText('Щекотка');
  await page.locator('[data-ability="0"]').click();await page.locator('[data-ability="1"]').click();
  const mist=await page.evaluate(()=>window.__battleSnapshot());expect(mist.player.mistUntil).toBeGreaterThan(mist.time);
  await page.screenshot({path:'test-results/shurale-mist.png'});
  await page.locator('#menu').click();await page.locator('#new-match').click();await page.locator('#swap').click();
  await expect(page.locator('#player-select')).toHaveValue('syuyumbike');await expect(page.locator('#enemy-select')).toHaveValue('shurale');
  await page.locator('#start').click();await page.locator('[data-ability="0"]').click();
  const will=await page.evaluate(()=>window.__battleSnapshot());expect(will.player.shield).toBe(22);expect(will.player.rootUntil).toBe(0);
  await page.locator('[data-ability="1"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__battleSnapshot().sprites.player)).toContain('syuyumbike/back/cast');
  await page.screenshot({path:'test-results/syuyumbike-voice.png'});
  await page.locator('#menu').click();expect(errors).toEqual([]);
});

test('320px and desktop: fit and healthy rendering',async({page})=>{
  for(const viewport of [{width:320,height:640},{width:1440,height:1000}]){
    await page.setViewportSize(viewport);await page.goto('/');await expect(page.locator('#start')).toBeEnabled({timeout:30000});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.locator('#start').click();await expect(page.locator('#arena canvas')).toBeVisible();
    const arena=await page.locator('#arena').boundingBox(),canvas=await page.locator('#arena canvas').boundingBox();expect(Math.abs(arena.width-canvas.width)).toBeLessThan(1);expect(Math.abs(arena.height-canvas.height)).toBeLessThan(1);
    const buttons=await page.locator('.abilities').boundingBox();expect(buttons.y+buttons.height).toBeLessThanOrEqual(viewport.height);
    await page.screenshot({path:`test-results/game-${viewport.width}.png`});
    await page.locator('#menu').click();
  }
});
