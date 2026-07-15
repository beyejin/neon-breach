// 무한 스크롤 느낌의 어두운 타일 그리드 배경
import * as THREE from 'three';

const TILE = 32;

export function createBackground(scene) {
  const cv = document.createElement('canvas');
  cv.width = TILE;
  cv.height = TILE;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#0a0b12';
  ctx.fillRect(0, 0, TILE, TILE);
  ctx.strokeStyle = '#141627'; // 발광하지 않는 어두운 라인
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, TILE, TILE);
  // 미세한 노이즈 점
  ctx.fillStyle = '#101322';
  ctx.fillRect(7, 21, 2, 2);
  ctx.fillRect(24, 9, 2, 2);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;

  const SIZE = 1600; // 화면보다 넉넉하게
  tex.repeat.set(SIZE / TILE, SIZE / TILE);

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(SIZE, SIZE),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  mesh.position.z = -1;
  scene.add(mesh);

  return {
    // 카메라를 따라가되 텍스처 오프셋으로 월드 고정처럼 보이게
    update(camX, camY) {
      mesh.position.x = camX;
      mesh.position.y = camY;
      tex.offset.set(camX / TILE, camY / TILE);
    },
  };
}
