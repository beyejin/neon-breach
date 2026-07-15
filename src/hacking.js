// 해킹 게이지/전향
import { enemies, removeEnemy } from './enemies.js';
import { addAlly } from './allies.js';
import { fxRing } from './effects.js';

export const hacking = { gauge: 0 }; // 0~100

export function addCharge(isElite) {
  hacking.gauge = Math.min(100, hacking.gauge + (isElite ? 20 : 5));
}

const HACK_RANGE = 100;

// 게이지 100%일 때 반경 내 최근접 적을 아군으로 전향
export function tryHack(player) {
  if (hacking.gauge < 100) return false;
  let best = null, bd = HACK_RANGE * HACK_RANGE;
  for (const e of enemies) {
    if (e.boss) continue; // 보스는 해킹 불가
    const d = (e.x - player.x) ** 2 + (e.y - player.y) ** 2;
    if (d < bd) { bd = d; best = e; }
  }
  if (!best) return false;

  hacking.gauge = 0;
  fxRing(best.x, best.y, 40, '#00ffc8', 0.45);
  fxRing(player.x, player.y, HACK_RANGE, '#00ffc8', 0.3);
  addAlly(best);
  removeEnemy(best);
  return true;
}

export function resetHacking() {
  hacking.gauge = 0;
}
