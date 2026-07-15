// 발광 이펙트 (링/빔/플래시) — 풀링
import * as THREE from 'three';

let sceneRef = null;
const active = [];
const pools = { ring: [], beam: [], flash: [], debris: [] };

export function initEffects(scene) { sceneRef = scene; }

function acquire(kind) {
  let fx = pools[kind].pop();
  if (!fx) {
    let mesh;
    if (kind === 'ring') {
      mesh = new THREE.Mesh(
        new THREE.RingGeometry(0.88, 1, 40),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, side: THREE.DoubleSide })
      );
    } else if (kind === 'beam') {
      mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })
      );
    } else if (kind === 'debris') {
      mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })
      );
    } else {
      mesh = new THREE.Mesh(
        new THREE.CircleGeometry(1, 24),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })
      );
    }
    sceneRef.add(mesh);
    fx = { kind, mesh };
  }
  fx.mesh.visible = true;
  active.push(fx);
  return fx;
}

// 확장 링 (노바/해킹)
export function fxRing(x, y, maxR, color, dur = 0.35) {
  const fx = acquire('ring');
  fx.t = 0; fx.dur = dur; fx.maxR = maxR;
  fx.mesh.material.color.setStyle(color);
  fx.mesh.position.set(x, y, 2);
  fx.update = (dt) => {
    fx.t += dt;
    const k = fx.t / fx.dur;
    const r = Math.max(0.001, fx.maxR * k);
    fx.mesh.scale.set(r, r, 1);
    fx.mesh.material.opacity = 1 - k;
    return k < 1;
  };
}

// 직선 빔 (레이저)
export function fxBeam(x, y, angle, len, width, color, dur = 0.15) {
  const fx = acquire('beam');
  fx.t = 0; fx.dur = dur;
  fx.mesh.material.color.setStyle(color);
  fx.mesh.scale.set(len, width, 1);
  fx.mesh.position.set(x + Math.cos(angle) * len / 2, y + Math.sin(angle) * len / 2, 2);
  fx.mesh.rotation.z = angle;
  fx.update = (dt) => {
    fx.t += dt;
    const k = fx.t / fx.dur;
    fx.mesh.material.opacity = 1 - k;
    return k < 1;
  };
}

// 원형 플래시 (폭발)
export function fxFlash(x, y, r, color, dur = 0.25) {
  const fx = acquire('flash');
  fx.t = 0; fx.dur = dur;
  fx.mesh.material.color.setStyle(color);
  fx.mesh.position.set(x, y, 2);
  fx.update = (dt) => {
    fx.t += dt;
    const k = fx.t / fx.dur;
    fx.mesh.scale.set(r * (0.6 + 0.4 * k), r * (0.6 + 0.4 * k), 1);
    fx.mesh.material.opacity = 0.9 * (1 - k);
    return k < 1;
  };
}

// 사망 파편 (픽셀 조각 5개가 튀며 소멸)
export function fxDebris(x, y, color) {
  for (let i = 0; i < 5; i++) {
    const fx = acquire('debris');
    fx.t = 0; fx.dur = 0.35 + Math.random() * 0.15;
    const a = Math.random() * Math.PI * 2;
    const spd = 40 + Math.random() * 60;
    fx.vx = Math.cos(a) * spd;
    fx.vy = Math.sin(a) * spd;
    fx.px = x; fx.py = y;
    fx.mesh.material.color.setStyle(color);
    fx.mesh.scale.set(1, 1, 1);
    fx.update = (dt) => {
      fx.t += dt;
      const k = fx.t / fx.dur;
      fx.px += fx.vx * dt;
      fx.py += fx.vy * dt;
      fx.mesh.position.set(fx.px, fx.py, 1.5);
      fx.mesh.material.opacity = 1 - k;
      return k < 1;
    };
  }
}

export function updateEffects(dt) {
  for (let i = active.length - 1; i >= 0; i--) {
    const fx = active[i];
    if (!fx.update(dt)) {
      fx.mesh.visible = false;
      active.splice(i, 1);
      pools[fx.kind].push(fx);
    }
  }
}
