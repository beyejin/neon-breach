import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CORRUPT_STORAGE_KEY,
  CURRENT_SCHEMA_VERSION,
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  createDefaultProfile,
  loadProfile,
  migrateProfile,
  saveProfile,
} from '../src/profile-store.js';

function createStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    snapshot() {
      return Object.fromEntries(data);
    },
  };
}

test('저장값이 없으면 쓰기 가능한 기본 ProfileState를 반환한다', () => {
  const storage = createStorage();

  assert.deepEqual(loadProfile(storage), {
    profile: createDefaultProfile(),
    persistenceMode: 'read-write',
  });
});

test('이전 제품 키의 진행도는 새 키로 복사해 보존한다', () => {
  const legacy = JSON.stringify({
    schemaVersion: 1,
    completedChapters: { ch1: true },
    seenStoryEventIds: ['ch1.time.0048'],
  });
  const storage = createStorage({ [LEGACY_STORAGE_KEY]: legacy });

  const result = loadProfile(storage);

  assert.equal(result.profile.completedChapters.ch1, true);
  assert.deepEqual(result.profile.seenStoryEventIds, ['ch1.time.0048']);
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY)), result.profile);
  assert.equal(storage.getItem(LEGACY_STORAGE_KEY), legacy);
});

test('ProfileState 허용 필드만 round trip하고 RunState 필드는 저장하지 않는다', () => {
  const storage = createStorage();
  const context = loadProfile(storage);
  const profile = {
    ...context.profile,
    completedChapters: { ch1: true },
    seenStoryEventIds: ['ch1.time.0048'],
    archiveEntryIds: ['ch1.audit.raw'],
    communicationMode: 'core',
    settings: { muted: true, theme: 'casefile' },
    elapsed: 120,
    hp: 1,
    xp: 99,
    weapons: ['spike'],
    allies: [{}],
  };

  assert.equal(saveProfile(profile, context, storage), true);
  assert.deepEqual(loadProfile(storage).profile, {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    completedChapters: { ch1: true },
    seenStoryEventIds: ['ch1.time.0048'],
    archiveEntryIds: ['ch1.audit.raw'],
    communicationMode: 'core',
    settings: { muted: true, theme: 'casefile' },
  });
  assert.deepEqual(Object.keys(JSON.parse(storage.getItem(STORAGE_KEY))).sort(), [
    'archiveEntryIds',
    'communicationMode',
    'completedChapters',
    'schemaVersion',
    'seenStoryEventIds',
    'settings',
  ]);
});

test('손상 JSON은 원문을 한 번 백업하고 기본 프로필로 복구한다', () => {
  const storage = createStorage({ [STORAGE_KEY]: '{broken' });

  assert.deepEqual(loadProfile(storage), {
    profile: createDefaultProfile(),
    persistenceMode: 'read-write',
  });
  assert.equal(storage.getItem(CORRUPT_STORAGE_KEY), '{broken');

  storage.setItem(STORAGE_KEY, '{broken-again');
  loadProfile(storage);
  assert.equal(storage.getItem(CORRUPT_STORAGE_KEY), '{broken');
});

test('schema 0 데이터를 schema 1 허용 형태로 단방향 마이그레이션한다', () => {
  assert.deepEqual(migrateProfile({
    schemaVersion: 0,
    completedChapters: ['ch1'],
    seenStoryEventIds: ['one', 2, 'one'],
    archiveEntryIds: ['archive'],
    communicationMode: 'invalid',
    muted: true,
    unknown: 'drop',
  }), {
    schemaVersion: 1,
    completedChapters: { ch1: true },
    seenStoryEventIds: ['one'],
    archiveEntryIds: ['archive'],
    communicationMode: 'full',
    settings: { muted: true, theme: 'neon' },
  });
});

test('미래 schema는 원본을 보존하고 세션의 모든 자동 저장을 거부한다', () => {
  const original = JSON.stringify({ schemaVersion: 99, future: 'keep-me' });
  const storage = createStorage({ [STORAGE_KEY]: original });
  const context = loadProfile(storage);

  assert.equal(context.persistenceMode, 'read-only-future');
  assert.deepEqual(context.profile, createDefaultProfile());
  context.profile.seenStoryEventIds.push('ch1.time.0048');
  context.profile.settings.muted = true;
  assert.equal(saveProfile(context.profile, context, storage), false);
  assert.equal(storage.getItem(STORAGE_KEY), original);
});
