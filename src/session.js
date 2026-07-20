export const APP_MODES = Object.freeze({
  TITLE: 'title',
  BRIEFING: 'briefing',
  PLAYING: 'playing',
  LEVELUP: 'levelup',
  AUDIT: 'audit',
  VICTORY: 'victory',
  DEFEAT: 'defeat',
  ARCHIVE: 'archive',
});

const TRANSITIONS = new Map([
  [APP_MODES.TITLE, new Set([APP_MODES.BRIEFING, APP_MODES.ARCHIVE])],
  [APP_MODES.ARCHIVE, new Set([APP_MODES.TITLE])],
  [APP_MODES.BRIEFING, new Set([APP_MODES.PLAYING])],
  [APP_MODES.PLAYING, new Set([
    APP_MODES.LEVELUP,
    APP_MODES.AUDIT,
    APP_MODES.VICTORY,
    APP_MODES.DEFEAT,
  ])],
  [APP_MODES.LEVELUP, new Set([APP_MODES.PLAYING])],
  [APP_MODES.AUDIT, new Set([APP_MODES.PLAYING])],
  [APP_MODES.VICTORY, new Set([APP_MODES.TITLE, APP_MODES.BRIEFING])],
  [APP_MODES.DEFEAT, new Set([APP_MODES.BRIEFING])],
]);

export function canTransition(from, to) {
  return TRANSITIONS.get(from)?.has(to) ?? false;
}

export function transitionAppMode(from, to) {
  if (!canTransition(from, to)) {
    throw new Error(`허용되지 않은 AppMode 전이: ${from} -> ${to}`);
  }
  return to;
}

export function createRunState(chapterId) {
  return {
    chapterId,
    elapsed: 0,
    blocks: 0,
    level: 1,
    xp: 0,
    bossSpawned: false,
    hackSuccessCount: 0,
    dispatchedDroneCount: 0,
    firedStoryEventIds: [],
    pendingStoryEventIds: [],
  };
}
