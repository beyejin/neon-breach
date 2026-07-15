// 레벨업 선택지 생성/적용
import { WEAPON_DEFS, ownedWeapons, addWeapon, upgradeWeapon, hasWeapon, weaponLevel, MAX_WEAPON_LEVEL } from './weapons.js';
import { stats } from './stats.js';

export function xpForLevel(n) {
  return 10 + (n - 1) * 8;
}

const MAX_PASSIVE_LEVEL = 5;
const passiveLevels = {}; // id → level

export const PASSIVE_DEFS = {
  speed:  { name: '오버클럭 부츠', desc: '이동속도 +10%', apply: () => { stats.speedMul += 0.1; } },
  damage: { name: '전력 증폭기', desc: '공격력 +10%', apply: () => { stats.dmgMul += 0.1; } },
  cooldown: { name: '병렬 처리', desc: '쿨다운 -8%', apply: () => { stats.cdMul *= 0.92; } },
  pickup: { name: '수신 안테나', desc: '획득 범위 +25%', apply: () => { stats.pickupRange *= 1.25; } },
  maxhp:  { name: '나노 리페어', desc: '최대 HP +20 (즉시 회복)', apply: (player) => { stats.maxHpBonus += 20; player.maxHp += 20; player.hp = Math.min(player.maxHp, player.hp + 20); } },
};

export function rollChoices() {
  const cands = [];

  for (const id in WEAPON_DEFS) {
    if (!hasWeapon(id)) {
      cands.push({ kind: 'weapon-new', id, title: `${WEAPON_DEFS[id].name} 획득`, desc: WEAPON_DEFS[id].desc, tag: '신규 무기' });
    } else if (weaponLevel(id) < MAX_WEAPON_LEVEL) {
      cands.push({ kind: 'weapon-up', id, title: `${WEAPON_DEFS[id].name} Lv${weaponLevel(id) + 1}`, desc: WEAPON_DEFS[id].desc, tag: '무기 강화' });
    }
  }
  for (const id in PASSIVE_DEFS) {
    if ((passiveLevels[id] || 0) < MAX_PASSIVE_LEVEL) {
      cands.push({ kind: 'passive', id, title: `${PASSIVE_DEFS[id].name} Lv${(passiveLevels[id] || 0) + 1}`, desc: PASSIVE_DEFS[id].desc, tag: '패시브' });
    }
  }

  // 셔플 후 3장
  for (let i = cands.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cands[i], cands[j]] = [cands[j], cands[i]];
  }
  return cands.slice(0, 3);
}

export function applyChoice(c, player) {
  if (c.kind === 'weapon-new') addWeapon(c.id);
  else if (c.kind === 'weapon-up') upgradeWeapon(c.id);
  else if (c.kind === 'passive') {
    passiveLevels[c.id] = (passiveLevels[c.id] || 0) + 1;
    PASSIVE_DEFS[c.id].apply(player);
  }
}

export function resetUpgrades() {
  for (const k in passiveLevels) delete passiveLevels[k];
}
