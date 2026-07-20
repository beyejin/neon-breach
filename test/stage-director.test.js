import test from 'node:test';
import assert from 'node:assert/strict';

import { createRunState } from '../src/session.js';
import { createStageDirector } from '../src/stage-director.js';

const chapter = {
  boss: { spawnAt: 480 },
  storyEvents: [
    { id: 't48', trigger: { type: 'time', at: 48 } },
    { id: 't144', trigger: { type: 'time', at: 144 } },
    { id: 'hack1', trigger: { type: 'first-hack' } },
    { id: 'hack6', trigger: { type: 'hack-count', count: 6 } },
  ],
};

test('프레임이 시간 경계를 건너도 이벤트를 한 번만 순서대로 발생시킨다', () => {
  const runState = createRunState('ch1');
  const fired = [];
  const director = createStageDirector({
    chapter,
    runState,
    onStoryEvent: (event) => fired.push(event.id),
  });

  director.advance(47.9, 48.1);
  director.advance(48.1, 48.2);
  director.advance(48.2, 150);

  assert.deepEqual(fired, ['t48', 't144']);
  assert.deepEqual(runState.firedStoryEventIds, ['t48', 't144']);
});

test('한 프레임에 여러 시간 경계를 건너도 시간순을 보존한다', () => {
  const fired = [];
  const director = createStageDirector({
    chapter,
    runState: createRunState('ch1'),
    onStoryEvent: (event) => fired.push(event.id),
  });

  director.advance(0, 200);

  assert.deepEqual(fired, ['t48', 't144']);
});

test('신호 트리거와 보스 spawn 경계도 런마다 한 번만 전달한다', () => {
  const runState = createRunState('ch1');
  const fired = [];
  let bossSpawns = 0;
  const director = createStageDirector({
    chapter,
    runState,
    onStoryEvent: (event) => fired.push(event.id),
    onBossSpawn: () => { bossSpawns += 1; },
  });

  director.signal('first-hack');
  director.signal('first-hack');
  director.signal('hack-count', { count: 5 });
  director.signal('hack-count', { count: 6 });
  director.advance(479.9, 480.1);
  director.advance(480.1, 481);

  assert.deepEqual(fired, ['hack1', 'hack6']);
  assert.equal(bossSpawns, 1);
  assert.equal(runState.bossSpawned, true);
});

test('보스가 없는 생존 스테이지는 시간 경계를 지나도 보스를 생성하지 않는다', () => {
  const bosslessStage = {
    boss: null,
    storyEvents: [],
  };
  let bossSpawns = 0;
  const director = createStageDirector({
    chapter: bosslessStage,
    runState: createRunState('survival-1m'),
    onBossSpawn: () => { bossSpawns += 1; },
  });

  assert.doesNotThrow(() => director.advance(59.9, 60.1));
  assert.equal(bossSpawns, 0);
});
