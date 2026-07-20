import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import {
  applyBossDamage,
  boss,
  completePolicyNodeAudit,
  policyNode,
  resetBoss,
  resolvePolicyNode,
  spawnBoss,
} from '../src/boss.js';
import {
  clearEnemies,
  deathEvents,
  initEnemies,
} from '../src/enemies.js';
import { clearEffects, initEffects } from '../src/effects.js';

test('큰 단일 피해도 보스를 50%에 고정하고 정책 노드 완료 전 사망시키지 않는다', () => {
  globalThis.document = {
    createElement() {
      return {
        width: 0,
        height: 0,
        getContext() {
          return { fillStyle: '', fillRect() {} };
        },
      };
    },
  };
  const scene = new THREE.Scene();
  initEnemies(scene);
  initEffects(scene);
  spawnBoss({ x: 0, y: 0 });
  boss.ref.hp = boss.maxHp * 0.51;

  assert.equal(applyBossDamage(boss.maxHp), false);
  assert.equal(boss.ref.hp, boss.maxHp * 0.5);
  assert.equal(policyNode.active, true);
  assert.equal(deathEvents.length, 0);

  assert.equal(applyBossDamage(100), false);
  assert.equal(boss.ref.hp, boss.maxHp * 0.5);
  assert.equal(resolvePolicyNode(), true);
  assert.equal(policyNode.active, false);
  assert.equal(applyBossDamage(100), false);

  completePolicyNodeAudit();
  assert.equal(applyBossDamage(boss.maxHp), true);
  assert.equal(deathEvents.at(-1).boss, true);

  clearEnemies();
  clearEffects();
  resetBoss();
  deathEvents.length = 0;
});
