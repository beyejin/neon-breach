// 플레이어 패시브 스탯 (업그레이드가 수정)
export const stats = {
  speedMul: 1,
  dmgMul: 1,
  cdMul: 1,       // 낮을수록 빠름
  pickupRange: 40,
  maxHpBonus: 0,
};

export function resetStats() {
  stats.speedMul = 1;
  stats.dmgMul = 1;
  stats.cdMul = 1;
  stats.pickupRange = 40;
  stats.maxHpBonus = 0;
}
