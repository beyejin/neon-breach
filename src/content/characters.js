import neonPortraitSheet from '../assets/characters/ch1-portraits.png';
import casefilePortraitSheet from '../assets/characters/ch1-portraits-casefile.png';

const CHARACTER_SPECS = Object.freeze({
  이도: Object.freeze({
    role: '전 NEON 엔지니어 · 현장 복구 담당',
    portraitPosition: '0%',
  }),
  나리: Object.freeze({
    role: '현장 통신망 운영자',
    portraitPosition: '50%',
  }),
  해주: Object.freeze({
    role: '17번 버스 기사 · 호송 책임자',
    portraitPosition: '100%',
  }),
});

export function getCharacters(themeId = 'neon') {
  const portraitSheet = themeId === 'casefile' ? casefilePortraitSheet : neonPortraitSheet;
  return Object.freeze(Object.fromEntries(
    Object.entries(CHARACTER_SPECS).map(([name, character]) => [name, {
      ...character,
      portraitSheet,
    }]),
  ));
}

export function getCharacter(name, themeId = 'neon') {
  return getCharacters(themeId)[name];
}

export const CHARACTERS = getCharacters();
