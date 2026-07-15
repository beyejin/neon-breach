import { createRenderer } from './renderer.js';
import { axis, flushInput } from './input.js';
import { createPlayer } from './player.js';
import { createBackground } from './background.js';
import { initEnemies, updateEnemies, deathEvents, enemies, spawnEnemy, updateEnemyShots } from './enemies.js';
import { initAllies, updateAllies, allies } from './allies.js';
import { hacking, addCharge, tryHack } from './hacking.js';
import { wasPressed } from './input.js';
import { updateSpawner } from './spawner.js';
import { initHud, updateHud, showOverlay, updateBossBar } from './hud.js';
import { boss, spawnBoss, updateBoss } from './boss.js';
import { initProjectiles, updateProjectiles } from './projectiles.js';
import { addWeapon, updateWeapons, initWeapons } from './weapons.js';
import { initEffects, updateEffects, fxFlash, fxDebris } from './effects.js';
import { COL } from './sprites.js';
import { nearby, damageEnemy } from './enemies.js';
import { initPickups, dropGem, updatePickups, gemList } from './pickups.js';
import { xpForLevel, rollChoices, applyChoice } from './upgrades.js';
import { stats } from './stats.js';

const canvas = document.getElementById('game');
const R = createRenderer(canvas);
const bg = createBackground(R.scene);
initEnemies(R.scene);
initHud();

const player = createPlayer(R.scene);
initProjectiles(R.scene);
initPickups(R.scene);
initWeapons(R.scene);
initEffects(R.scene);
initAllies(R.scene);
addWeapon('smg'); // 시작 무기

// 미사일 폭발: 반경 내 광역 데미지 + 플래시
function onExplode(x, y, r, dmg) {
  fxFlash(x, y, r, '#ffe600', 0.25);
  for (const e of nearby(x, y, r)) {
    if (Math.hypot(e.x - x, e.y - y) <= r + e.radius) damageEnemy(e, dmg);
  }
}

const BOSS_TIME = 600; // 10:00

const game = {
  state: 'title',
  elapsed: 0,
  kills: 0,
  level: 1,
  xp: 0,
  bossSpawned: false,
};

let overlay = null;

function fmtTime(t) {
  const m = String(Math.floor(t / 60)).padStart(2, '0');
  const s = String(Math.floor(t % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

function showTitle() {
  game.state = 'title';
  overlay = showOverlay(`
    <h1 class="neon-cyan">NEON BREACH</h1>
    <div class="stats">
      보안 드론 군단을 뚫고 10분간 생존하라.<br>
      적을 <span class="neon-mint">해킹</span>해 내 편으로 만들 수 있다.<br><br>
      WASD / 방향키 — 이동 · 무기는 자동 발사<br>
      SPACE — 해킹 (게이지 100%일 때, 근처 적을 아군화)
    </div>
    <button id="startBtn">침투 개시</button>
  `);
  overlay.querySelector('#startBtn').addEventListener('click', () => {
    overlay.remove();
    overlay = null;
    game.state = 'playing';
  });
}

function gameOver() {
  game.state = 'gameover';
  overlay = showOverlay(`
    <h1 class="neon-red">접속 종료</h1>
    <div class="stats">생존 시간 ${fmtTime(game.elapsed)}<br>처치 ${game.kills}</div>
    <button onclick="location.reload()">재접속</button>
  `);
}

function victory() {
  game.state = 'victory';
  overlay = showOverlay(`
    <h1 class="neon-mint">시스템 장악 완료</h1>
    <div class="stats">클리어 시간 ${fmtTime(game.elapsed)}<br>처치 ${game.kills}</div>
    <button onclick="location.reload()">재접속</button>
  `);
}

function openLevelUp() {
  game.state = 'levelup';
  const choices = rollChoices();
  const cardsHtml = choices.map((c, i) => `
    <div class="card" data-i="${i}">
      <div class="tag">${c.tag}</div>
      <div class="title">${c.title}</div>
      <div class="desc">${c.desc}</div>
    </div>
  `).join('');
  overlay = showOverlay(`
    <h1 class="neon-cyan" style="font-size:26px;">시스템 업그레이드</h1>
    <div class="cards">${cardsHtml}</div>
  `);
  overlay.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
      applyChoice(choices[+card.dataset.i], player);
      overlay.remove();
      overlay = null;
      game.state = 'playing';
    });
  });
}

// 화면 흔들림
const shake = { t: 0, mag: 0 };
function addShake(mag, dur = 0.25) {
  shake.mag = Math.max(shake.mag, mag);
  shake.t = Math.max(shake.t, dur);
}

