import test from 'node:test';
import assert from 'node:assert/strict';

import { prepareChapter, resetRuntimeEntities } from '../src/run-lifecycle.js';
import { resetPlayer } from '../src/player.js';
import { ownedWeapons, resetWeapons } from '../src/weapons.js';

function createServices(log) {
  const names = [
    'stopBgm',
    'clearStoryUi',
    'resetStoryDirector',
    'clearOverlays',
    'clearEnemies',
    'clearEnemyShots',
    'clearAllies',
    'clearProjectiles',
    'clearPickups',
    'clearEffects',
    'resetSpawner',
    'resetHacking',
    'resetWeapons',
    'resetUpgrades',
    'resetStats',
    'resetBoss',
    'resetPlayer',
  ];
  const services = Object.fromEntries(names.map((name) => [
    name,
    () => log.push(name),
  ]));
  services.addWeapon = (id) => log.push(`addWeapon:${id}`);
  return services;
}

test('런타임 초기화는 계약 순서대로 모든 소유 모듈을 정리한다', () => {
  const log = [];
  resetRuntimeEntities(createServices(log));

  assert.deepEqual(log, [
    'stopBgm',
    'clearStoryUi',
    'resetStoryDirector',
    'clearOverlays',
    'clearEnemies',
    'clearEnemyShots',
    'clearAllies',
    'clearProjectiles',
    'clearPickups',
    'clearEffects',
    'resetSpawner',
    'resetHacking',
    'resetWeapons',
    'resetUpgrades',
    'resetStats',
    'resetBoss',
    'resetPlayer',
  ]);
});

test('챕터를 두 번 준비해도 매번 새 RunState와 시작 무기 하나만 만든다', () => {
  const log = [];
  const services = createServices(log);
  const weapons = [];
  services.resetWeapons = () => {
    log.push('resetWeapons');
    weapons.length = 0;
  };
  services.addWeapon = (id) => {
    log.push(`addWeapon:${id}`);
    weapons.push(id);
  };

  const first = prepareChapter('ch1', services);
  const second = prepareChapter('ch1', services);

  assert.notEqual(first, second);
  assert.equal(first.chapterId, 'ch1');
  assert.equal(second.chapterId, 'ch1');
  assert.equal(log.filter((entry) => entry === 'addWeapon:smg').length, 2);
  assert.equal(log.filter((entry) => entry === 'resetWeapons').length, 2);
  assert.deepEqual(weapons, ['smg']);
  assert.ok(log.lastIndexOf('resetWeapons') < log.lastIndexOf('addWeapon:smg'));
});

test('resetPlayer는 위치·체력·애니메이션·사망 상태를 초기화한다', () => {
  const player = {
    x: 20,
    y: -30,
    hp: 0,
    maxHp: 160,
    facing: -1,
    invuln: 0.4,
    animTime: 1,
    frame: 1,
    dead: true,
    mesh: {
      position: { set(...args) { this.value = args; } },
      scale: { x: -1 },
      material: { opacity: 0.2 },
    },
  };

  resetPlayer(player);

  assert.deepEqual(
    {
      x: player.x,
      y: player.y,
      hp: player.hp,
      maxHp: player.maxHp,
      facing: player.facing,
      invuln: player.invuln,
      animTime: player.animTime,
      frame: player.frame,
      dead: player.dead,
    },
    {
      x: 0,
      y: 0,
      hp: 100,
      maxHp: 100,
      facing: 1,
      invuln: 0,
      animTime: 0,
      frame: 0,
      dead: false,
    },
  );
  assert.deepEqual(player.mesh.position.value, [0, 0, 1]);
  assert.equal(player.mesh.scale.x, 1);
  assert.equal(player.mesh.material.opacity, 1);
});

test('resetWeapons는 데이터 스파이크 mesh까지 scene에서 제거한다', () => {
  let removed = 0;
  ownedWeapons.push({
    id: 'spike',
    level: 1,
    cd: 0,
    state: {
      meshes: [{ removeFromParent() { removed += 1; } }],
      hitCd: new Map(),
    },
  });

  resetWeapons();

  assert.equal(removed, 1);
  assert.deepEqual(ownedWeapons, []);
});
