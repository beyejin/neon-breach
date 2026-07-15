// DOM 오버레이 HUD
const css = `
#hud { position: fixed; inset: 0; pointer-events: none; font-family: 'Courier New', monospace; color: #cfd8ff; user-select: none; }
#hud .top { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); text-align: center; }
#hud .timer { font-size: 28px; font-weight: bold; color: #00e5ff; text-shadow: 0 0 8px #00e5ff88; }
#hud .sub { font-size: 13px; margin-top: 2px; color: #8892c0; }
#hud .xpbar { position: absolute; top: 0; left: 0; right: 0; height: 5px; background: #141627; }
#hud .xpbar > div { height: 100%; width: 0%; background: #b44dff; box-shadow: 0 0 8px #b44dff; transition: width .15s; }
#hud .bottom { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); width: 320px; text-align: center; }
#hud .hpbar { height: 12px; background: #1a1020; border: 1px solid #3a2a4e; }
#hud .hpbar > div { height: 100%; width: 100%; background: linear-gradient(90deg, #ff2d55, #ff2d78); box-shadow: 0 0 10px #ff2d7888; transition: width .1s; }
#hud .hptext { font-size: 11px; margin-top: 2px; color: #8892c0; }
#hud .hackwrap { position: absolute; bottom: 52px; left: 50%; transform: translateX(-50%); width: 220px; text-align: center; }
#hud .hackbar { height: 7px; background: #0a1a18; border: 1px solid #14443c; }
#hud .hackbar > div { height: 100%; width: 0%; background: #00ffc8; box-shadow: 0 0 10px #00ffc8; transition: width .15s; }
#hud .hacklabel { font-size: 10px; color: #56d0b8; margin-top: 2px; letter-spacing: 1px; }
#hud .hacklabel.ready { color: #00ffc8; text-shadow: 0 0 6px #00ffc8; animation: hudpulse 0.8s infinite; }
@keyframes hudpulse { 50% { opacity: 0.4; } }
.overlay { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; background: rgba(3,4,10,0.82); font-family: 'Courier New', monospace; color: #cfd8ff; z-index: 10; }
.overlay h1 { font-size: 42px; letter-spacing: 6px; }
.overlay .neon-cyan { color: #00e5ff; text-shadow: 0 0 16px #00e5ff; }
.overlay .neon-red { color: #ff2d55; text-shadow: 0 0 16px #ff2d55; }
.overlay .neon-mint { color: #00ffc8; text-shadow: 0 0 16px #00ffc8; }
.overlay .stats { font-size: 15px; color: #8892c0; line-height: 1.8; text-align: center; }
.overlay button { pointer-events: auto; font-family: inherit; font-size: 17px; padding: 10px 34px; background: transparent; color: #00e5ff; border: 1px solid #00e5ff; cursor: pointer; letter-spacing: 3px; }
.overlay button:hover { background: #00e5ff22; box-shadow: 0 0 14px #00e5ff66; }
.overlay .cards { display: flex; gap: 16px; }
.overlay .card { pointer-events: auto; width: 190px; padding: 18px 16px; border: 1px solid #3a2a6e; background: #0c0a1acc; cursor: pointer; text-align: center; transition: all .12s; }
.overlay .card:hover { border-color: #b44dff; box-shadow: 0 0 18px #b44dff55; transform: translateY(-4px); }
.overlay .card .tag { font-size: 10px; letter-spacing: 2px; color: #b44dff; }
.overlay .card .title { font-size: 16px; margin: 10px 0 8px; color: #e8ecff; }
.overlay .card .desc { font-size: 12px; color: #8892c0; line-height: 1.5; }
`;

let el = {};

export function initHud() {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const hud = document.createElement('div');
  hud.id = 'hud';
  hud.innerHTML = `
    <div class="xpbar"><div id="xpfill"></div></div>
    <div class="top">
      <div class="timer" id="timer">00:00</div>
      <div class="sub">Lv <span id="level">1</span> · 처치 <span id="kills">0</span></div>
    </div>
    <div class="hackwrap">
      <div class="hackbar"><div id="hackfill"></div></div>
      <div class="hacklabel" id="hacklabel">해킹 충전 중</div>
    </div>
    <div class="bottom">
      <div class="hpbar"><div id="hpfill"></div></div>
      <div class="hptext"><span id="hptext">100 / 100</span></div>
    </div>
  `;
  document.body.appendChild(hud);

  el = {
    timer: hud.querySelector('#timer'),
    level: hud.querySelector('#level'),
    kills: hud.querySelector('#kills'),
    xpfill: hud.querySelector('#xpfill'),
    hpfill: hud.querySelector('#hpfill'),
    hptext: hud.querySelector('#hptext'),
    hackfill: hud.querySelector('#hackfill'),
    hacklabel: hud.querySelector('#hacklabel'),
    hud,
  };
}

export function updateHud({ elapsed, level, kills, xpRatio, hp, maxHp, hackGauge }) {
  const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const s = String(Math.floor(elapsed % 60)).padStart(2, '0');
  el.timer.textContent = `${m}:${s}`;
  el.level.textContent = level;
  el.kills.textContent = kills;
  el.xpfill.style.width = `${Math.min(100, xpRatio * 100)}%`;
  el.hpfill.style.width = `${Math.max(0, (hp / maxHp) * 100)}%`;
  el.hptext.textContent = `${Math.ceil(hp)} / ${maxHp}`;
  el.hackfill.style.width = `${Math.min(100, hackGauge)}%`;
  if (hackGauge >= 100) {
    el.hacklabel.textContent = '[SPACE] 해킹 준비 완료';
    el.hacklabel.classList.add('ready');
  } else {
    el.hacklabel.textContent = '해킹 충전 중';
    el.hacklabel.classList.remove('ready');
  }
}

export function setHudVisible(v) {
  el.hud.style.display = v ? '' : 'none';
}

// 범용 오버레이 (타이틀/레벨업/게임오버/승리에서 재사용)
export function showOverlay(html) {
  const div = document.createElement('div');
  div.className = 'overlay';
  div.innerHTML = html;
  document.body.appendChild(div);
  return div;
}

export function removeOverlay(div) {
  div?.remove();
}
