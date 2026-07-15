// 무기 정의/보유/발사
import { fireProjectile } from './projectiles.js';
import { enemies } from './enemies.js';
import { stats } from './stats.js';

export const MAX_WEAPON_LEVEL = 5;

// 가장 가까운 적
function nearestEnemy(x, y, maxDist = Infinity) {
  let best = null, bd = maxDist * maxDist;
  for (const e of enemies) {
    const d = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}

export const WEAPON_DEFS = {
  smg: {
    name: '펄스 SMG',
    desc: '가장 가까운 적에게 자동 연사',
    cooldown: (lv) => 0.35 * Math.pow(0.92, lv - 1),
    fire(lv, player) {
      const target = nearestEnemy(player.x, player.y, 200);
      if (!target) return false;
      const dx = target.x - player.x, dy = target.y - player.y;
      const d = Math.hypot(dx, dy) || 1;
      const dmg = (8 + 3 * (lv - 1)) * stats.dmgMul;
      const shots = lv >= 3 ? 2 : 1;
      for (let i = 0; i < shots; i++) {
        const spread = shots > 1 ? (i - 0.5) * 0.18 : (Math.random() - 0.5) * 0.08;
        const a = Math.atan2(dy, dx) + spread;
        fireProjectile({
          x: player.x, y: player.y,
          vx: Math.cos(a) * 240, vy: Math.sin(a) * 240,
          dmg, life: 1.2, sprite: 'bullet', radius: 3,
        });
      }
      return true;
    },
  },
  // Task 7: nova, missile, laser, spike 추가 예정
};

export const ownedWeapons = []; // { id, level, cd }

export function addWeapon(id) {
  ownedWeapons.push({ id, level: 1, cd: 0 });
}

export function upgradeWeapon(id) {
  const w = ownedWeapons.find(w => w.id === id);
  if (w && w.level < MAX_WEAPON_LEVEL) w.level++;
}

export function hasWeapon(id) {
  return ownedWeapons.some(w => w.id === id);
}

export function weaponLevel(id) {
  return ownedWeapons.find(w => w.id === id)?.level || 0;
}

export function updateWeapons(dt, player, ctx = {}) {
  for (const w of ownedWeapons) {
    const def = WEAPON_DEFS[w.id];
    w.cd -= dt;
    if (w.cd <= 0) {
      const fired = def.fire(w.level, player, ctx);
      // 대상이 없어 발사 실패 시 짧게 재시도
      w.cd = fired === false ? 0.1 : def.cooldown(w.level) * stats.cdMul;
    }
  }
}

export function resetWeapons() {
  ownedWeapons.length = 0;
}
