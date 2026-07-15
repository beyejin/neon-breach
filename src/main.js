import * as THREE from 'three';
import { createRenderer } from './renderer.js';

const canvas = document.getElementById('game');
const R = createRenderer(canvas);

// Task 1 검증용: 발광 사각형 (블룸 확인)
const test = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshBasicMaterial({ color: 0x00e5ff })
);
R.scene.add(test);

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  test.rotation.z += dt * 0.8;
  R.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
