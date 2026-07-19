// 보스: 8:00 등장, 패턴 ① 예고선 돌진 ② 원형 탄막
// 적 배열에 통합되어 모든 무기/아군의 데미지를 그대로 받는다 (이동은 여기서 제어)
import { spawnEnemy, fireEnemyShot } from './enemies.js';
import { fxBeam, fxRing } from './effects.js';

export const boss = { active: false, hp: 0, maxHp: 3000, ref: null };

let st = null; // 패턴 상태

export function spawnBoss(player) {
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
  fxRing(e.x, e.y, 80, '#ff2d78', 0.6);
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

  if (st.pattern === 'dash') {
    st.phaseTimer -= dt;
    if (st.phase === 0) {
      if (st.phaseTimer <= 0) {
        st.phase = 1;
        st.phaseTimer = 0.8;
        st.dashDir = { x: dx / dist, y: dy / dist };
      } else {
        // 예고선 (매 프레임 짧게 갱신)
        fxBeam(e.x, e.y, Math.atan2(dy, dx), 300, 2, '#ff2d55', 0.06);
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
