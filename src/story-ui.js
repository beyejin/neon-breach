import { getCharacter } from './content/characters.js';
import { getThemes } from './theme.js';

const css = `
#story-root { position: fixed; inset: 0; z-index: 8; pointer-events: none; font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif; color: var(--theme-text); }
.story-comms { position: absolute; left: 50%; bottom: 82px; transform: translateX(-50%); width: min(660px, calc(100vw - 32px)); padding: 14px 16px; border: 1px solid var(--theme-line); border-left: 5px solid var(--theme-accent); background: var(--theme-panel); box-shadow: 0 8px 28px rgba(0, 0, 0, .38); line-height: 1.5; white-space: pre-line; }
.story-comms strong { color: var(--theme-accent-soft); margin-right: 8px; }
.story-message { display: grid; grid-template-columns: 72px 1fr; gap: 14px; align-items: center; margin: 12px 0; }
.story-message-copy { min-width: 0; }
.story-message-header { display: flex; gap: 10px; align-items: baseline; margin-bottom: 4px; }
.story-role { color: var(--theme-muted); font-size: 12px; }
.story-avatar { position: relative; width: 72px; }
.story-portrait { width: 72px; aspect-ratio: 1 / 1; border: 1px solid var(--theme-line); background-repeat: no-repeat; background-size: 300% 100%; filter: var(--theme-portrait-filter); }
.story-comms.story-with-portrait { display: grid; grid-template-columns: 58px 1fr; gap: 12px; align-items: center; }
.story-comms .story-avatar, .story-comms .story-portrait { width: 58px; }
.story-comms-copy { min-width: 0; }
.story-comms-copy .story-role { display: block; margin-bottom: 3px; }
.story-blocking { pointer-events: auto; box-sizing: border-box; padding: 18px; }
.story-blocking > h1 { max-width: 100%; margin: 0; font-size: clamp(26px, 5vw, 42px); line-height: 1.2; text-align: center; overflow-wrap: anywhere; }
.story-blocking .story-copy { box-sizing: border-box; width: min(760px, calc(100vw - 40px)); max-height: 64vh; overflow: auto; padding: 22px; border: 1px solid var(--theme-line); border-top: 4px solid var(--theme-accent); background: var(--theme-panel); line-height: 1.65; text-align: left; white-space: pre-line; }
.story-blocking .story-copy p + p { margin-top: 12px; }
.story-status { color: var(--theme-success); letter-spacing: 1px; }
.story-speaker { color: var(--theme-accent-soft); }
.story-audit { border-color: var(--theme-accent) !important; }
.story-audit h2 { color: var(--theme-accent-soft); margin-bottom: 16px; }
.story-hint { color: var(--theme-muted); margin-top: 18px; text-align: center; }
.story-settings { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.story-theme-settings { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--theme-line); }
.story-theme-label { display: block; margin-bottom: 8px; color: var(--theme-muted); font-size: 12px; letter-spacing: 1px; }
.story-theme-choices { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.story-theme-choice { width: 100%; padding: 10px 12px !important; border: 1px solid var(--theme-line) !important; background: var(--theme-panel-solid) !important; color: var(--theme-text) !important; font-size: 13px !important; letter-spacing: 0 !important; text-align: left; }
.story-theme-choice:hover, .story-theme-choice.selected { border-color: var(--theme-accent) !important; background: var(--theme-panel) !important; }
.story-theme-choice strong { display: block; color: var(--theme-text-bright); }
.story-theme-choice span { display: block; margin-top: 3px; color: var(--theme-muted); font-size: 11px; line-height: 1.4; }
@media (max-width: 600px) {
  .story-blocking { gap: 12px; padding: 12px; }
  .story-blocking > h1 { font-size: 25px; letter-spacing: 3px; }
  .story-blocking .story-copy { width: calc(100vw - 24px); max-height: 68vh; padding: 14px; font-size: 14px; }
  .story-message { grid-template-columns: 62px 1fr; gap: 10px; margin: 10px 0; }
  .story-avatar, .story-portrait { width: 62px; }
  .story-message-header { display: block; }
  .story-role { display: block; margin-top: 2px; }
  .story-theme-choices { grid-template-columns: 1fr; }
  .story-blocking button { font-size: 15px; padding: 9px 24px; }
}
`;

let root = null;
let activeComms = null;
let activeAudit = null;
let activeThemeId = 'neon';
const blockingNodes = new Set();

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function ensureRoot() {
  if (root) return root;
  const style = make('style');
  style.textContent = css;
  document.head.appendChild(style);
  root = make('div');
  root.id = 'story-root';
  document.body.appendChild(root);
  return root;
}

