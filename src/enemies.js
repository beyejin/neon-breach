// 적 정의/AI/풀링
import { makeQuad } from './renderer.js';
import { makeSprite, spriteSize } from './sprites.js';

export const ENEMY_TYPES = {
  rushbot:    { hp: 20,  speed: 55, dmg: 8,  radius: 4,  xp: 1, sprite: 'rushbot' },
  shooterbot: { hp: 15,  speed: 40, dmg: 6,  radius: 5,  xp: 2, sprite: 'shooterbot', range: 120 },
  tankbot:    { hp: 80,  speed: 22, dmg: 15, radius: 7,  xp: 4, sprite: 'tankbot' },
  elite:      { hp: 200, speed: 45, dmg: 12, radius: 8,  xp: 12, sprite: 'elite', elite: true },
};

export const enemies = [];        // 살아있는 적
export const deathEvents = [];    // 이번 프레임 사망 이벤트 { x, y, xp, elite, type }
const pool = new Map();           // type → mesh[]

let sceneRef = null;
export function initEnemies(scene) { sceneRef = scene; }

function getMesh(type) {
  const list = pool.get(type) || [];
  if (list.length > 0) return list.pop();
  const t = ENEMY_TYPES[type];
  const { w, h } = spriteSize(t.sprite);
  const mesh = makeQuad(makeSprite(t.sprite), w, h);
  sceneRef.add(mesh);
  return mesh;
}

function releaseMesh(type, mesh) {
  mesh.visible = false;
  (pool.get(type) || pool.set(type, []).get(type)).push(mesh);
}

export function spawnEnemy(type, x, y, hpMul = 1) {
  const t = ENEMY_TYPES[type];
  const mesh = getMesh(type);
  mesh.visible = true;
  mesh.material.color.setHex(0xffffff);
  const e = {
    type, x, y,
    hp: t.hp * hpMul, maxHp: t.hp * hpMul,
    speed: t.speed * (0.9 + Math.random() * 0.2),
    dmg: t.dmg, radius: t.radius, xp: t.xp,
    elite: !!t.elite, range: t.range || 0,
    flash: 0, shootCd: 0,
    mesh,
  };
  enemies.push(e);
  return e;
}

// 간단 공간 해시 (분리/근접 검색용)
const CELL = 24;
const grid = new Map();
export function rebuildGrid() {
  grid.clear();
  for (const e of enemies) {
    const key = ((e.x / CELL) | 0) + ':' + ((e.y / CELL) | 0);
    let arr = grid.get(key);
    if (!arr) { arr = []; grid.set(key, arr); }
    arr.push(e);
  }
}
export function nearby(x, y, r) {
  const out = [];
  const c = Math.ceil(r / CELL);
  const cx = (x / CELL) | 0, cy = (y / CELL) | 0;
  for (let gx = cx - c; gx <= cx + c; gx++) {
    for (let gy = cy - c; gy <= cy + c; gy++) {
      const arr = grid.get(gx + ':' + gy);
      if (arr) out.push(...arr);
    }
  }
  return out;
}

export function updateEnemies(dt, player) {
  rebuildGrid();
  for (const e of enemies) {
    const dx = player.x - e.x, dy = player.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;

    // 이동: 슈터봇은 사거리 유지, 나머지는 돌진
    let mv = e.speed;
    if (e.range > 0 && dist < e.range * 0.85) mv = -e.speed * 0.6;
    else if (e.range > 0 && dist < e.range) mv = 0;
    e.x += (dx / dist) * mv * dt;
    e.y += (dy / dist) * mv * dt;

    // 분리: 근처 적끼리 밀어내기
    for (const o of nearby(e.x, e.y, CELL)) {
      if (o === e) continue;
      const ox = e.x - o.x, oy = e.y - o.y;
      const d = Math.hypot(ox, oy);
      const min = e.radius + o.radius;
      if (d > 0 && d < min) {
        const push = ((min - d) / d) * 0.5;
        e.x += ox * push;
        e.y += oy * push;
      }
    }

    // 접촉 데미지
    if (dist < e.radius + player.radius + 2) {
      player.takeDamage(e.dmg);
    }

    // 렌더
    e.flash = Math.max(0, e.flash - dt);
    e.mesh.position.set(e.x, e.y, 0.5);
    e.mesh.scale.x = dx > 0 ? 1 : -1;
    e.mesh.material.color.setHex(e.flash > 0 ? 0xff6666 : 0xffffff);
  }
}

export function damageEnemy(e, n) {
  if (e.hp <= 0) return false;
  e.hp -= n;
  e.flash = 0.08;
  if (e.hp <= 0) {
    deathEvents.push({ x: e.x, y: e.y, xp: e.xp, elite: e.elite, type: e.type });
    removeEnemy(e);
    return true;
  }
  return false;
}

export function removeEnemy(e) {
  const i = enemies.indexOf(e);
  if (i >= 0) enemies.splice(i, 1);
  releaseMesh(e.type, e.mesh);
}

export function clearEnemies() {
  while (enemies.length) removeEnemy(enemies[0]);
  deathEvents.length = 0;
}