// 오토파일럿 (밸런스 자동 검증용): 적을 피해 다니며 젬 방향으로 유영
function autopilotAxis() {
  let fx = 0, fy = 0;
  for (const e of nearby(player.x, player.y, 90)) {
    const dx = player.x - e.x, dy = player.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    const w = (90 - d) * (e.boss ? 3 : 1);
    fx += (dx / d) * w;
    fy += (dy / d) * w;
  }
  // 위협이 적으면 가까운 젬 수집
  if (Math.hypot(fx, fy) < 30) {
    let bg2 = null, bd = 150 * 150;
    for (const g of gemList()) {
      const d = (g.x - player.x) ** 2 + (g.y - player.y) ** 2;
      if (d < bd) { bd = d; bg2 = g; }
    }
    if (bg2) {
      const d = Math.sqrt(bd) || 1;
      fx += ((bg2.x - player.x) / d) * 25;
      fy += ((bg2.y - player.y) / d) * 25;
    }
  }
  // 완만한 원형 드리프트
  fx += Math.cos(game.elapsed * 0.5) * 14;
  fy += Math.sin(game.elapsed * 0.5) * 14;
  const len = Math.hypot(fx, fy) || 1;
  return { x: fx / len, y: fy / len };
}

// 게임 로직 1틱 (렌더링과 분리 — 디버그 스텝에서도 사용)
function tick(dt) {
  if (game.state !== 'playing') return;
  game.elapsed += dt;

  const prevHp = player.hp;
  player.update(dt, window.__autopilot ? autopilotAxis() : axis());

  // 보스 등장 (10:00) — 일반 스폰 정지
  if (!game.bossSpawned && game.elapsed >= BOSS_TIME) {
    game.bossSpawned = true;
    spawnBoss(player);
    addShake(6, 0.5);
  }
  updateSpawner(dt, game.elapsed, player, !game.bossSpawned);
  updateEnemies(dt, player);
  updateBoss(dt, player);
  updateWeapons(dt, player);
  updateProjectiles(dt, onExplode);
  updateEnemyShots(dt, player);
  updateAllies(dt, player);
  updateEffects(dt);

  // 해킹: Space 발동 (오토파일럿은 자동 발동)
  if (wasPressed('Space') || (window.__autopilot && hacking.gauge >= 100)) tryHack(player);

  // 피격 감지 → 흔들림
  if (player.hp < prevHp) addShake(3, 0.2);

  // 사망 이벤트 → 젬 드랍 + 해킹 충전 + 파편 (+보스 처치 시 승리)
  let bossKilled = false;
  for (const d of deathEvents) {
    game.kills++;
    fxDebris(d.x, d.y, d.boss ? COL.yellow : COL.magenta);
    if (d.boss) { bossKilled = true; continue; }
    dropGem(d.x, d.y, d.xp);
    addCharge(d.elite);
  }
  deathEvents.length = 0;

  // XP 획득 → 레벨업
  game.xp += updatePickups(dt, player);
  if (game.xp >= xpForLevel(game.level)) {
    game.xp -= xpForLevel(game.level);
    game.level++;
    openLevelUp();
  }

  if (bossKilled) { victory(); return; }
  if (player.dead) { gameOver(); return; }

  // 카메라 추적 + 흔들림
  shake.t = Math.max(0, shake.t - dt);
  if (shake.t <= 0) shake.mag = 0;
  const sx = shake.mag * (Math.random() * 2 - 1) * (shake.t > 0 ? 1 : 0);
  const sy = shake.mag * (Math.random() * 2 - 1) * (shake.t > 0 ? 1 : 0);
  R.camera.position.x += (player.x - R.camera.position.x) * Math.min(1, dt * 8) + sx * dt * 20;
  R.camera.position.y += (player.y - R.camera.position.y) * Math.min(1, dt * 8) + sy * dt * 20;
  bg.update(R.camera.position.x, R.camera.position.y);

  updateHud({
    elapsed: game.elapsed,
    level: game.level,
    kills: game.kills,
    xpRatio: game.xp / xpForLevel(game.level),
    hp: player.hp,
    maxHp: player.maxHp,
    hackGauge: hacking.gauge,
  });
  updateBossBar(boss.active ? boss.hp / boss.maxHp : null);
}

showTitle();

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  tick(dt);
  flushInput();
  R.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// 디버그/치트 훅 (개발용): 패널이 hidden이라 rAF가 멈춰도 수동 진행 가능
window.__game = {
  game, player, enemies, spawnEnemy, allies, hacking, tryHack,
  step(seconds = 1) {
    const n = Math.round(seconds * 60);
    for (let i = 0; i < n; i++) tick(1 / 60);
    R.render();
  },
};
