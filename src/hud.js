// DOM 오버레이 HUD
const css = `
#hud { position: fixed; inset: 0; pointer-events: none; font-family: 'SFMono-Regular', Menlo, monospace; color: var(--theme-text); user-select: none; }
#hud .top { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); text-align: center; }
#hud .timer { display: inline-block; padding: 3px 10px; font-size: 28px; font-weight: bold; color: var(--theme-text-bright); background: var(--theme-panel); border-bottom: 3px solid var(--theme-accent); }
#hud .sub { font-size: 12px; margin-top: 3px; color: var(--theme-muted); }
#hud .bossbar { display: none; width: 340px; height: 9px; margin: 8px auto 0; background: var(--theme-danger-bg); border: 1px solid var(--theme-danger-line); }
#hud .bossbar > div { height: 100%; width: 100%; background: var(--theme-danger); }
#hud .bossname { display: none; font-size: 11px; letter-spacing: 3px; color: var(--theme-danger); margin-top: 3px; }
#hud .xpbar { position: absolute; top: 0; left: 0; right: 0; height: 5px; background: var(--theme-panel-solid); }
#hud .xpbar > div { height: 100%; width: 0%; background: var(--theme-xp); transition: width .15s; }
#hud .bottom { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); width: 320px; text-align: center; }
#hud .hpbar { height: 12px; background: var(--theme-danger-bg); border: 1px solid var(--theme-danger-line); }
#hud .hpbar > div { height: 100%; width: 100%; background: var(--theme-danger); transition: width .1s; }
#hud .hptext { font-size: 11px; margin-top: 2px; color: var(--theme-muted); }
#hud .hackwrap { position: absolute; bottom: 52px; left: 50%; transform: translateX(-50%); width: 220px; text-align: center; }
#hud .hackbar { height: 7px; background: var(--theme-panel-solid); border: 1px solid var(--theme-line); }
#hud .hackbar > div { height: 100%; width: 0%; background: var(--theme-hack); transition: width .15s; }
#hud .hacklabel { font-size: 10px; color: var(--theme-success); margin-top: 2px; letter-spacing: 1px; }
#hud .hacklabel.ready { color: var(--theme-text-bright); animation: hudpulse 0.8s infinite; }
@keyframes hudpulse { 50% { opacity: 0.4; } }
.overlay { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; background: var(--theme-overlay-pattern), var(--theme-overlay); font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif; color: var(--theme-text); z-index: 10; }
.overlay h1 { font-size: 42px; letter-spacing: 6px; }
.overlay .accent-primary { color: var(--theme-text-bright); border-bottom: 5px solid var(--theme-accent); padding-bottom: 8px; }
.overlay .neon-red { color: var(--theme-danger); }
.overlay .neon-mint { color: var(--theme-success); }
.overlay .stats { font-size: 15px; color: var(--theme-muted); line-height: 1.8; text-align: center; }
.overlay button { pointer-events: auto; font-family: inherit; font-size: 16px; padding: 11px 32px; background: var(--theme-accent); color: var(--theme-button-text); border: 1px solid var(--theme-accent-soft); cursor: pointer; font-weight: 700; letter-spacing: 2px; }
.overlay button:hover { background: var(--theme-accent-soft); }
.overlay .cards { display: flex; gap: 16px; }
.overlay .card { pointer-events: auto; width: 190px; padding: 18px 16px; border: 1px solid var(--theme-card-line); border-top: 4px solid var(--theme-xp); background: var(--theme-panel); cursor: pointer; text-align: center; transition: all .12s; }
.overlay .card:hover { border-color: var(--theme-accent); transform: translateY(-4px); }
.overlay .card .tag { font-size: 10px; letter-spacing: 2px; color: var(--theme-xp); }
.overlay .card .title { font-size: 16px; margin: 10px 0 8px; color: var(--theme-text-bright); }
.overlay .card .desc { font-size: 12px; color: var(--theme-muted); line-height: 1.5; }
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
      <div class="sub">Lv <span id="level">1</span> · 차단 <span id="blocks">0</span></div>
      <div class="sub">복구 드론 <span id="allies">0</span> · 현장 파견 <span id="dispatched">0</span></div>
      <div class="bossbar" id="bossbar"><div id="bossfill"></div></div>
      <div class="bossname" id="bossname">중앙 통제 코어</div>
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
    blocks: hud.querySelector('#blocks'),
    allies: hud.querySelector('#allies'),
    dispatched: hud.querySelector('#dispatched'),
    xpfill: hud.querySelector('#xpfill'),
    hpfill: hud.querySelector('#hpfill'),
    hptext: hud.querySelector('#hptext'),
    hackfill: hud.querySelector('#hackfill'),
    hacklabel: hud.querySelector('#hacklabel'),
    bossbar: hud.querySelector('#bossbar'),
    bossfill: hud.querySelector('#bossfill'),
    bossname: hud.querySelector('#bossname'),
    hud,
  };
  setHudVisible(false);
}

export function updateHud({
  elapsed,
  level,
  blocks,
  xpRatio,
  hp,
  maxHp,
  hackGauge,
  allyCount = 0,
  dispatchedDroneCount = 0,
  hackTarget = null,
}) {
  const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const s = String(Math.floor(elapsed % 60)).padStart(2, '0');
  el.timer.textContent = `${m}:${s}`;
  el.level.textContent = level;
  el.blocks.textContent = blocks;
  el.allies.textContent = allyCount;
  el.dispatched.textContent = dispatchedDroneCount;
  el.xpfill.style.width = `${Math.min(100, xpRatio * 100)}%`;
  el.hpfill.style.width = `${Math.max(0, (hp / maxHp) * 100)}%`;
  el.hptext.textContent = `${Math.ceil(hp)} / ${maxHp}`;
  el.hackfill.style.width = `${Math.min(100, hackGauge)}%`;
  const policyReady = hackTarget?.kind === 'policy-node';
  if (policyReady || (hackGauge >= 100 && hackTarget)) {
    el.hacklabel.textContent = policyReady
      ? '[SPACE] 정책 노드 복구'
      : '[SPACE] 표식 대상 복구';
    el.hacklabel.classList.add('ready');
  } else if (hackGauge >= 100) {
    el.hacklabel.textContent = '복구 대상 탐색 중';
    el.hacklabel.classList.add('ready');
  } else {
    el.hacklabel.textContent = '복구 충전 중';
    el.hacklabel.classList.remove('ready');
  }
}

export function updateBossBar(ratio) {
  const show = ratio != null;
  el.bossbar.style.display = show ? 'block' : 'none';
  el.bossname.style.display = show ? 'block' : 'none';
  if (show) el.bossfill.style.width = `${Math.max(0, ratio * 100)}%`;
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
