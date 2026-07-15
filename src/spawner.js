// 시간 기반 웨이브 테이블
import { spawnEnemy, enemies } from './enemies.js';

const MAX_ALIVE = 220;

// 분 단위 스폰율 (마리/초)
const WAVES = [
  { until: 60,  rates: { rushbot: 0.8 } },
  { until: 120, rates: { rushbot: 1.2, shooterbot: 0.3 } },
  { until: 180, rates: { rushbot: 1.5, shooterbot: 0.5 } },
  { until: 240, rates: { rushbot: 1.6, shooterbot: 0.6, tankbot: 0.2 } },
  { until: 330, rates: { rushbot: 2.0, shooterbot: 0.8, tankbot: 0.35 } },
  { until: 420, rates: { rushbot: 2.6, shooterbot: 1.0, tankbot: 0.5 } },
  { until: 510, rates: { rushbot: 3.2, shooterbot: 1.3, tankbot: 0.7 } },
  { until: 600, rates: { rushbot: 4.0, shooterbot: 1.6, tankbot: 0.9 } },
];

const acc = {};        // 타입별 스폰 누적치
let eliteTimer = 0;

export function resetSpawner() {
  for (const k in acc) acc[k] = 0;
  eliteTimer = 0;
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
