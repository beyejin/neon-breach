// 보스: 8:00 등장, 패턴 ① 예고선 돌진 ② 원형 탄막
// 적 배열에 통합되어 모든 무기/아군의 데미지를 그대로 받는다 (이동은 여기서 제어)
import {
  spawnEnemy,
  fireEnemyShot,
  damageEnemyRaw,
  setBossDamageHandler,
} from './enemies.js';
import { fxBeam, fxRing } from './effects.js';
import { makeQuad } from './renderer.js';
import { makeSprite } from './sprites.js';

export const boss = {
  active: false,
  hp: 0,
  maxHp: 3000,
  ref: null,
  policyNodeSpawned: false,
  policyLocked: false,
  policyResolved: false,
};

export const policyNode = {
  id: 'ch1-policy-node',
  active: false,
  resolving: false,
  x: 0,
  y: 0,
  mesh: null,
  hackTarget: false,
};

let st = null; // 패턴 상태

export function spawnBoss(player) {
  resetBoss();
  const a = Math.random() * Math.PI * 2;
  const e = spawnEnemy('boss', player.x + Math.cos(a) * 220, player.y + Math.sin(a) * 220);
  boss.active = true;
  boss.maxHp = e.maxHp;
  boss.ref = e;
  st = {
    patternTimer: 3,
    pattern: null, // 'dash' | 'burst'
    phase: 0,
    phaseTimer: 0,
    dashDir: { x: 0, y: 0 },
    volleys: 0,
  };
  fxRing(e.x, e.y, 80, '#b64a3f', 0.6);
}

function spawnPolicyNode() {
  if (boss.policyNodeSpawned || !boss.ref) return;
  boss.policyNodeSpawned = true;
  boss.policyLocked = true;
  policyNode.active = true;
  policyNode.resolving = false;
  policyNode.x = boss.ref.x + 34;
  policyNode.y = boss.ref.y;
  policyNode.mesh = makeQuad(makeSprite('spike'), 12, 12);
  boss.ref.mesh.parent?.add(policyNode.mesh);
  policyNode.mesh.position.set(policyNode.x, policyNode.y, 1.2);
  fxRing(policyNode.x, policyNode.y, 30, '#ff9f1c', 0.45);
}

export function applyBossDamage(amount) {
  const enemy = boss.ref;
  if (!boss.active || !enemy || enemy.hp <= 0 || boss.policyLocked) return false;

  const threshold = boss.maxHp * 0.5;
  if (!boss.policyNodeSpawned && enemy.hp - amount <= threshold) {
    enemy.hp = threshold;
    enemy.flash = 0.08;
    boss.hp = enemy.hp;
    spawnPolicyNode();
    return false;
  }

  const killed = damageEnemyRaw(enemy, amount);
  boss.hp = enemy.hp;
  return killed;
}

export function resolvePolicyNode() {
  if (!policyNode.active || policyNode.resolving) return false;
  policyNode.active = false;
  policyNode.resolving = true;
  policyNode.hackTarget = false;
  policyNode.mesh?.removeFromParent();
  policyNode.mesh = null;
  return true;
}

export function completePolicyNodeAudit() {
  if (!policyNode.resolving) return false;
  policyNode.resolving = false;
  boss.policyLocked = false;
  boss.policyResolved = true;
  return true;
}

export function updateBoss(dt, player) {
  if (!boss.active) return;
  const e = boss.ref;
  boss.hp = e.hp;

  // 사망 감지 (damageEnemy가 배열에서 제거함)
  if (e.hp <= 0) {
    boss.active = false;
    boss.ref = null;
    fxRing(e.x, e.y, 120, '#ffe600', 0.8);
    return;
  }

  const dx = player.x - e.x, dy = player.y - e.y;
  const dist = Math.hypot(dx, dy) || 1;

  if (policyNode.active) {
    const angle = performance.now() / 700;
    policyNode.x = e.x + Math.cos(angle) * 34;
    policyNode.y = e.y + Math.sin(angle) * 24;
    policyNode.mesh.position.set(policyNode.x, policyNode.y, 1.2);
    policyNode.mesh.rotation.z += dt * 2;
    policyNode.mesh.material.color.setHex(policyNode.hackTarget ? 0x00ffc8 : 0xff9f1c);
  }

  if (st.pattern === 'dash') {
    st.phaseTimer -= dt;
    if (st.phase === 0) {
      if (st.phaseTimer <= 0) {
        st.phase = 1;
        st.phaseTimer = 0.8;
        st.dashDir = { x: dx / dist, y: dy / dist };
      } else {
        // 예고선 (매 프레임 짧게 갱신)
        fxBeam(e.x, e.y, Math.atan2(dy, dx), 300, 2, '#b64a3f', 0.06);
      }
    } else {
      e.x += st.dashDir.x * 250 * dt;
      e.y += st.dashDir.y * 250 * dt;
      if (st.phaseTimer <= 0) { st.pattern = null; st.patternTimer = 5; }
    }
  } else if (st.pattern === 'burst') {
    st.phaseTimer -= dt;
    if (st.phaseTimer <= 0) {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + st.volleys * 0.13;
        fireEnemyShot(e.x, e.y, Math.cos(a) * 90, Math.sin(a) * 90, 10);
      }
      st.volleys++;
      if (st.volleys >= 3) { st.pattern = null; st.patternTimer = 5; }
      else st.phaseTimer = 0.3;
    }
  } else {
    // 저속 추적 + 다음 패턴 대기
    e.x += (dx / dist) * 30 * dt;
    e.y += (dy / dist) * 30 * dt;
    st.patternTimer -= dt;
    if (st.patternTimer <= 0) {
      st.pattern = Math.random() < 0.5 ? 'dash' : 'burst';
      if (st.pattern === 'dash') { st.phase = 0; st.phaseTimer = 1.0; }
      else { st.volleys = 0; st.phaseTimer = 0.01; }
    }
  }
}

export function resetBoss() {
  policyNode.mesh?.removeFromParent();
  policyNode.active = false;
  policyNode.resolving = false;
  policyNode.x = 0;
  policyNode.y = 0;
  policyNode.mesh = null;
  policyNode.hackTarget = false;
  boss.active = false;
  boss.hp = 0;
  boss.maxHp = 3000;
  boss.ref = null;
  boss.policyNodeSpawned = false;
  boss.policyLocked = false;
  boss.policyResolved = false;
  st = null;
}

setBossDamageHandler((_enemy, amount) => applyBossDamage(amount));
