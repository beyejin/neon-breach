import { createRenderer } from './renderer.js';
import { axis, consumePressed, flushInput } from './input.js';
import { createPlayer, resetPlayer } from './player.js';
import { createBackground } from './background.js';
import {
  initEnemies,
  updateEnemies,
  deathEvents,
  enemies,
  spawnEnemy,
  updateEnemyShots,
  clearEnemies,
  clearEnemyShots,
  nearby,
  damageEnemy,
} from './enemies.js';
import {
  initAllies,
  updateAllies,
  allies,
  departingAllies,
  clearAllies,
} from './allies.js';
import {
  hacking,
  addCharge,
  findHackTarget,
  markHackTarget,
  tryHack,
  resetHacking,
} from './hacking.js';
import { updateSpawner, initialBurst, resetSpawner } from './spawner.js';
import {
  initHud,
  updateHud,
  showOverlay,
  updateBossBar,
  removeOverlay,
  setHudVisible,
} from './hud.js';
import {
  applyBossDamage,
  boss,
  completePolicyNodeAudit,
  policyNode,
  resetBoss,
  resolvePolicyNode,
  spawnBoss,
  updateBoss,
} from './boss.js';
import { initProjectiles, updateProjectiles, clearProjectiles } from './projectiles.js';
import {
  addWeapon,
  updateWeapons,
  initWeapons,
  resetWeapons,
} from './weapons.js';
import {
  initEffects,
  updateEffects,
  fxFlash,
  fxDebris,
  clearEffects,
} from './effects.js';
import { COL } from './sprites.js';
import {
  initPickups,
  dropGem,
  updatePickups,
  clearPickups,
} from './pickups.js';
import {
  xpForLevel,
  rollChoices,
  applyChoice,
  resetUpgrades,
} from './upgrades.js';
import { resetStats } from './stats.js';
import {
  initAudio,
  sfx,
  startBgm,
  stopBgm,
  setMuted,
  toggleMute,
} from './audio.js';
import { APP_MODES, createRunState, transitionAppMode } from './session.js';
import { prepareChapter } from './run-lifecycle.js';
import { loadProfile, saveProfile } from './profile-store.js';
import { applyTheme } from './theme.js';
import { CHAPTERS } from './content/chapters.js';
import { STAGES } from './content/stages.js';
import { createStageDirector } from './stage-director.js';
import { createStoryDirector } from './story-director.js';
import {
  advanceAudit,
  clear as clearStoryUi,
  openArchive,
  showAuditCards,
  showBriefing,
  showComms,
  showStoryResult,
  showTitleScreen,
  setStoryTheme,
} from './story-ui.js';

const canvas = document.getElementById('game');
const renderer = createRenderer(canvas);
const background = createBackground(renderer.scene);
initEnemies(renderer.scene);
initHud();

const player = createPlayer(renderer.scene);
initProjectiles(renderer.scene);
initPickups(renderer.scene);
initWeapons(renderer.scene);
initEffects(renderer.scene);
initAllies(renderer.scene);

const app = { mode: APP_MODES.TITLE };
const profileContext = loadProfile();
const profile = profileContext.profile;

function applySelectedTheme(themeId, persist = false) {
  profile.settings.theme = themeId;
  const theme = applyTheme(themeId);
  renderer.setTheme(theme);
  background.setTheme(theme);
  setStoryTheme(theme.id);
  if (persist) saveCurrentProfile();
  return theme;
}

applySelectedTheme(profile.settings.theme);
setMuted(profile.settings.muted);

let chapter = STAGES.ch1;
let runState = createRunState(chapter.id);
let stageDirector = null;
let storyDirector = null;
let levelUpOverlay = null;
let activeChoices = [];
let currentHackTarget = null;
let retrying = false;
let lastDamageAt = -Infinity;

const shake = { t: 0, mag: 0 };

function saveCurrentProfile() {
  return saveProfile(profile, profileContext);
}

