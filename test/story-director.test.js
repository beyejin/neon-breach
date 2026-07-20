import test from 'node:test';
import assert from 'node:assert/strict';

import { createRunState } from '../src/session.js';
import { createStoryDirector, shouldPresentStoryEvent } from '../src/story-director.js';

function event(overrides = {}) {
  return {
    id: 'core',
    presentation: 'comms',
    replay: 'profile-once',
    communication: 'core',
    priority: 50,
    maxDelay: 8,
    ...overrides,
  };
}

test('full/core/off 통신 필터는 차단형 절차를 항상 보존한다', () => {
  const tutorial = event({ id: 'tutorial', communication: 'tutorial' });
  const core = event({ id: 'core', communication: 'core' });
  const procedure = event({
    id: 'procedure',
    presentation: 'audit',
    communication: 'required',
  });

  assert.equal(shouldPresentStoryEvent(tutorial, 'full'), true);
  assert.equal(shouldPresentStoryEvent(tutorial, 'core'), false);
  assert.equal(shouldPresentStoryEvent(core, 'core'), true);
  assert.equal(shouldPresentStoryEvent(core, 'off'), false);
  assert.equal(shouldPresentStoryEvent(procedure, 'off'), true);
});

test('위험 중 핵심 통신은 최대 8초 미룬 뒤 표시하고 완료 후 한 번 저장한다', async () => {
  const profile = {
    seenStoryEventIds: [],
    communicationMode: 'full',
  };
  const runState = createRunState('ch1');
  const presented = [];
  let saves = 0;
  const director = createStoryDirector({
    profile,
    runState,
    present: async (item) => {
      presented.push(item.id);
      return { status: 'completed' };
    },
    save: () => { saves += 1; },
  });

  director.enqueue(event(), 10);
  assert.equal(director.update({ now: 17.9, dangerous: true }), null);
  const shown = director.update({ now: 18, dangerous: true });
  assert.equal(shown.id, 'core');
  await director.whenIdle();

  assert.deepEqual(presented, ['core']);
  assert.deepEqual(profile.seenStoryEventIds, ['core']);
  assert.equal(saves, 1);
  assert.deepEqual(runState.pendingStoryEventIds, []);
});

test('이미 본 profile-once는 생략하고 always 절차는 반복한다', async () => {
  const profile = {
    seenStoryEventIds: ['seen'],
    communicationMode: 'full',
  };
  const presented = [];
  const director = createStoryDirector({
    profile,
    runState: createRunState('ch1'),
    present: async (item) => {
      presented.push(item.id);
      return { status: 'completed' };
    },
    save() {},
  });

  assert.equal(director.enqueue(event({ id: 'seen' }), 0), false);
  assert.equal(director.enqueue(event({ id: 'audit', replay: 'always', presentation: 'audit' }), 0), true);
  director.update({ now: 0, dangerous: false });
  await director.whenIdle();

  assert.deepEqual(presented, ['audit']);
});

test('UI 취소와 reset은 seen이나 자동 저장을 남기지 않는다', async () => {
  const profile = {
    seenStoryEventIds: [],
    communicationMode: 'full',
  };
  let saves = 0;
  let resolvePresentation;
  const director = createStoryDirector({
    profile,
    runState: createRunState('ch1'),
    present: () => new Promise((resolve) => { resolvePresentation = resolve; }),
    save: () => { saves += 1; },
  });

  director.enqueue(event(), 0);
  director.update({ now: 0, dangerous: false });
  director.reset();
  resolvePresentation({ status: 'cancelled' });
  await director.whenIdle();

  assert.deepEqual(profile.seenStoryEventIds, []);
  assert.equal(saves, 0);
});
