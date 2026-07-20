import { CHAPTER_1 } from './chapter1.js';

export const CHAPTERS = Object.freeze({
  ch1: CHAPTER_1,
});

export function getAvailableChapterIds(_profile) {
  return Object.keys(CHAPTERS);
}
