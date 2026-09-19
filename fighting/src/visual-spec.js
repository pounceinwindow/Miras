// Presentation-only values. They never change combat state or damage.
export const ABILITY_ART = {
  su_anasy: ['reverse_wave', 'golden_comb'],
  shurale: ['tickle', 'forest_haze'],
  syuyumbike: ['khanbike_will', 'kazan_voice'],
  kremlin: ['white_wall', 'gate_seal'],
};
export const IMPACT_FRAMES = [1, 2, 3, 4].map(frame => `/impacts/${frame}.png`);
export const IMPACT_FRAME_SECONDS = 0.075;
export const IMPACT_DURATION = IMPACT_FRAMES.length * IMPACT_FRAME_SECONDS;
export function impactFrame(age) {
  return age < 0 || age >= IMPACT_DURATION ? -1 : Math.min(IMPACT_FRAMES.length - 1, Math.floor(age / IMPACT_FRAME_SECONDS));
}
export function bindingArt(kind) {
  return kind === 'tickle' ? '/binds/shurale.png' : kind === 'comb' ? '/binds/su_anasy.png' : null;
}
export function projectileArt(shot, entities) {
  // Reflection reverses travel, not the identity of the incoming projectile.
  const originalSource = shot.reflected ? shot.target : shot.source;
  return `/projectiles/${entities[originalSource].hero}.png`;
}
export function projectileRotation(shot) { return shot.target === 'player' ? Math.PI : 0; }
