import test from 'node:test';
import assert from 'node:assert/strict';

test('Node test runner executes assertions', () => {
  assert.equal(480 / 60, 8);
});
