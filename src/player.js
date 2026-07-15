// 플레이어 상태/이동
import { makeQuad } from './renderer.js';
import { makeSprite, spriteSize } from './sprites.js';

export function createPlayer(scene) {
  const { w, h } = spriteSize('player');
  const mesh = makeQuad(makeSprite('player', 0), w, h);
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
    mesh,
    dead: false,

    update(dt, ax) {
      if (this.dead) return;
      this.invuln = Math.max(0, this.invuln - dt);

      const moving = ax.x !== 0 || ax.y !== 0;
      if (moving) {
        this.x += ax.x * this.speed * dt;
        this.y += ax.y * this.speed * dt;
        if (ax.x !== 0) this.facing = ax.x > 0 ? 1 : -1;
        this.animTime += dt;
        if (this.animTime > 0.18) {
          this.animTime = 0;
          this.frame = 1 - this.frame;
          mesh.material.map = makeSprite('player', this.frame);
        }
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