function createBlocking(title) {
  const overlay = make('div', 'overlay story-blocking');
  const heading = make('h1', 'accent-primary', title);
  const copy = make('div', 'story-copy');
  overlay.append(heading, copy);
  ensureRoot().appendChild(overlay);
  blockingNodes.add(overlay);
  return { overlay, copy };
}

export function setStoryTheme(themeId) {
  activeThemeId = themeId;
}

function appendDialogue(container, dialogue = [], themeId = activeThemeId) {
  for (const message of dialogue) {
    const character = getCharacter(message.speaker, themeId);
    const row = make('div', character ? 'story-message' : null);
    if (character) row.appendChild(makePortrait(character, message.speaker));
    const body = make('div', 'story-message-copy');
    const header = make('div', 'story-message-header');
    header.appendChild(make('strong', 'story-speaker', message.speaker));
    if (character) header.appendChild(make('span', 'story-role', character.role));
    body.appendChild(header);
    body.appendChild(make('span', null, message.lines.join('\n')));
    row.appendChild(body);
    container.appendChild(row);
  }
}

function makePortrait(character, speaker) {
  const wrapper = make('div', 'story-avatar');
  const portrait = make('div', 'story-portrait');
  portrait.setAttribute('role', 'img');
  portrait.setAttribute('aria-label', `${speaker} 초상화`);
  portrait.style.backgroundImage = `url(${character.portraitSheet})`;
  portrait.style.backgroundPosition = `${character.portraitPosition} center`;
  wrapper.appendChild(portrait);
  return wrapper;
}

export function showTitleScreen(content, {
  onStart,
  onChallengeStart,
  onArchive,
  nextChapterPending = false,
  theme = activeThemeId,
  onThemeChange,
} = {}) {
  ensureRoot();
  const { overlay, copy } = createBlocking(content.productTitle);
  copy.appendChild(make('p', 'story-status', content.chapterTitle));
  for (const line of content.tutorial) copy.appendChild(make('p', null, line));
  if (nextChapterPending) {
    copy.appendChild(make('p', 'story-hint', 'CHAPTER 2 — 다음 장 준비 중'));
  }
  if (onThemeChange) {
    const settings = make('div', 'story-theme-settings');
    settings.appendChild(make('span', 'story-theme-label', '화면 연출 테마'));
    const choices = make('div', 'story-theme-choices');
    for (const option of getThemes()) {
      const button = make('button', 'story-theme-choice');
      button.dataset.theme = option.id;
      button.setAttribute('aria-pressed', String(option.id === theme));
      if (option.id === theme) button.classList.add('selected');
      button.innerHTML = `<strong>${option.label}</strong><span>${option.description}</span>`;
      button.addEventListener('click', () => onThemeChange(option.id));
      choices.appendChild(button);
    }
    settings.appendChild(choices);
    copy.appendChild(settings);
  }
  const start = make('button', null, 'CHAPTER 1 시작');
  start.dataset.action = 'start';
  start.addEventListener('click', onStart);
  overlay.appendChild(start);
  if (onChallengeStart) {
    const challenge = make('button', null, '1분 극한 생존');
    challenge.dataset.action = 'challenge-start';
    challenge.addEventListener('click', onChallengeStart);
    overlay.appendChild(challenge);
  }
  if (onArchive) {
    const archive = make('button', null, '기록 보관소');
    archive.dataset.action = 'archive';
    archive.addEventListener('click', onArchive);
    overlay.appendChild(archive);
  }
  return overlay;
}

export function showBriefing(content, { retry = false, onStart, theme = activeThemeId } = {}) {
  ensureRoot();
  const { overlay, copy } = createBlocking(content.chapterTitle);
  for (const line of content.statusLines) {
    copy.appendChild(make('p', 'story-status', line));
  }
  appendDialogue(copy, retry ? content.retryDialogue : content.dialogue, theme);
  if (!retry) {
    for (const line of content.tutorial) copy.appendChild(make('p', null, line));
  }
  const button = make('button', null, '작전 시작');
  button.dataset.action = 'start';
  button.addEventListener('click', onStart);
  overlay.appendChild(button);
  return overlay;
}

