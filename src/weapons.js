// 무기 정의/보유/발사
import { fireProjectile } from './projectiles.js';
import { enemies, nearby, damageEnemy } from './enemies.js';
import { stats } from './stats.js';
import { fxRing, fxBeam } from './effects.js';
import { makeQuad } from './renderer.js';
import { makeSprite } from './sprites.js';
import { sfx } from './audio.js';

let sceneRef = null;
export function initWeapons(scene) { sceneRef = scene; }

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
      sfx.shoot();
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
  nova: {
    name: 'EMP 노바',
    desc: '주기적으로 주변 전체에 광역 데미지',
    cooldown: (lv) => 3.5,
    fire(lv, player) {
      const r = 60 + 8 * (lv - 1);
      const dmg = (12 + 4 * (lv - 1)) * stats.dmgMul;
      fxRing(player.x, player.y, r, '#00e5ff', 0.4);
      sfx.nova();
      for (const e of nearby(player.x, player.y, r)) {
        if (Math.hypot(e.x - player.x, e.y - player.y) <= r + e.radius) damageEnemy(e, dmg);
      }
      return true;
    },
  },
  missile: {
    name: '유도 미사일',
    desc: '적을 추적해 폭발하는 미사일 발사',
    cooldown: (lv) => 2.2,
    fire(lv, player) {
      if (enemies.length === 0) return false;
      const count = 1 + Math.floor(lv / 2);
      const dmg = (20 + 6 * (lv - 1)) * stats.dmgMul;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        fireProjectile({
          x: player.x, y: player.y,
          vx: Math.cos(a) * 150, vy: Math.sin(a) * 150,
          dmg, life: 3, sprite: 'missile', radius: 4,
          homing: 900, explodeR: 30,
        });
      }
      return true;
    },
  },
  laser: {
    name: '관통 레이저',
    desc: '직선상의 모든 적을 관통하는 빔',
    cooldown: (lv) => 2.8,
    fire(lv, player) {
      const target = nearestEnemy(player.x, player.y, 260);
      if (!target) return false;
      const a = Math.atan2(target.y - player.y, target.x - player.x);
      const LEN = 260;
      const dmg = (15 + 5 * (lv - 1)) * stats.dmgMul;
      fxBeam(player.x, player.y, a, LEN, 5, '#ff2d78', 0.15);
      sfx.laser();
      const dirX = Math.cos(a), dirY = Math.sin(a);
      for (const e of [...enemies]) {
        const rx = e.x - player.x, ry = e.y - player.y;
        const t = rx * dirX + ry * dirY;          // 빔 방향 투영 거리
        if (t < 0 || t > LEN) continue;
        const perp = Math.abs(rx * dirY - ry * dirX); // 수직 거리
        if (perp < 4 + e.radius) damageEnemy(e, dmg);
      }
      return true;
    },
  },
  spike: {
    name: '데이터 스파이크',
    desc: '주위를 도는 회전체가 적을 지속 타격',
    cooldown: () => Infinity, // 상시형 — update로 동작
    fire() { return true; },
    update(dt, w, player) {
      const count = w.level;
      const R = 40;
      const SPD = 2.4; // rad/s
      w.state = w.state || { angle: 0, meshes: [], hitCd: new Map() };
      const st = w.state;
      st.angle += SPD * dt;

      while (st.meshes.length < count) {
        const mesh = makeQuad(makeSprite('spike'), 6, 6);
        sceneRef.add(mesh);
        st.meshes.push(mesh);
      }

      const dmg = (10 + 3 * (w.level - 1)) * stats.dmgMul;
      // 적별 히트 쿨다운 감소
      for (const [e, t] of st.hitCd) {
        const nt = t - dt;
        if (nt <= 0) st.hitCd.delete(e); else st.hitCd.set(e, nt);
      }

      st.meshes.forEach((mesh, i) => {
        const a = st.angle + (i / count) * Math.PI * 2;
        const sx = player.x + Math.cos(a) * R;
        const sy = player.y + Math.sin(a) * R;
        mesh.position.set(sx, sy, 0.9);
        mesh.rotation.z = a;
        for (const e of nearby(sx, sy, 12)) {
          if (st.hitCd.has(e)) continue;
          if (Math.hypot(e.x - sx, e.y - sy) < e.radius + 4) {
            damageEnemy(e, dmg);
            st.hitCd.set(e, 0.4);
          }
        }
      });
    },
  },
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
    if (def.update) { def.update(dt, w, player); continue; } // 상시형 (스파이크)
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
