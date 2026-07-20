function matchesSignal(trigger, type, detail) {
  if (trigger.type !== type) return false;
  if (type === 'hack-count') return detail.count === trigger.count;
  if (type === 'boss-hp-ratio') return detail.ratio <= trigger.ratio;
  return true;
}

export function createStageDirector({
  chapter,
  runState,
  onStoryEvent = () => {},
  onBossSpawn = () => {},
}) {
  function emit(event) {
    if (runState.firedStoryEventIds.includes(event.id)) return false;
    runState.firedStoryEventIds.push(event.id);
    onStoryEvent(event);
    return true;
  }

  function signal(type, detail = {}) {
    const events = chapter.storyEvents.filter((event) => (
      matchesSignal(event.trigger, type, detail)
    ));
    for (const storyEvent of events) emit(storyEvent);
  }

  function advance(previousElapsed, currentElapsed) {
    const crossed = chapter.storyEvents
      .filter((event) => event.trigger.type === 'time')
      .filter((event) => previousElapsed < event.trigger.at && currentElapsed >= event.trigger.at)
      .sort((a, b) => a.trigger.at - b.trigger.at);
    for (const storyEvent of crossed) emit(storyEvent);

    if (
      chapter.boss
      &&
      !runState.bossSpawned
      && previousElapsed < chapter.boss.spawnAt
      && currentElapsed >= chapter.boss.spawnAt
    ) {
      runState.bossSpawned = true;
      onBossSpawn();
      signal('boss-spawn');
    }
  }

  return { advance, signal };
}
