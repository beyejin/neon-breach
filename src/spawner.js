// 시간 기반 웨이브 테이블
import { spawnEnemy, enemies } from './enemies.js';

const MAX_ALIVE = 300;

const acc = {};        // 타입별 스폰 누적치
let eliteTimer = 0;

export function resetSpawner() {
  for (const k in acc) acc[k] = 0;
  eliteTimer = 0;
}

// 시작 직후 심심하지 않게 링 형태로 즉시 투입
export function initialBurst(player, count = 14, options = {}) {
  const total = Math.max(0, Math.floor(count));
  const radiusMin = options.initialBurstRadius?.min ?? 200;
  const radiusMax = options.initialBurstRadius?.max ?? radiusMin;
  const speedMul = options.speedMul ?? 1;
  for (let i = 0; i < total; i++) {
    const a = (i / total) * Math.PI * 2;
    const radius = radiusMin + Math.random() * (radiusMax - radiusMin);
    spawnEnemy(
      'rushbot',
      player.x + Math.cos(a) * radius,
      player.y + Math.sin(a) * radius,
      1,
      speedMul,
    );
  }
}

function spawnPos(player, radiusMin = 240, radiusMax = 300) {
  const a = Math.random() * Math.PI * 2;
  const r = radiusMin + Math.random() * (radiusMax - radiusMin); // 화면 밖 링
  return { x: player.x + Math.cos(a) * r, y: player.y + Math.sin(a) * r };
}

export function updateSpawner(dt, elapsed, player, waves, active = true, options = {}) {
  if (!active || enemies.length >= MAX_ALIVE) return;

  const wave = waves.find(w => elapsed < w.until) || waves[waves.length - 1];
  const hpMul = 1 + (elapsed / 60) * 0.28; // 분당 +28% 체력 (8분 압축에 맞춰 상향)
  const speedMul = options.speedMul ?? 1;
  const radiusMin = options.spawnRadius?.min ?? 240;
  const radiusMax = options.spawnRadius?.max ?? 300;

  for (const [type, rate] of Object.entries(wave.rates)) {
    acc[type] = (acc[type] || 0) + rate * dt;
    while (acc[type] >= 1) {
      acc[type] -= 1;
      const p = spawnPos(player, radiusMin, radiusMax);
      spawnEnemy(type, p.x, p.y, hpMul, speedMul);
    }
  }

  // 엘리트: 1:12부터 30초마다
  if (elapsed > 72) {
    eliteTimer += dt;
    if (eliteTimer >= 30) {
      eliteTimer = 0;
      const p = spawnPos(player, radiusMin, radiusMax);
      spawnEnemy('elite', p.x, p.y, hpMul, speedMul);
    }
  }
}
