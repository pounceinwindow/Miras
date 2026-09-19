import test from 'node:test';
import assert from 'node:assert/strict';
import { impactFrame, bindingArt, projectileArt, projectileRotation } from '../src/visual-spec.js';
test('impact plays four ordered frames and ends after 300 ms',()=>{
  assert.deepEqual([0,.08,.16,.24,.3].map(impactFrame),[0,1,2,3,-1]);
  assert.equal(impactFrame(-.01),-1);
});
test('reflected projectile retains the original caster artwork',()=>{
  const entities={player:{hero:'su_anasy'},enemy:{hero:'kremlin'}};
  assert.equal(projectileArt({source:'enemy',target:'player'},entities),'/projectiles/kremlin.png');
  assert.equal(projectileArt({source:'player',target:'enemy',reflected:true},entities),'/projectiles/kremlin.png');
  assert.equal(projectileRotation({target:'player'}),Math.PI);
  assert.equal(projectileRotation({target:'enemy'}),0);
});
test('hostile holds select their own artwork; self-root has no hostile bind',()=>{
  assert.equal(bindingArt('comb'),'/binds/su_anasy.png');
  assert.equal(bindingArt('tickle'),'/binds/shurale.png');
  assert.equal(bindingArt('wall'),null);
});
