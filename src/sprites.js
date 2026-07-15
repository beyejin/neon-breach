// 프로시저럴 픽셀 스프라이트 — 외부 에셋 없이 전부 코드로 생성
import * as THREE from 'three';

// 공통 팔레트
export const COL = {
  cyan: '#00e5ff',    // 플레이어
  magenta: '#ff2d78', // 적
  magentaDark: '#7a1440',
  mint: '#00ffc8',    // 아군
  mintDark: '#0c4f52',
  purple: '#b44dff',  // XP
  yellow: '#ffe600',  // 아군 탄
  orange: '#ff9f1c',
  dark1: '#1a1a2e',
  dark2: '#2b2b45',
  dark3: '#1f1f38',
  white: '#ffffff',
};

// 픽셀맵 정의: 문자 → 팔레트 색, '.' = 투명
const DEFS = {
  player: {
    pal: { 1: COL.dark1, 2: COL.dark2, 3: COL.cyan, 4: COL.dark3, 5: COL.magenta },
    frames: [
      [
        '...2222...',
        '..222222..',
        '..233332..',
        '..222222..',
        '...2222...',
        '..444444..',
        '.44445444.',
        '.4.4444.4.',
        '...4444...',
        '...4..4...',
        '...1..1...',
        '..11..11..',
      ],
      [
        '...2222...',
        '..222222..',
        '..233332..',
        '..222222..',
        '...2222...',
        '..444444..',
        '.44445444.',
        '.4.4444.4.',
        '...4444...',
        '...4..4...',
        '....1.1...',
        '...11.11..',
      ],
    ],
  },
  rushbot: {
    pal: { 6: COL.magentaDark, 7: COL.magenta, 8: COL.yellow },
    frames: [[
      '...66...',
      '..6776..',
      '.677776.',
      '67788776',
      '.677776.',
      '..6776..',
      '...66...',
      '...6.6..',
    ]],
  },
  shooterbot: {
    pal: { 6: COL.magentaDark, 7: COL.magenta, 8: COL.yellow },
    frames: [[
      '....77....',
      '....66....',
      '.6..66..6.',
      '.66666666.',
      '7667887667',
      '.66666666.',
      '.6..66..6.',
      '....66....',
      '....77....',
      '..........',
    ]],
  },
  tankbot: {
    pal: { 6: COL.magentaDark, 7: COL.magenta, 8: COL.yellow, 9: COL.dark2 },
    frames: [[
      '..6666666666..',
      '.677777777776.',
      '.676666666676.',
      '.676888888676.',
      '.676866668676.',
      '.676866668676.',
      '.676888888676.',
      '.676666666676.',
      '.677777777776.',
      '..6666666666..',
      '..99.9999.99..',
      '..99......99..',
    ]],
  },
  elite: {
    pal: { 6: COL.magentaDark, 7: COL.magenta, 8: COL.white, 9: COL.yellow },
    frames: [[
      '.....666666.....',
      '...6677777766...',
      '..677777777776..',
      '.67766666666776.',
      '.6766888888676.',
      '.67687888878676.',
      '.67687888878676.',
      '.67688888888676.',
      '.67666888866676.',
      '.6766666666676.',
      '.67777777777776.',
      '..677777777776..',
      '...6676666766...',
      '....67....76....',
      '....66....66....',
      '....9......9....',
    ]],
  },
  boss: {
    pal: { 6: COL.magentaDark, 7: COL.magenta, 8: COL.white, 9: COL.yellow },
    frames: [[
      '........66666666........',
      '......6677777777666......',
      '....6677777777777766....',
      '...667776666666677766...',
      '..66776666666666677666..',
      '..67766688888866667766..',
      '.6776668888888886867766.',
      '.677666887777886667766.',
      '6677668877777788667766..',
      '667766887777778866776...',
      '667766887777778866776...',
      '6677668877777788667766..',
      '.677666887777886667766.',
      '.6776668888888866867766.',
      '..67766688888866667766..',
      '..66776666666666677666..',
      '...667776666666677766...',
      '....6677777777777766....',
      '......667777777766......',
      '....99..66666666..99....',
      '...9999....99....9999...',
      '...99......99......99...',
      '...9.......99.......9...',
      '............99..........',
    ]],
  },
  gem: {
    pal: { 'p': COL.purple, 'l': '#d9a0ff' },
    frames: [[
      '..pp..',
      '.pllp.',
      'pllllp',
      'pllllp',
      '.pllp.',
      '..pp..',
    ]],
  },
  bullet: {
    pal: { 'y': COL.yellow, 'w': COL.white },
    frames: [[
      '.yy.',
      'ywwy',
      'ywwy',
      '.yy.',
    ]],
  },
  missile: {
    pal: { 'y': COL.yellow, 'o': COL.orange, 'w': COL.white },
    frames: [[
      '..ww..',
      '.wyyw.',
      '.yyyy.',
      '.yooy.',
      '..oo..',
      '..oo..',
    ]],
  },
  spike: {
    pal: { 'c': COL.cyan, 'w': COL.white },
    frames: [[
      '..cc..',
      '.cwwc.',
      'cwwwwc',
      'cwwwwc',
      '.cwwc.',
      '..cc..',
    ]],
  },
  enemybullet: {
    pal: { 'm': COL.magenta, 'w': '#ffb3d0' },
    frames: [[
      '.mm.',
      'mwwm',
      'mwwm',
      '.mm.',
    ]],
  },
};

// 아군 변환용 리컬러 (마젠타 계열 → 민트 계열)
const ALLY_RECOLOR = {
  [COL.magenta]: COL.mint,
  [COL.magentaDark]: COL.mintDark,
  [COL.yellow]: COL.white,
};

const cache = new Map();

export function makeSprite(name, frame = 0, variant = null) {
  const key = `${name}:${frame}:${variant || ''}`;
  if (cache.has(key)) return cache.get(key);

  const def = DEFS[name];
  if (!def) throw new Error(`unknown sprite: ${name}`);
  const rows = def.frames[frame % def.frames.length];
  const w = Math.max(...rows.map(r => r.length));
  const h = rows.length;

  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      let color = def.pal[ch];
      if (!color) continue;
      if (variant === 'ally' && ALLY_RECOLOR[color]) color = ALLY_RECOLOR[color];
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  });

  const tex = new THREE.CanvasTexture(cv);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.userData = { w, h };
  cache.set(key, tex);
  return tex;
}

export function spriteSize(name) {
  const def = DEFS[name];
  const rows = def.frames[0];
  return { w: Math.max(...rows.map(r => r.length)), h: rows.length };
}

export function frameCount(name) {
  return DEFS[name].frames.length;
}