function setAppMode(next) {
  app.mode = transitionAppMode(app.mode, next);
  setHudVisible(next === APP_MODES.PLAYING);
}

function clearOverlays() {
  removeOverlay(levelUpOverlay);
  levelUpOverlay = null;
  activeChoices = [];
}

function resetStoryDirector() {
  storyDirector?.reset();
}

const lifecycleServices = {
  stopBgm,
  clearStoryUi,
  resetStoryDirector,
  clearOverlays,
  clearEnemies,
  clearEnemyShots,
  clearAllies,
  clearProjectiles,
  clearPickups,
  clearEffects,
  resetSpawner,
  resetHacking,
  resetWeapons,
  resetUpgrades,
  resetStats,
  resetBoss,
  resetPlayer: () => resetPlayer(player),
  addWeapon,
};

function storyEvent(triggerType, targetChapter = chapter) {
  return targetChapter.storyEvents.find((event) => event.trigger.type === triggerType);
}

function archiveEntries() {
  const auditEvent = storyEvent('boss-hp-ratio', CHAPTERS.ch1);
  if (!profile.archiveEntryIds.includes(auditEvent.payload.archiveEntryId)) return [];
  return [{
    title: 'CHAPTER 1 — 감사 원문',
    lines: auditEvent.payload.archiveLines,
  }];
}

function presentStoryEvent(event) {
  if (event.presentation === 'comms') return showComms(event);
  if (event.presentation !== 'audit') {
    return Promise.resolve({ status: 'completed' });
  }

  const entryId = event.payload.archiveEntryId;
  const alreadySeen = profile.archiveEntryIds.includes(entryId);
  const cards = alreadySeen
    ? event.payload.cards.map((card) => ({
      ...card,
      lines: card.lines.filter((line) => !line.startsWith('이도:')),
    }))
    : event.payload.cards;
  return showAuditCards(cards, {
    alreadySeen,
    onEnter: () => setAppMode(APP_MODES.AUDIT),
    onExit: () => {
      if (app.mode === APP_MODES.AUDIT) setAppMode(APP_MODES.PLAYING);
    },
  }).then((result) => {
    if (result.status !== 'completed') return result;
    completePolicyNodeAudit();
    if (!profile.archiveEntryIds.includes(entryId)) {
      profile.archiveEntryIds.push(entryId);
    }
    saveCurrentProfile();
    return result;
  });
}

function configureDirectors() {
  storyDirector = createStoryDirector({
    profile,
    runState,
    present: presentStoryEvent,
    save: saveCurrentProfile,
  });
  stageDirector = createStageDirector({
    chapter,
    runState,
    onStoryEvent: (event) => {
      if (event.presentation === 'comms' || event.presentation === 'audit') {
        storyDirector.enqueue(event, runState.elapsed);
      }
    },
    onBossSpawn: () => {
      spawnBoss(player);
      addShake(6, 0.5);
      sfx.boss();
    },
  });
  stageDirector.signal('chapter-start');
}

function resetCamera() {
  shake.t = 0;
  shake.mag = 0;
  renderer.camera.position.x = 0;
  renderer.camera.position.y = 0;
  background.update(0, 0);
}

function prepareRun(chapterId, isRetry) {
  chapter = STAGES[chapterId];
  runState = prepareChapter(chapterId, lifecycleServices);
  retrying = isRetry;
  lastDamageAt = -Infinity;
  currentHackTarget = null;
  resetCamera();
  configureDirectors();
}

function renderBriefing() {
  const content = storyEvent('chapter-start').payload;
  showBriefing(content, {
    retry: retrying,
    onStart: beginPlaying,
  });
}

function startChapter(chapterId = 'ch1') {
  if (app.mode !== APP_MODES.TITLE) return false;
  prepareRun(chapterId, false);
  setAppMode(APP_MODES.BRIEFING);
  renderBriefing();
  return true;
}

