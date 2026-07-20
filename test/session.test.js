import test from 'node:test';
import assert from 'node:assert/strict';

import {
  APP_MODES,
  canTransition,
  createRunState,
  transitionAppMode,
} from '../src/session.js';

test('AppMode는 제품 계약의 허용 전이만 통과시킨다', () => {
  const allowed = [
    ['title', 'briefing'],
    ['title', 'archive'],
    ['archive', 'title'],
    ['briefing', 'playing'],
    ['playing', 'levelup'],
    ['levelup', 'playing'],
    ['playing', 'audit'],
    ['audit', 'playing'],
    ['playing', 'victory'],
    ['playing', 'defeat'],
    ['victory', 'title'],
    ['victory', 'briefing'],
    ['defeat', 'briefing'],
  ];

  for (const [from, to] of allowed) {
    assert.equal(canTransition(from, to), true, `${from} -> ${to}`);
    assert.equal(transitionAppMode(from, to), to);
  }

  for (const from of Object.values(APP_MODES)) {
    for (const to of Object.values(APP_MODES)) {
      if (allowed.some(([a, b]) => a === from && b === to)) continue;
      assert.equal(canTransition(from, to), false, `${from} -/-> ${to}`);
    }
  }
  assert.throws(() => transitionAppMode('playing', 'title'), /허용되지 않은 AppMode 전이/);
});

test('CH1 RunState는 저장되지 않는 런 기본값으로 매번 새로 생성된다', () => {
  const first = createRunState('ch1');
  const second = createRunState('ch1');

  assert.deepEqual(first, {
    chapterId: 'ch1',
    elapsed: 0,
    blocks: 0,
    level: 1,
    xp: 0,
    bossSpawned: false,
    hackSuccessCount: 0,
    dispatchedDroneCount: 0,
    firedStoryEventIds: [],
    pendingStoryEventIds: [],
  });
  assert.notEqual(first, second);
  assert.notEqual(first.firedStoryEventIds, second.firedStoryEventIds);
  assert.notEqual(first.pendingStoryEventIds, second.pendingStoryEventIds);
});
