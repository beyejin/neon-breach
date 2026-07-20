import { createRunState } from './session.js';

const RESET_ORDER = [
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

export function resetRuntimeEntities(services) {
  for (const name of RESET_ORDER) services[name]();
}

export function prepareChapter(chapterId, services) {
  resetRuntimeEntities(services);
  const runState = createRunState(chapterId);
  services.addWeapon('smg');
  return runState;
}
