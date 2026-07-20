import { DEFAULT_THEME_ID, isThemeId } from './theme.js';

export const STORAGE_KEY = 'zero-loss-adjustment.profile';
export const CORRUPT_STORAGE_KEY = 'zero-loss-adjustment.profile.corrupt';
export const LEGACY_STORAGE_KEY = 'neon-breach.profile';
export const CURRENT_SCHEMA_VERSION = 1;

const COMMUNICATION_MODES = new Set(['full', 'core', 'off']);

export function createDefaultProfile() {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    completedChapters: {},
    seenStoryEventIds: [],
    archiveEntryIds: [],
    communicationMode: 'full',
    settings: {
      muted: false,
      theme: DEFAULT_THEME_ID,
    },
  };
}

function stringList(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item) => typeof item === 'string'))];
}

function completedChapterMap(value) {
  if (Array.isArray(value)) {
    return Object.fromEntries(stringList(value).map((id) => [id, true]));
  }
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([id, completed]) => typeof id === 'string' && completed === true),
  );
}

function sanitizeProfile(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    completedChapters: completedChapterMap(source.completedChapters),
    seenStoryEventIds: stringList(source.seenStoryEventIds),
    archiveEntryIds: stringList(source.archiveEntryIds),
    communicationMode: COMMUNICATION_MODES.has(source.communicationMode)
      ? source.communicationMode
      : 'full',
    settings: {
      muted: source.settings?.muted === true,
      theme: isThemeId(source.settings?.theme) ? source.settings.theme : DEFAULT_THEME_ID,
    },
  };
}

export function migrateProfile(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  if ((source.schemaVersion ?? 0) === 0) {
    return sanitizeProfile({
      ...source,
      settings: {
        muted: source.settings?.muted === true || source.muted === true,
      },
    });
  }
  return sanitizeProfile(source);
}

export function loadProfile(storage = globalThis.localStorage) {
  const currentSerialized = storage.getItem(STORAGE_KEY);
  const serialized = currentSerialized ?? storage.getItem(LEGACY_STORAGE_KEY);
  if (serialized == null) {
    return {
      profile: createDefaultProfile(),
      persistenceMode: 'read-write',
    };
  }

  let raw;
  try {
    raw = JSON.parse(serialized);
  } catch {
    if (storage.getItem(CORRUPT_STORAGE_KEY) == null) {
      storage.setItem(CORRUPT_STORAGE_KEY, serialized);
    }
    console.warn('손상된 영점손해사정 프로필을 기본값으로 복구했습니다.');
    return {
      profile: createDefaultProfile(),
      persistenceMode: 'read-write',
    };
  }

  if (Number.isInteger(raw?.schemaVersion) && raw.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return {
      profile: createDefaultProfile(),
      persistenceMode: 'read-only-future',
    };
  }

  const profile = migrateProfile(raw);
  if (currentSerialized == null) {
    storage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }
  return {
    profile,
    persistenceMode: 'read-write',
  };
}

export function saveProfile(profile, loadContext, storage = globalThis.localStorage) {
  if (loadContext.persistenceMode === 'read-only-future') return false;
  storage.setItem(STORAGE_KEY, JSON.stringify(sanitizeProfile(profile)));
  return true;
}
