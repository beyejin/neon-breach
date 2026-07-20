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
      '--theme-page-bg': '#091017',
      '--theme-overlay': 'rgba(8, 11, 16, .94)',
      '--theme-text': '#e0e6e8',
      '--theme-text-bright': '#f2f5f6',
      '--theme-muted': '#9ba7ae',
      '--theme-line': '#46535d',
      '--theme-accent': '#b85b52',
      '--theme-accent-soft': '#e4a08e',
      '--theme-panel': 'rgba(20, 25, 31, .96)',
      '--theme-panel-solid': '#151a20',
      '--theme-card-line': '#46535d',
      '--theme-danger-bg': '#2a151b',
      '--theme-danger-line': '#82404b',
      '--theme-danger': '#d46166',
      '--theme-success': '#99bda4',
      '--theme-xp': '#c8a56f',
      '--theme-hack': '#88b8a4',
      '--theme-button-text': '#171418',
      '--theme-portrait-filter': 'saturate(.72) contrast(1.12)',
    }),
    canvas: Object.freeze({
      background: '#091017',
      tile: '#101a22',
      grid: '#1e303b',
      noise: '#2b4e5e',
      bloom: Object.freeze({ strength: 0.24, radius: 0.2, threshold: 0.78 }),
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
