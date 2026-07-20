// WebAudio 합성 사운드 — 외부 에셋 없이 전부 코드 생성
let ctx = null;
let master = null;
let muted = false;
const lastPlay = {}; // SFX 스로틀

export function initAudio() {
  if (ctx) { ctx.resume(); return; }
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.5;
  master.connect(ctx.destination);
}

export function setMuted(value) {
  muted = value === true;
  if (master) master.gain.value = muted ? 0 : 0.5;
  return muted;
}

export function toggleMute() {
  return setMuted(!muted);
}

function env(gainNode, t0, peak, dur) {
  const g = gainNode.gain;
  g.setValueAtTime(0.0001, t0);
  g.exponentialRampToValueAtTime(peak, t0 + 0.005);
  g.exponentialRampToValueAtTime(0.0001, t0 + dur);
}

function osc(type, f0, f1, dur, peak, throttleMs = 0, name = '') {
  if (!ctx || muted) return;
  if (throttleMs) {
    const now = performance.now();
    if (lastPlay[name] && now - lastPlay[name] < throttleMs) return;
    lastPlay[name] = now;
  }
  const t0 = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t0);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  env(g, t0, peak, dur);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(dur, peak, cutoff = 2000, throttleMs = 0, name = '') {
  if (!ctx || muted) return;
  if (throttleMs) {
    const now = performance.now();
    if (lastPlay[name] && now - lastPlay[name] < throttleMs) return;
    lastPlay[name] = now;
  }
  const t0 = ctx.currentTime;
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = cutoff;
  const g = ctx.createGain();
  env(g, t0, peak, dur);
  src.connect(f).connect(g).connect(master);
  src.start(t0);
}

export const sfx = {
  shoot()  { osc('square', 880, 330, 0.07, 0.05, 70, 'shoot'); },
  laser()  { osc('sawtooth', 1400, 200, 0.18, 0.1, 100, 'laser'); },
  nova()   { osc('sine', 150, 600, 0.3, 0.12, 100, 'nova'); noise(0.25, 0.06, 1200, 100, 'novaN'); },
  boom()   { noise(0.22, 0.14, 700, 60, 'boom'); osc('sawtooth', 180, 50, 0.22, 0.1, 60, 'boomO'); },
  kill()   { noise(0.12, 0.09, 1500, 40, 'kill'); osc('triangle', 400, 80, 0.12, 0.07, 40, 'killO'); },
  pickup() { osc('sine', 660, 1100, 0.08, 0.06, 50, 'pickup'); },
  levelup(){
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => osc('triangle', f, f, 0.15, 0.12), i * 90));
  },
  hack()   {
    osc('sawtooth', 200, 1600, 0.35, 0.12);
    setTimeout(() => osc('sine', 1200, 1800, 0.2, 0.1), 120);
  },
  hurt()   { osc('square', 140, 60, 0.18, 0.14, 150, 'hurt'); noise(0.1, 0.08, 500, 150, 'hurtN'); },
  boss()   { osc('sawtooth', 80, 35, 1.1, 0.2); noise(0.9, 0.1, 300); },
  win()    {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      setTimeout(() => osc('triangle', f, f, 0.3, 0.12), i * 140));
  },
  lose()   {
    [400, 300, 220, 150].forEach((f, i) =>
      setTimeout(() => osc('sawtooth', f, f * 0.9, 0.35, 0.1), i * 180));
  },
};

// ---- 미니 BGM: 8스텝 베이스 펄스 루프 ----
let bgmTimer = null;
let step = 0;
const BASSLINE = [55, 55, 82.4, 55, 65.4, 55, 98, 82.4]; // A1 중심

export function startBgm() {
  if (!ctx || bgmTimer) return;
  step = 0;
  bgmTimer = setInterval(() => {
    if (muted || !ctx) return;
    const f = BASSLINE[step % 8];
    osc('sawtooth', f, f, 0.22, 0.045);
    if (step % 2 === 0) noise(0.03, 0.02, 6000); // 하이햇 틱
    step++;
  }, 250); // 120BPM 8분음표
}

export function stopBgm() {
  clearInterval(bgmTimer);
  bgmTimer = null;
}
