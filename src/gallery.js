// 개발용 스프라이트 갤러리 (/gallery.html)
import { createRenderer, makeQuad } from './renderer.js';
import { makeSprite, spriteSize, frameCount } from './sprites.js';

const R = createRenderer(document.getElementById('game'));

const names = ['player', 'nari', 'haeju', 'rushbot', 'shooterbot', 'tankbot', 'elite', 'boss', 'gem', 'bullet', 'missile', 'spike', 'enemybullet'];
const SCALE = 4;
let x = -210;
for (const name of names) {
  const { w, h } = spriteSize(name);
  const mesh = makeQuad(makeSprite(name), w * SCALE, h * SCALE);
  mesh.position.set(x + w * SCALE / 2, 40, 0);
  R.scene.add(mesh);
  // 걷기 프레임/아군 변형
  if (frameCount(name) > 1) {
    const m2 = makeQuad(makeSprite(name, 1), w * SCALE, h * SCALE);
    m2.position.set(x + w * SCALE / 2, -40, 0);
    R.scene.add(m2);
  }
  if (['rushbot', 'shooterbot', 'tankbot', 'elite'].includes(name)) {
    const m3 = makeQuad(makeSprite(name, 0, 'ally'), w * SCALE, h * SCALE);
    m3.position.set(x + w * SCALE / 2, -40, 0);
    R.scene.add(m3);
  }
  x += w * SCALE + 20;
}

(function loop() { R.render(); requestAnimationFrame(loop); })();
