import { createRenderer } from './renderer.js';
import { axis, flushInput } from './input.js';
import { createPlayer } from './player.js';
import { createBackground } from './background.js';

const canvas = document.getElementById('game');
const R = createRenderer(canvas);
const bg = createBackground(R.scene);
const player = createPlayer(R.scene);

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  player.update(dt, axis());

  // 카메라 추적 (부드럽게)
  R.camera.position.x += (player.x - R.camera.position.x) * Math.min(1, dt * 8);
  R.camera.position.y += (player.y - R.camera.position.y) * Math.min(1, dt * 8);
  bg.update(R.camera.position.x, R.camera.position.y);

  flushInput();
  R.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
