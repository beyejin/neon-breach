import test from 'node:test';
import assert from 'node:assert/strict';

import { initAudio, setMuted, toggleMute } from '../src/audio.js';

test('저장된 음소거는 오디오 초기화 전후 유지되고 토글 결과를 반환한다', () => {
  const gain = { value: 0 };
  globalThis.window = {
    AudioContext: class {
      constructor() {
        this.destination = {};
      }

      createGain() {
        return {
          gain,
          connect() {},
        };
      }
    },
  };

  assert.equal(setMuted(true), true);
  initAudio();
  assert.equal(gain.value, 0);
  assert.equal(toggleMute(), false);
  assert.equal(gain.value, 0.5);
});