function restartChapter() {
  if (![APP_MODES.DEFEAT, APP_MODES.VICTORY].includes(app.mode)) return false;
  const chapterId = runState.chapterId;
  prepareRun(chapterId, true);
  setAppMode(APP_MODES.BRIEFING);
  renderBriefing();
  return true;
}

function beginPlaying() {
  clearStoryUi();
  setAppMode(APP_MODES.PLAYING);
  initialBurst(player, chapter.initialBurst ?? 14, chapter.spawner);
  initAudio();
  setMuted(profile.settings.muted);
  startBgm();
}

function showTitle() {
  clearStoryUi();
  const content = storyEvent('chapter-start', CHAPTERS.ch1).payload;
  const entries = archiveEntries();
  showTitleScreen(content, {
    nextChapterPending: profile.completedChapters.ch1 === true,
    theme: profile.settings.theme,
    onThemeChange: (themeId) => {
      applySelectedTheme(themeId, true);
      showTitle();
    },
    onStart: () => startChapter('ch1'),
    onChallengeStart: () => startChapter('survival-1m'),
    onArchive: entries.length > 0 ? openProfileArchive : null,
  });
}

function returnToTitle() {
  stopBgm();
  clearStoryUi();
  clearOverlays();
  setAppMode(APP_MODES.TITLE);
  showTitle();
}

function openProfileArchive() {
  clearStoryUi();
  setAppMode(APP_MODES.ARCHIVE);
  openArchive(archiveEntries(), {
    onClose: () => {
      clearStoryUi();
      setAppMode(APP_MODES.TITLE);
      showTitle();
    },
  });
}

function showDefeat() {
  stageDirector.signal('defeat');
  setAppMode(APP_MODES.DEFEAT);
  stopBgm();
  clearStoryUi();
  sfx.lose();
  const result = {
    ...storyEvent('defeat').payload,
    resultLines: [
      `생존 시간 ${formatTime(runState.elapsed)}`,
      `차단 ${runState.blocks}`,
    ],
  };
  showStoryResult(result, {
    onReplay: restartChapter,
    replayLabel: '다시 시도',
  });
}

function renderVictory() {
  clearStoryUi();
  const result = {
    ...storyEvent('victory').payload,
    ...(chapter.id === 'ch1' ? { dispatchedDroneCount: runState.dispatchedDroneCount } : {}),
  };
  showStoryResult(result, {
    onPrimary: returnToTitle,
    onReplay: restartChapter,
    communicationMode: profile.communicationMode,
    onCommunicationMode: (mode) => {
      profile.communicationMode = mode;
      saveCurrentProfile();
      renderVictory();
    },
  });
}

function showVictory() {
  stageDirector.signal('victory');
  if (chapter.persistCompletion !== false) {
    profile.completedChapters[runState.chapterId] = true;
    saveCurrentProfile();
  }
  setAppMode(APP_MODES.VICTORY);
  stopBgm();
  sfx.win();
  renderVictory();
}

function openLevelUp() {
  setAppMode(APP_MODES.LEVELUP);
  sfx.levelup();
  activeChoices = rollChoices();
  const cardsHtml = activeChoices.map((choice, index) => `
    <div class="card" data-i="${index}">
      <div class="tag">${choice.tag}</div>
      <div class="title">${choice.title}</div>
      <div class="desc">${choice.desc}</div>
    </div>
  `).join('');
  levelUpOverlay = showOverlay(`
    <h1 class="accent-primary" style="font-size:26px;">현장 장비 보강</h1>
    <div class="cards">${cardsHtml}</div>
  `);
  levelUpOverlay.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', () => chooseUpgrade(Number(card.dataset.i)));
  });
}

function chooseUpgrade(index) {
  if (app.mode !== APP_MODES.LEVELUP || !activeChoices[index]) return false;
  applyChoice(activeChoices[index], player);
  clearOverlays();
  setAppMode(APP_MODES.PLAYING);
  return true;
}

