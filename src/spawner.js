// 시간 기반 웨이브 테이블
import { spawnEnemy, enemies } from './enemies.js';

const MAX_ALIVE = 300;

// 분 단위 스폰율 (마리/초)
const WAVES = [
  { until: 60,  rates: { rushbot: 2.8 } },
  { until: 120, rates: { rushbot: 3.0, shooterbot: 0.5 } },
  { until: 180, rates: { rushbot: 3.4, shooterbot: 0.7 } },
  { until: 240, rates: { rushbot: 2.2, shooterbot: 0.8, tankbot: 0.3 } },
  { until: 330, rates: { rushbot: 2.6, shooterbot: 1.0, tankbot: 0.45 } },
  { until: 420, rates: { rushbot: 3.2, shooterbot: 1.2, tankbot: 0.6 } },
  { until: 510, rates: { rushbot: 4.0, shooterbot: 1.5, tankbot: 0.8 } },
  { until: 600, rates: { rushbot: 5.0, shooterbot: 2.0, tankbot: 1.0 } },
];

const acc = {};        // 타입별 스폰 누적치
let eliteTimer = 0;

export function resetSpawner() {
  for (const k in acc) acc[k] = 0;
  eliteTimer = 0;
}

// 시작 직후 심심하지 않게 링 형태로 즉시 투입
export function initialBurst(player) {
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    spawnEnemy('rushbot', player.x + Math.cos(a) * 200, player.y + Math.sin(a) * 200, 1);
  }
}

function spawnPos(player) {
  const a = Math.random() * Math.PI * 2;
  const r = 240 + Math.random() * 60; // 화면 밖 링
  return { x: player.x + Math.cos(a) * r, y: player.y + Math.sin(a) * r };
}

export function updateSpawner(dt, elapsed, player, active = true) {
  if (!active || enemies.length >= MAX_ALIVE) return;

  const wave = WAVES.find(w => elapsed < w.until) || WAVES[WAVES.length - 1];
  const hpMul = 1 + (elapsed / 60) * 0.22; // 분당 +22% 체력

  for (const [type, rate] of Object.entries(wave.rates)) {
    acc[type] = (acc[type] || 0) + rate * dt;
    while (acc[type] >= 1) {
      acc[type] -= 1;
      const p = spawnPos(player);
      spawnEnemy(type, p.x, p.y, hpMul);
    }
  }

  // 엘리트: 1:30부터 30초마다
  if (elapsed > 90) {
    eliteTimer += dt;
    if (eliteTimer >= 30) {
      eliteTimer = 0;
      const p = spawnPos(player);
      spawnEnemy('elite', p.x, p.y, hpMul);
    }
  }
}
