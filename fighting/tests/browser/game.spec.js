import {test,expect} from '@playwright/test';

test('mobile: all sprites, switch sides, fight, casts and pause',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/fighting/index.html');await expect(page.locator('#arena')).toBeVisible({timeout:30000});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect.poll(()=>page.evaluate(()=>window.__battleSnapshot?.().status)).toBe('playing');
  await expect.poll(()=>page.evaluate(()=>window.__battleSnapshot?.().assets)).toBe(40);
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