export function showComms(event) {
  ensureRoot();
  if (activeComms) {
    activeComms.finish('cancelled');
  }

  return new Promise((resolve) => {
    const captions = event.payload.captions;
    const themeId = activeThemeId;
    let index = 0;
    const node = make('div', 'story-comms');
    ensureRoot().appendChild(node);
    let timer = null;
    let settled = false;

    function finish(status) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      node.remove();
      if (activeComms?.node === node) activeComms = null;
      resolve({ status });
    }

    function renderCaption() {
      node.replaceChildren();
      const caption = captions[index];
      const character = getCharacter(caption.speaker, themeId);
      node.classList.toggle('story-with-portrait', Boolean(character));
      if (character) node.appendChild(makePortrait(character, caption.speaker));
      const body = make('div', 'story-comms-copy');
      body.appendChild(make('strong', null, caption.speaker));
      if (character) body.appendChild(make('span', 'story-role', character.role));
      body.appendChild(make('span', null, caption.lines.join('\n')));
      node.appendChild(body);
      index += 1;
      timer = setTimeout(() => {
        if (index >= captions.length) finish('completed');
        else renderCaption();
      }, 2400);
    }

    activeComms = { node, finish };
    renderCaption();
  });
}

function renderAuditCard() {
  const state = activeAudit;
  if (!state) return;
  const card = state.cards[state.index];
  state.copy.replaceChildren();
  state.copy.classList.add('story-audit');
  state.copy.appendChild(make('h2', null, card.heading));
  for (const line of card.lines) state.copy.appendChild(make('p', null, line));
  state.copy.appendChild(make('p', 'story-hint', 'SPACE — 다음 기록'));
  state.readyAt = performance.now() + (state.alreadySeen ? 0 : state.minReadMs);
}

export function showAuditCards(cards, {
  alreadySeen = false,
  minReadMs = 4000,
  onEnter = () => {},
  onExit = () => {},
} = {}) {
  ensureRoot();
  if (activeAudit) activeAudit.finish('cancelled');

  return new Promise((resolve) => {
    const { overlay, copy } = createBlocking('정책 감사');
    let settled = false;
    const state = {
      cards,
      index: 0,
      alreadySeen,
      minReadMs,
      overlay,
      copy,
      readyAt: 0,
      finish(status) {
        if (settled) return;
        settled = true;
        overlay.remove();
        blockingNodes.delete(overlay);
        if (activeAudit === state) activeAudit = null;
        onExit();
        resolve({ status });
      },
    };
    activeAudit = state;
    onEnter();
    renderAuditCard();
  });
}

export function advanceAudit() {
  if (!activeAudit || performance.now() < activeAudit.readyAt) return false;
  activeAudit.index += 1;
  if (activeAudit.index >= activeAudit.cards.length) {
    activeAudit.finish('completed');
  } else {
    renderAuditCard();
  }
  return true;
}

export function showStoryResult(result, {
  onPrimary,
  onReplay,
  onArchive,
  primaryLabel = '타이틀로',
  replayLabel = '다시 플레이',
  communicationMode,
  onCommunicationMode,
} = {}) {
  ensureRoot();
  const { overlay, copy } = createBlocking(result.title);
  if (result.subtitle) copy.appendChild(make('p', 'story-status', result.subtitle));
  appendDialogue(copy, result.dialogue);
  for (const line of result.resultLines || []) copy.appendChild(make('p', null, line));
  if (result.dispatchedDroneCount != null) {
    copy.appendChild(make('p', null, `현장 파견 드론 ${result.dispatchedDroneCount}기`));
  }

  if (onCommunicationMode) {
    const settings = make('div', 'story-settings');
    const modes = [
      ['full', '통신 전체'],
      ['core', '핵심만'],
      ['off', '끄기'],
    ];
    for (const [mode, label] of modes) {
      const button = make('button', null, mode === communicationMode ? `✓ ${label}` : label);
      button.dataset.communicationMode = mode;
      button.addEventListener('click', () => onCommunicationMode(mode));
      settings.appendChild(button);
    }
    overlay.appendChild(settings);
  }

  const actions = [
    ['primary', primaryLabel, onPrimary],
    ['replay', replayLabel, onReplay],
    ['archive', '기록 보관소', onArchive],
  ];
  for (const [action, label, handler] of actions) {
    if (!handler) continue;
    const button = make('button', null, label);
    button.dataset.action = action;
    button.addEventListener('click', handler);
    overlay.appendChild(button);
  }
  return overlay;
}

export function openArchive(entries, { onClose } = {}) {
  ensureRoot();
  const { overlay, copy } = createBlocking('기록 보관소');
  for (const entry of entries) {
    copy.appendChild(make('h2', null, entry.title));
    for (const line of entry.lines) copy.appendChild(make('p', null, line));
  }
  const button = make('button', null, '닫기');
  button.dataset.action = 'close';
  button.addEventListener('click', onClose);
  overlay.appendChild(button);
  return overlay;
}

export function clear() {
  activeComms?.finish('cancelled');
  activeAudit?.finish('cancelled');
  for (const node of blockingNodes) node.remove();
  blockingNodes.clear();
}
