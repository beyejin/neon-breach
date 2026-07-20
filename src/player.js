// 플레이어 상태/이동
import { makeQuad } from './renderer.js';
import { makeImageTexture } from './sprites.js';
import { stats } from './stats.js';

export function createPlayer(scene) {
  const assetBase = typeof document !== 'undefined' ? document.baseURI : 'http://localhost/';
  const loadFrames = (motion) => [1, 2].map((frame) => makeImageTexture(
    new URL(`assets/characters/pixel-v2/ido-${motion}-${frame}.png?v=motion-2`, assetBase).href,
  ));
  const walkFrames = loadFrames('walk');
  const runFrames = loadFrames('run');
  const mesh = makeQuad(walkFrames[0], 20, 30);
  mesh.renderOrder = 10;
  mesh.frustumCulled = false;
  mesh.material.depthTest = false;
  mesh.material.depthWrite = false;
  scene.add(mesh);

  const p = {
    x: 0, y: 0,
    hp: 100, maxHp: 100,
    speed: 90,
    facing: 1,          // 1 = 오른쪽, -1 = 왼쪽
    invuln: 0,          // 피격 무적 남은 시간
    radius: 5,
    animTime: 0,
    frame: 0,
    animationMode: 'idle',
    walkFrames,
    runFrames,
    visualFrames: walkFrames,
    mesh,
    dead: false,

    update(dt, ax) {
      if (this.dead) return;
      this.invuln = Math.max(0, this.invuln - dt);

      const moving = ax.x !== 0 || ax.y !== 0;
      const running = moving && ax.running === true;
      if (moving) {
        const mode = running ? 'run' : 'walk';
        const frames = running ? this.runFrames : this.walkFrames;
        const frameDuration = running ? 0.1 : 0.18;
        if (this.animationMode !== mode) {
          this.animationMode = mode;
          this.animTime = 0;
          this.frame = 0;
          mesh.material.map = frames[0];
        }
        const spd = this.speed * stats.speedMul * (running ? 1.45 : 1);
        this.x += ax.x * spd * dt;
        this.y += ax.y * spd * dt;
        if (ax.x !== 0) this.facing = ax.x > 0 ? 1 : -1;
        this.animTime += dt;
        if (this.animTime > frameDuration) {
          this.animTime = 0;
          this.frame = 1 - this.frame;
          mesh.material.map = frames[this.frame];
        }
      } else {
        this.animationMode = 'idle';
        this.animTime = 0;
        this.frame = 0;
        mesh.material.map = this.walkFrames[0];
      }

      mesh.position.set(this.x, this.y, 1);
      mesh.scale.x = this.facing;
      // 피격 무적 동안 깜박임
      mesh.material.opacity = this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0 ? 0.35 : 1;
    },

    takeDamage(n) {
      if (this.invuln > 0 || this.dead) return false;
      this.hp = Math.max(0, this.hp - n);
      this.invuln = 0.5;
      if (this.hp <= 0) this.dead = true;
      return true;
    },
  };
  return p;
}

export function resetPlayer(player) {
  player.x = 0;
  player.y = 0;
  player.hp = 100;
  player.maxHp = 100;
  player.facing = 1;
  player.invuln = 0;
  player.animTime = 0;
  player.frame = 0;
  player.animationMode = 'idle';
  player.dead = false;
  player.mesh.position.set(0, 0, 1);
  player.mesh.scale.x = 1;
  player.mesh.material.opacity = 1;
  if ('map' in player.mesh.material) {
    player.mesh.material.map = player.visualFrames[0];
  }
}
