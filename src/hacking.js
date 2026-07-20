// 해킹 게이지/전향
import { enemies, removeEnemy } from './enemies.js';
import { addAlly } from './allies.js';
import { fxRing } from './effects.js';

export const hacking = { gauge: 0 }; // 0~100

export function addCharge(isElite) {
  hacking.gauge = Math.min(100, hacking.gauge + (isElite ? 20 : 5));
}

const HACK_RANGE = 100;
let markedTarget = null;

export function findHackTarget(player, policyNode = null) {
  if (policyNode?.active) {
    const d = (policyNode.x - player.x) ** 2 + (policyNode.y - player.y) ** 2;
    if (d < HACK_RANGE * HACK_RANGE) {
      return { kind: 'policy-node', entity: policyNode };
    }
  }

  let best = null, bd = HACK_RANGE * HACK_RANGE;
  for (const e of enemies) {
    if (e.boss) continue;
    const d = (e.x - player.x) ** 2 + (e.y - player.y) ** 2;
    if (d < bd) { bd = d; best = e; }
  }
  return best ? { kind: 'enemy', entity: best } : null;
}

export function markHackTarget(target) {
  if (markedTarget?.entity) markedTarget.entity.hackTarget = false;
  markedTarget = target;
  if (markedTarget?.entity) markedTarget.entity.hackTarget = true;
}

// 표식된 정책 노드 또는 게이지 100%인 최근접 적을 복구한다.
export function tryHack(player, target = findHackTarget(player), {
  resolvePolicyNode = () => false,
} = {}) {
  if (!target) return null;

  if (target.kind === 'policy-node') {
    if (!resolvePolicyNode(target.entity)) return null;
    return { success: true, kind: 'policy-node', entity: target.entity };
  }

  if (hacking.gauge < 100) return null;
  const best = target.entity;
  if (!enemies.includes(best) || best.boss) return null;

  hacking.gauge = 0;
  fxRing(best.x, best.y, 40, '#7f9a76', 0.45);
  fxRing(player.x, player.y, HACK_RANGE, '#7f9a76', 0.3);
  const allyResult = addAlly(best);
  removeEnemy(best);
  return {
    success: true,
    kind: 'enemy',
    entity: best,
    allyResult,
  };
}

export function resetHacking() {
  hacking.gauge = 0;
  markHackTarget(null);
}
