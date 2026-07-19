// 해킹된 아군 (최대 5기)
import { makeQuad } from './renderer.js';
import { makeSprite, spriteSize } from './sprites.js';
import { ENEMY_TYPES, nearby, damageEnemy } from './enemies.js';

export const MAX_ALLIES = 5;
export const allies = [];
let sceneRef = null;

export function initAllies(scene) { sceneRef = scene; }

export function addAlly(fromEnemy) {
  // 초과 시 최고참 소멸
  if (allies.length >= MAX_ALLIES) {
    const old = allies.shift();
    old.mesh.removeFromParent();
  }
  const t = ENEMY_TYPES[fromEnemy.type];
  const { w, h } = spriteSize(t.sprite);
  const mesh = makeQuad(makeSprite(t.sprite, 0, 'ally'), w, h);
  sceneRef.add(mesh);
  const a = {
    type: fromEnemy.type,
    x: fromEnemy.x, y: fromEnemy.y,
    dmg: t.dmg * 1.2,
    speed: t.speed * 1.3 + 20,
    radius: t.radius,
    atkCd: 0,
    orbit: Math.random() * Math.PI * 2, // 대기 위치 각도
    mesh,
  };
  allies.push(a);
  return a;
}

export function updateAllies(dt, player) {
  for (const a of allies) {
    a.atkCd = Math.max(0, a.atkCd - dt);

    // 교전 대상: 반경 140 내 최근접 적
    let target = null, bd = 140 * 140;
    for (const e of nearby(a.x, a.y, 140)) {
      const d = (e.x - a.x) ** 2 + (e.y - a.y) ** 2;
      if (d < bd) { bd = d; target = e; }
    }

    let tx, ty;
    if (target) {
      tx = target.x; ty = target.y;
    } else {
      // 플레이어 주위 배회
      a.orbit += dt * 0.7;
      tx = player.x + Math.cos(a.orbit) * 26;
      ty = player.y + Math.sin(a.orbit) * 26;
    }

    const dx = tx - a.x, dy = ty - a.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > 4) {
      a.x += (dx / d) * a.speed * dt;
      a.y += (dy / d) * a.speed * dt;
    }

    // 공격 (접촉)
    if (target && d < a.radius + target.radius + 3 && a.atkCd <= 0) {
      damageEnemy(target, a.dmg);
      a.atkCd = 0.5;
    }

    a.mesh.position.set(a.x, a.y, 0.6);
    a.mesh.scale.x = dx > 0 ? 1 : -1;
  }
}

export function clearAllies() {
  for (const a of allies) a.mesh.removeFromParent();
  allies.length = 0;
}
