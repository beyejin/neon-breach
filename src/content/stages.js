import { CHAPTERS } from './chapters.js';
import { SURVIVAL_1M } from './survival1m.js';

export const STAGES = Object.freeze({
  ...CHAPTERS,
  'survival-1m': SURVIVAL_1M,
});
