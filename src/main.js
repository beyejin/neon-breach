import { createRenderer } from './renderer.js';
import { axis, flushInput } from './input.js';
import { createPlayer } from './player.js';
import { createBackground } from './background.js';
import { initEnemies, updateEnemies, deathEvents, enemies, spawnEnemy } from './enemies.js';
import { updateSpawner } from './spawner.js';
import { initHud, updateHud, showOverlay } from './hud.js';

const canvas = document.getElementById('game');
const R = createRenderer(canvas);
const bg = createBackground(R.scene);
initEnemies(R.scene);
initHud();

const player = createPlayer(R.scene);

const game = {
  state: 'playing', // Task 9에서 타이틀/승리 추가
  elapsed: 0,
  kills: 0,
  level: 1,
  xp: 0,
  hackGauge: 0,
};

let overlay = null;

function gameOver() {
  game.state = 'gameover';
  const m = String(Math.floor(game.elapsed / 60)).padStart(2, '0');
  const s = String(Math.floor(game.elapsed % 60)).padStart(2, '0');
  overlay = showOverlay(`
    <h1 class="neon-red">접속 종료</h1>
    <div class="stats">생존 시간 ${m}:${s}<br>처치 ${game.kills}</div>
    <button onclick="location.reload()">재접속</button>
  `);
}

// 게임 로직 1틱 (렌더링과 분리 — 디버그 스텝에서도 사용)
function tick(dt) {
  if (game.state !== 'playing') return;
  game.elapsed += dt;

  player.update(dt, axis());
  updateSpawner(dt, game.elapsed, player);
  updateEnemies(dt, player);

  // 사망 이벤트 처리 (Task 6에서 젬 드랍 추가)
  for (const d of deathEvents) {
    game.kills++;
  }
  deathEvents.length = 0;

  if (player.dead) gameOver();

  // 카메라 추적
  R.camera.position.x += (player.x - R.camera.position.x) * Math.min(1, dt * 8);
  R.camera.position.y += (player.y - R.camera.position.y) * Math.min(1, dt * 8);
  bg.update(R.camera.position.x, R.camera.position.y);

  updateHud({
    elapsed: game.elapsed,
    level: game.level,
    kills: game.kills,
    xpRatio: 0,
    hp: player.hp,
    maxHp: player.maxHp,
    hackGauge: game.hackGauge,
  });
}

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
  game, player, enemies, spawnEnemy,
  step(seconds = 1) {
    const n = Math.round(seconds * 60);
    for (let i = 0; i < n; i++) tick(1 / 60);
    R.render();
  },
};
