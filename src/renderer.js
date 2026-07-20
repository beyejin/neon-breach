// Three.js 렌더링 전담: 직교 카메라 탑다운 + 절제된 광원 효과
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const VIEW_H = 270; // 세로 기준 월드 단위(가상 픽셀) — 픽셀아트 스케일 기준

export function createRenderer(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x11140f);

  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.OrthographicCamera(
    -VIEW_H * aspect / 2, VIEW_H * aspect / 2,
    VIEW_H / 2, -VIEW_H / 2,
    0.1, 100
  );
  camera.position.z = 10;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.18,  // strength
    0.18,  // radius
    0.82   // threshold — 경고등처럼 가장 밝은 요소만 약하게 발광
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  window.addEventListener('resize', () => {
    const a = window.innerWidth / window.innerHeight;
    camera.left = -VIEW_H * a / 2;
    camera.right = VIEW_H * a / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    scene,
    camera,
    setTheme(theme) {
      scene.background.set(theme.canvas.background);
      bloom.strength = theme.canvas.bloom.strength;
      bloom.radius = theme.canvas.bloom.radius;
      bloom.threshold = theme.canvas.bloom.threshold;
    },
    render() { composer.render(); },
  };
}

// 텍스처를 입힌 평면 메시 (스프라이트용)
export function makeQuad(texture, w, h) {
  const geo = new THREE.PlaneGeometry(w, h);
  const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  return new THREE.Mesh(geo, mat);
}
