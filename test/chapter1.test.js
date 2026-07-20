import test from 'node:test';
import assert from 'node:assert/strict';

import { CHAPTER_1 } from '../src/content/chapter1.js';
import { CHAPTERS, getAvailableChapterIds } from '../src/content/chapters.js';
import { ENEMY_TYPES } from '../src/enemies.js';

test('CH1 웨이브는 오름차순이며 480초에 끝나고 모든 적 ID가 유효하다', () => {
  assert.equal(CHAPTER_1.id, 'ch1');
  assert.equal(CHAPTER_1.duration, 480);
  assert.equal(CHAPTER_1.waves.at(-1).until, 480);
  assert.deepEqual(
    CHAPTER_1.waves.map((wave) => wave.until),
    [48, 96, 144, 192, 264, 336, 408, 480],
  );
  for (const wave of CHAPTER_1.waves) {
    for (const enemyId of Object.keys(wave.rates)) {
      assert.ok(ENEMY_TYPES[enemyId], enemyId);
    }
  }
  assert.ok(ENEMY_TYPES[CHAPTER_1.boss.id]);
  assert.equal(CHAPTER_1.boss.spawnAt, 480);
});

test('CH1 스토리 이벤트 ID는 중복되지 않고 시간 트리거는 런 범위 안이다', () => {
  const ids = CHAPTER_1.storyEvents.map((event) => event.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const event of CHAPTER_1.storyEvents) {
    if (event.trigger.type !== 'time') continue;
    assert.ok(event.trigger.at >= 0 && event.trigger.at <= 480, event.id);
  }
});

test('콘텐츠 레지스트리는 구현된 CH1만 노출하고 진행 자격을 저장하지 않는다', () => {
  assert.deepEqual(Object.keys(CHAPTERS), ['ch1']);
  assert.deepEqual(getAvailableChapterIds({ completedChapters: {} }), ['ch1']);
  assert.deepEqual(getAvailableChapterIds({ completedChapters: { ch1: true } }), ['ch1']);
});
