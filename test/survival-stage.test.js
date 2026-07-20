import test from 'node:test';
import assert from 'node:assert/strict';

import { CHAPTER_1 } from '../src/content/chapter1.js';
import { STAGES } from '../src/content/stages.js';
import { SURVIVAL_1M } from '../src/content/survival1m.js';
import { ENEMY_TYPES } from '../src/enemies.js';

function rateTotal(wave) {
  return Object.values(wave.rates).reduce((total, rate) => total + rate, 0);
}

test('1분 극한 생존 스테이지는 60초 생존 승리와 보스 없는 고밀도 웨이브를 정의한다', () => {
  assert.equal(STAGES['survival-1m'], SURVIVAL_1M);
  assert.equal(SURVIVAL_1M.duration, 60);
  assert.deepEqual(SURVIVAL_1M.completion, { type: 'survive', duration: 60 });
  assert.equal(SURVIVAL_1M.boss, null);
  assert.equal(SURVIVAL_1M.initialBurst, 30);
  assert.equal(SURVIVAL_1M.spawner.speedMul, 1.4);
  assert.deepEqual(SURVIVAL_1M.spawner.spawnRadius, { min: 190, max: 240 });
  assert.equal(SURVIVAL_1M.waves.at(-1).until, 60);

  const untils = SURVIVAL_1M.waves.map((wave) => wave.until);
  assert.deepEqual(untils, [...untils].sort((a, b) => a - b));
  for (const wave of SURVIVAL_1M.waves) {
    for (const enemyId of Object.keys(wave.rates)) {
      assert.ok(ENEMY_TYPES[enemyId], enemyId);
    }
  }

  assert.ok(SURVIVAL_1M.waves.some((wave) => wave.rates.elite > 0));
  assert.ok(rateTotal(SURVIVAL_1M.waves[0]) >= 12);
  assert.ok(rateTotal(SURVIVAL_1M.waves.at(-1)) >= 60);
  assert.ok(rateTotal(SURVIVAL_1M.waves.at(-1)) > rateTotal(CHAPTER_1.waves.at(-1)) * 2);
});