function formatTime(value) {
  const minutes = String(Math.floor(value / 60)).padStart(2, '0');
  const seconds = String(Math.floor(value % 60)).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function addShake(magnitude, duration = 0.25) {
  shake.mag = Math.max(shake.mag, magnitude);
  shake.t = Math.max(shake.t, duration);
}

function onExplode(x, y, radius, damage) {
  fxFlash(x, y, radius, '#ffe600', 0.25);
  sfx.boom();
  for (const enemy of nearby(x, y, radius)) {
    if (Math.hypot(enemy.x - x, enemy.y - y) <= radius + enemy.radius) {
      damageEnemy(enemy, damage);
    }
  }
}

function handleAppInput() {
  if (consumePressed('KeyM')) {
    profile.settings.muted = toggleMute();
    saveCurrentProfile();
  }
  if (app.mode === APP_MODES.AUDIT && consumePressed('Space')) {
    advanceAudit();
  }
}

function handleHackInput() {
  currentHackTarget = findHackTarget(player, policyNode);
  markHackTarget(currentHackTarget);
  if (!consumePressed('Space')) return;

  if (currentHackTarget?.kind === 'policy-node' && storyDirector.isBusy()) return;

  const result = tryHack(player, currentHackTarget, { resolvePolicyNode });
  if (!result) return;
  sfx.hack();

  if (result.kind === 'policy-node') {
    clearStoryUi();
    stageDirector.signal('boss-hp-ratio', { ratio: 0.5 });
    return;
  }

  runState.hackSuccessCount += 1;
  if (result.allyResult.dispatched) runState.dispatchedDroneCount += 1;
  if (runState.hackSuccessCount === 1) stageDirector.signal('first-hack');
  stageDirector.signal('hack-count', { count: runState.hackSuccessCount });
}

function updateCamera(dt) {
  shake.t = Math.max(0, shake.t - dt);
  if (shake.t <= 0) shake.mag = 0;
  const sx = shake.mag * (Math.random() * 2 - 1) * (shake.t > 0 ? 1 : 0);
  const sy = shake.mag * (Math.random() * 2 - 1) * (shake.t > 0 ? 1 : 0);
  renderer.camera.position.x += (
    (player.x - renderer.camera.position.x) * Math.min(1, dt * 8)
    + sx * dt * 20
  );
  renderer.camera.position.y += (
    (player.y - renderer.camera.position.y) * Math.min(1, dt * 8)
    + sy * dt * 20
  );
  background.update(renderer.camera.position.x, renderer.camera.position.y);
}

function updateHudState() {
  updateHud({
    elapsed: runState.elapsed,
    level: runState.level,
    blocks: runState.blocks,
    xpRatio: runState.xp / xpForLevel(runState.level),
    hp: player.hp,
    maxHp: player.maxHp,
    hackGauge: hacking.gauge,
    allyCount: allies.length,
    dispatchedDroneCount: runState.dispatchedDroneCount,
    hackTarget: currentHackTarget,
  });
  updateBossBar(boss.active ? boss.hp / boss.maxHp : null);
}

function tick(dt) {
  if (app.mode !== APP_MODES.PLAYING) return;
  const previousElapsed = runState.elapsed;
  runState.elapsed += dt;
  stageDirector.advance(previousElapsed, runState.elapsed);
  if (
    chapter.completion?.type === 'survive'
    && runState.elapsed >= chapter.completion.duration
  ) {
    showVictory();
    return;
  }

  const previousHp = player.hp;
  player.update(dt, axis());
  handleHackInput();
  updateSpawner(
    dt,
    runState.elapsed,
    player,
    chapter.waves,
    !runState.bossSpawned,
    chapter.spawner,
  );
  updateEnemies(dt, player);
  updateBoss(dt, player);
  updateWeapons(dt, player);
  updateProjectiles(dt, onExplode);
  updateEnemyShots(dt, player);
  updateAllies(dt, player);
  updateEffects(dt);

  if (player.hp < previousHp) {
    lastDamageAt = runState.elapsed;
    addShake(3, 0.2);
    sfx.hurt();
  }

  let bossKilled = false;
  for (const death of deathEvents) {
    runState.blocks += 1;
    fxDebris(death.x, death.y, death.boss ? COL.yellow : COL.magenta);
    sfx.kill();
    if (death.boss) {
      bossKilled = true;
      continue;
    }
    dropGem(death.x, death.y, death.xp);
    addCharge(death.elite);
  }
  deathEvents.length = 0;

  const gained = updatePickups(dt, player);
  if (gained > 0) sfx.pickup();
  runState.xp += gained;
  if (runState.xp >= xpForLevel(runState.level)) {
    runState.xp -= xpForLevel(runState.level);
    runState.level += 1;
    openLevelUp();
  }

  if (bossKilled) {
    showVictory();
    return;
  }
  if (player.dead) {
    showDefeat();
    return;
  }
  const recentlyHit = runState.elapsed - lastDamageAt <= 2;
  const nearbyThreat = nearby(player.x, player.y, 90).length > 0;
  storyDirector.update({
    now: runState.elapsed,
    dangerous: recentlyHit || nearbyThreat,
    presentationAvailable: app.mode === APP_MODES.PLAYING,
  });

  updateCamera(dt);
  updateHudState();
}

showTitle();

let lastFrame = performance.now();
function loop(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  handleAppInput();
  tick(dt);
  flushInput();
  renderer.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

if (import.meta.env.DEV) {
  window.__game = {
    startChapter,
    restartChapter,
    step(seconds = 1) {
      const frames = Math.round(seconds * 60);
      for (let index = 0; index < frames; index += 1) tick(1 / 60);
      renderer.render();
    },
    chooseUpgrade,
    setElapsed(value) {
      runState.elapsed = Math.max(0, Number(value) || 0);
    },
    setBossHpRatio(ratio) {
      if (!boss.active) return false;
      const targetHp = boss.maxHp * Math.max(0, Math.min(1, ratio));
      if (targetHp >= boss.ref.hp) return false;
      applyBossDamage(boss.ref.hp - targetHp);
      return true;
    },
    setPlayerHp(hp) {
      player.invuln = 0;
      player.hp = Math.max(0, Math.min(player.maxHp, hp));
      player.dead = player.hp <= 0;
    },
    setPlayerPosition(x, y) {
      player.x = Number(x) || 0;
      player.y = Number(y) || 0;
      player.mesh.position.set(player.x, player.y, 1);
    },
    spawnEnemies(count, type = 'rushbot') {
      for (let index = 0; index < count; index += 1) {
        const angle = (index / count) * Math.PI * 2;
        spawnEnemy(
          type,
          player.x + Math.cos(angle) * 130,
          player.y + Math.sin(angle) * 130,
        );
      }
    },
    snapshot() {
      return structuredClone({
        appMode: app.mode,
        runState,
        player: {
          x: player.x,
          y: player.y,
          hp: player.hp,
          maxHp: player.maxHp,
          dead: player.dead,
        },
        enemyCount: enemies.length,
        allyCount: allies.length,
        departingAllyCount: departingAllies.length,
        hackGauge: hacking.gauge,
        boss: {
          active: boss.active,
          hp: boss.hp,
          maxHp: boss.maxHp,
          policyLocked: boss.policyLocked,
          policyResolved: boss.policyResolved,
        },
        policyNode: {
          active: policyNode.active,
          resolving: policyNode.resolving,
          x: policyNode.x,
          y: policyNode.y,
        },
        storyBusy: storyDirector?.isBusy() ?? false,
        profile,
        hackTargetKind: currentHackTarget?.kind ?? null,
      });
    },
  };
}
