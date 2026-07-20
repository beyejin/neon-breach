export function shouldPresentStoryEvent(event, communicationMode) {
  if (event.presentation !== 'comms') return true;
  if (event.communication === 'required') return true;
  if (communicationMode === 'off') return false;
  if (communicationMode === 'core' && event.communication === 'tutorial') return false;
  return true;
}

export function createStoryDirector({
  profile,
  runState,
  present,
  save,
}) {
  let queue = [];
  let current = null;
  let sequence = 0;
  let generation = 0;

  function syncPendingIds() {
    runState.pendingStoryEventIds = queue.map((item) => item.event.id);
  }

  function enqueue(event, now) {
    if (!shouldPresentStoryEvent(event, profile.communicationMode)) return false;
    if (event.replay === 'profile-once' && profile.seenStoryEventIds.includes(event.id)) {
      return false;
    }
    if (queue.some((item) => item.event.id === event.id) || current?.event.id === event.id) {
      return false;
    }
    queue.push({ event, queuedAt: now, sequence: sequence++ });
    queue.sort((a, b) => b.event.priority - a.event.priority || a.sequence - b.sequence);
    syncPendingIds();
    return true;
  }

  function start(item) {
    const startedGeneration = generation;
    queue = queue.filter((candidate) => candidate !== item);
    syncPendingIds();
    const promise = Promise.resolve(present(item.event))
      .then((result) => {
        if (startedGeneration !== generation || result?.status !== 'completed') return;
        if (
          item.event.replay === 'profile-once'
          && !profile.seenStoryEventIds.includes(item.event.id)
        ) {
          profile.seenStoryEventIds.push(item.event.id);
          if (item.event.communication === 'core' || item.event.persistOnComplete === true) {
            save();
          }
        }
      })
      .finally(() => {
        if (current?.promise === promise) current = null;
      });
    current = { event: item.event, promise };
    return item.event;
  }

  function update({ now, dangerous, presentationAvailable = true }) {
    if (current || !presentationAvailable) return null;
    while (queue.length > 0) {
      const item = queue[0];
      const isComms = item.event.presentation === 'comms';
      const waited = now - item.queuedAt;
      if (isComms && dangerous && waited < item.event.maxDelay) return null;
      if (
        isComms
        && dangerous
        && item.event.communication === 'tutorial'
        && waited >= item.event.maxDelay
      ) {
        queue.shift();
        syncPendingIds();
        continue;
      }
      return start(item);
    }
    return null;
  }

  function reset() {
    generation += 1;
    queue = [];
    syncPendingIds();
  }

  function whenIdle() {
    return current?.promise ?? Promise.resolve();
  }

  function isBusy() {
    return Boolean(current || queue.length > 0);
  }

  return {
    enqueue,
    update,
    reset,
    whenIdle,
    isBusy,
  };
}
