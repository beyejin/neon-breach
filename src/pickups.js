// XP 데이터 조각 (풀링 + 자석 흡인)
import { makeQuad } from './renderer.js';
import { makeSprite } from './sprites.js';
import { stats } from './stats.js';

const active = [];
const pool = [];
let sceneRef = null;

export function initPickups(scene) { sceneRef = scene; }

export function dropGem(x, y, xp) {
  let g = pool.pop();
  if (!g) {
    const mesh = makeQuad(makeSprite('gem'), 6, 6);
    sceneRef.add(mesh);
    g = { mesh };
  }
  g.x = x; g.y = y;
  g.xp = xp;
  g.vx = 0; g.vy = 0;
  g.magnet = false;
  g.bob = Math.random() * Math.PI * 2;
  g.mesh.visible = true;
  // 엘리트 젬은 크게
  const s = xp >= 10 ? 1.6 : 1;
  g.mesh.scale.set(s, s, 1);
  active.push(g);
}

export function updatePickups(dt, player) {
  let gained = 0;
  for (let i = active.length - 1; i >= 0; i--) {
    const g = active[i];
    const dx = player.x - g.x, dy = player.y - g.y;
    const d = Math.hypot(dx, dy);

    if (d < stats.pickupRange) g.magnet = true;
    if (g.magnet) {
      const pull = 320;
      g.x += (dx / (d || 1)) * pull * dt;
      g.y += (dy / (d || 1)) * pull * dt;
    } else {
      g.bob += dt * 3;
    }

    if (d < 7) {
      gained += g.xp;
      g.mesh.visible = false;
      active.splice(i, 1);
      pool.push(g);
      continue;
    }
    g.mesh.position.set(g.x, g.y + (g.magnet ? 0 : Math.sin(g.bob) * 1.5), 0.3);
  }
  return gained;
}

// 디버그/오토파일럿용
export function gemList() {
  return active;
}

export function clearPickups() {
  for (const g of active) { g.mesh.visible = false; pool.push(g); }
  active.length = 0;
}
