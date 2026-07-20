export const DEFAULT_THEME_ID = 'neon';

const THEMES = Object.freeze({
  neon: Object.freeze({
    id: 'neon',
    label: '네온사인',
    description: '신호와 경고등이 살아 있는 생존극',
    vars: Object.freeze({
      '--theme-page-bg': '#11140f',
      '--theme-overlay': 'rgba(13, 15, 12, .9)',
      '--theme-text': '#e8e1cf',
      '--theme-text-bright': '#eee7d5',
      '--theme-muted': '#afb09e',
      '--theme-line': '#606556',
      '--theme-accent': '#d97835',
      '--theme-accent-soft': '#e2a366',
      '--theme-panel': 'rgba(25, 28, 23, .96)',
      '--theme-panel-solid': '#1b1e19',
      '--theme-card-line': '#606556',
      '--theme-danger-bg': '#2b1d1a',
      '--theme-danger-line': '#784139',
      '--theme-danger': '#b64a3f',
      '--theme-success': '#95ad87',
      '--theme-xp': '#c39a5b',
      '--theme-hack': '#7f9a76',
      '--theme-button-text': '#171914',
      '--theme-portrait-filter': 'saturate(.78) contrast(1.04)',
      '--theme-overlay-pattern': 'none',
    }),
    canvas: Object.freeze({
      background: '#11140f',
      tile: '#171a15',
      grid: '#292d25',
      noise: '#34382f',
      bloom: Object.freeze({ strength: 0.18, radius: 0.18, threshold: 0.82 }),
    }),
  }),
  casefile: Object.freeze({
    id: 'casefile',
    label: '스토리형 괴담 처리',
    description: '사건 기록과 통신 로그로 좇는 불안',
    vars: Object.freeze({
      '--theme-page-bg': '#0d0b12',
      '--theme-overlay': 'rgba(13, 9, 17, .96)',
      '--theme-text': '#e0e6e8',
      '--theme-text-bright': '#f2f5f6',
      '--theme-muted': '#b09eaa',
      '--theme-line': '#694f65',
      '--theme-accent': '#d34d60',
      '--theme-accent-soft': '#f1a6a5',
      '--theme-panel': 'rgba(31, 22, 36, .98)',
      '--theme-panel-solid': '#1f1624',
      '--theme-card-line': '#694f65',
      '--theme-danger-bg': '#32151f',
      '--theme-danger-line': '#9d3f56',
      '--theme-danger': '#e66a78',
      '--theme-success': '#99bda4',
      '--theme-xp': '#c8a56f',
      '--theme-hack': '#88b8a4',
      '--theme-button-text': '#171418',
      '--theme-portrait-filter': 'saturate(.72) contrast(1.12)',
      '--theme-overlay-pattern': 'repeating-linear-gradient(0deg, transparent 0 3px, rgba(211, 77, 96, .045) 3px 4px)',
    }),
    canvas: Object.freeze({
      background: '#0d0b12',
      tile: '#16111b',
      grid: '#3b263e',
      noise: '#71465f',
      bloom: Object.freeze({ strength: 0.28, radius: 0.22, threshold: 0.76 }),
    }),
  }),
});

export function isThemeId(value) {
  return value === 'neon' || value === 'casefile';
}

export function getTheme(themeId = DEFAULT_THEME_ID) {
  return THEMES[isThemeId(themeId) ? themeId : DEFAULT_THEME_ID];
}

export function getThemes() {
  return Object.values(THEMES);
}

export function applyTheme(themeId = DEFAULT_THEME_ID) {
  const theme = getTheme(themeId);
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.dataset.theme = theme.id;
    for (const [property, value] of Object.entries(theme.vars)) {
      root.style.setProperty(property, value);
    }
  }
  return theme;
}
