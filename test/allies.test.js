import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import {
  addAlly,
  allies,
  clearAllies,
  departingAllies,
  initAllies,
} from '../src/allies.js';

test('여섯 번째부터 최고참 드론을 삭제하지 않고 현장 파견 상태로 전환한다', () => {
  globalThis.document = {
    createElement() {
      return {
        width: 0,
        height: 0,
        getContext() {
          return { fillStyle: '', fillRect() {} };
        },
        addEventListener() {},
      };
    },
  };
  const scene = new THREE.Scene();
  initAllies(scene);

  const results = [];
  for (let index = 0; index < 7; index += 1) {
    results.push(addAlly({
      type: 'rushbot',
      x: index,
      y: index,
    }));
  }

  assert.equal(allies.length, 5);
  assert.equal(departingAllies.length, 2);
  assert.equal(results[4].dispatched, null);
  assert.equal(results[5].dispatched, results[0].added);
  assert.equal(results[6].dispatched, results[1].added);
  assert.ok(departingAllies.every((ally) => ally.mesh.parent === scene));

  clearAllies();

  assert.equal(allies.length, 0);
  assert.equal(departingAllies.length, 0);
  assert.ok(results.every(({ added }) => added.mesh.parent === null));
});
