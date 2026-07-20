import test from 'node:test';
import assert from 'node:assert/strict';

import {
  findHackTarget,
  hacking,
  resetHacking,
  tryHack,
} from '../src/hacking.js';
import { enemies } from '../src/enemies.js';

test.afterEach(() => {
  enemies.length = 0;
  resetHacking();
});

test('표식과 복구가 공유하는 최근접 비보스 대상을 반환한다', () => {
  const near = { x: 20, y: 0, boss: false };
  enemies.push(
    { x: 50, y: 0, boss: false },
    near,
    { x: 5, y: 0, boss: true },
    { x: 120, y: 0, boss: false },
  );

  assert.deepEqual(findHackTarget({ x: 0, y: 0 }), {
    kind: 'enemy',
    entity: near,
  });
});

test('활성 정책 노드는 일반 적보다 우선하고 게이지 0에서도 소비 없이 해결한다', () => {
  enemies.push({ x: 10, y: 0, boss: false });
  const node = { x: 30, y: 0, active: true };
  const target = findHackTarget({ x: 0, y: 0 }, node);
  let resolved = 0;
  hacking.gauge = 0;

  const result = tryHack({ x: 0, y: 0 }, target, {
    resolvePolicyNode: () => {
      resolved += 1;
      return true;
    },
  });

  assert.equal(result.kind, 'policy-node');
  assert.equal(result.success, true);
  assert.equal(hacking.gauge, 0);
  assert.equal(resolved, 1);
  assert.equal(enemies.length, 1);
});
