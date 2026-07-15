// 아군 발사체 (풀링)
import { makeQuad } from './renderer.js';
import { makeSprite, spriteSize } from './sprites.js';
import { nearby, damageEnemy, enemies } from './enemies.js';

const active = [];
const pool = [];
let sceneRef = null;

export function initProjectiles(scene) { sceneRef = scene; }

export function fireProjectile(opts) {
  let p = pool.pop();
  if (!p) {
    const mesh = makeQuad(makeSprite('bullet'), 4, 4);
    sceneRef.add(mesh);
    p = { mesh };
  }
  const { w, h } = spriteSize(opts.sprite || 'bullet');
  p.mesh.material.map = makeSprite(opts.sprite || 'bullet');
  // 기준 지오메트리(4×4)를 스케일로 스프라이트 크기에 맞춤
  p.mesh.scale.set(w / 4, h / 4, 1);
  p.mesh.visible = true;

  p.x = opts.x; p.y = opts.y;
  p.vx = opts.vx; p.vy = opts.vy;
  p.dmg = opts.dmg;
  p.pierce = opts.pierce ?? 0;      // 관통 남은 횟수
  p.life = opts.life ?? 2;
  p.radius = opts.radius ?? 3;
  p.homing = opts.homing ?? 0;      // 유도 강도 (Task 7)
  p.explodeR = opts.explodeR ?? 0;  // 폭발 반경 (Task 7)
  p.hitSet = new Set();             // 관통 시 중복 히트 방지
  active.push(p);
  return p;
}

export function updateProjectiles(dt, onExplode) {
  for (let i = active.length - 1; i >= 0; i--) {
    const p = active[i];
    p.life -= dt;

    // 유도 (Task 7 미사일)
    if (p.homing > 0 && enemies.length > 0) {
      let best = null, bd = Infinity;
      for (const e of enemies) {
        const d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
        if (d < bd) { bd = d; best = e; }
      }
      if (best) {
        const d = Math.sqrt(bd) || 1;
        const spd = Math.hypot(p.vx, p.vy);
        p.vx += ((best.x - p.x) / d) * p.homing * dt;
        p.vy += ((best.y - p.y) / d) * p.homing * dt;
        const ns = Math.hypot(p.vx, p.vy) || 1;
        p.vx = (p.vx / ns) * spd;
        p.vy = (p.vy / ns) * spd;
      }
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.mesh.position.set(p.x, p.y, 0.8);
    p.mesh.rotation.z = Math.atan2(p.vy, p.vx) - Math.PI / 2;

    let dead = p.life <= 0;

    if (!dead) {
      for (const e of nearby(p.x, p.y, 24)) {
        if (p.hitSet.has(e)) continue;
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < e.radius + p.radius) {
          if (p.explodeR > 0) {
            onExplode?.(p.x, p.y, p.explodeR, p.dmg);
            dead = true;
            break;
          }
          damageEnemy(e, p.dmg);
          p.hitSet.add(e);
          if (p.pierce <= 0) { dead = true; break; }
          p.pierce--;
        }
      }
    }

    if (dead) {
      p.mesh.visible = false;
      active.splice(i, 1);
      pool.push(p);
    }
  }
}

export function clearProjectiles() {
  for (const p of active) { p.mesh.visible = false; pool.push(p); }
  active.length = 0;
}
