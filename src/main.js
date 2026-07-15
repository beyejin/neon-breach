import { createRenderer, makeQuad } from './renderer.js';
import { makeSprite, spriteSize } from './sprites.js';

const canvas = document.getElementById('game');
const R = createRenderer(canvas);

// Task 2 검증용 갤러리: 전체 스프라이트 나열 (3배 확대)
const names = ['player', 'rushbot', 'shooterbot', 'tankbot', 'elite', 'boss', 'gem', 'bullet', 'missile', 'spike', 'enemybullet'];
let x = -150;
for (const name of names) {
  const { w, h } = spriteSize(name);
  const mesh = makeQuad(makeSprite(name), w * 3, h * 3);
  mesh.position.set(x, 0, 0);
  R.scene.add(mesh);
  x += w * 3 + 14;
}
// 아군 리컬러 확인
const allyMesh = makeQuad(makeSprite('tankbot', 0, 'ally'), 14 * 3, 12 * 3);
allyMesh.position.set(-150, -80, 0);
R.scene.add(allyMesh);

// 걷기 프레임 확인 (1프레임)
const walk = makeQuad(makeSprite('player', 1), 10 * 3, 12 * 3);
walk.position.set(-100, -80, 0);
R.scene.add(walk);

function loop() {
  R.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
