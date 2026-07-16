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
    pal: {
      h: '#33f6ff',   // 네온 헤어 (밝은 시안 — 블룸 대상)
      H: '#0fb3c4',   // 헤어 음영
      v: '#ffffff',   // 바이저 (강한 발광)
      s: '#f2c9a0',   // 피부
      j: '#2a2a4a',   // 재킷
      J: '#4a4a80',   // 재킷 하이라이트
      a: COL.magenta, // 장갑/액센트
      p: '#1f1f38',   // 하의
      b: '#5a5aa0',   // 부츠
    },
    frames: [
      [
        '....hhhh....',
        '..hhhhhhhh..',
        '.hhhhhhhhhh.',
        '..HvvvvvvH..',
        '..ssssssss..',
        '...ssssss...',
        '..jJjjjjJj..',
        '.jjJjjjjJjj.',
        '.jjjjaajjjj.',
        '.j..jjjj..j.',
        '.a..jjjj..a.',
        '....pppp....',
        '...pp..pp...',
        '...pp..pp...',
        '..bb....bb..',
        '..bb....bb..',
      ],
      [
        '....hhhh....',
        '..hhhhhhhh..',
        '.hhhhhhhhhh.',
        '..HvvvvvvH..',
        '..ssssssss..',
        '...ssssss...',
        '..jJjjjjJj..',
        '.jjJjjjjJjj.',
        '.jjjjaajjjj.',
        '.j..jjjj..j.',
        '.a..jjjj..a.',
        '....pppp....',
        '....pppp....',
        '...pp.pp....',
        '....bb.bb...',
        '...bb...bb..',
      ],
    ],
  },
  rushbot: {
    // 이빨 달린 추격 드론 — 날카로운 마름모
    pal: { 6: COL.magentaDark, 7: COL.magenta, 8: COL.yellow, w: COL.white },
    frames: [[
      '....77....',
      '...7777...',
      '..776677..',
      '.77866877.',
      '7786886877',
      '.77866877.',
      '..776677..',
      '..w7..7w..',
      '...w..w...',
      '..........',
    ]],
  },
  shooterbot: {
    // 포탑형 — 총열 + 발광 코어
    pal: { 6: COL.magentaDark, 7: COL.magenta, 8: COL.yellow, 9: '#3a2a4e' },
    frames: [[
      '.....77.....',
      '.....77.....',
      '.....77.....',
      '..66666666..',
      '.6677777766.',
      '.6778888776.',
      '.6778888776.',
      '.6677777766.',
      '..66666666..',
      '..99....99..',
      '.999....999.',
      '............',
    ]],
  },
  tankbot: {
    // 중장갑 + 궤도(트레드)
    pal: { 6: COL.magentaDark, 7: COL.magenta, 8: COL.yellow, 9: '#3a2a4e', A: '#a03060' },
    frames: [[
      '...AA......AA...',
      '..6AA666666AA6..',
      '.66666666666666.',
      '.67777777777776.',
      '.67666666666676.',
      '.67688888886676.',
      '.67686666686676.',
      '.67688888886676.',
      '.67666666666676.',
      '.67777777777776.',
      '.66666666666666.',
      '9999999999999999',
      '9.9.9.9..9.9.9.9',
    ]],
  },
  elite: {
    // 뿔 달린 대형 유닛 — 위압감
    pal: { 6: COL.magentaDark, 7: COL.magenta, 8: COL.white, 9: COL.yellow, A: '#a03060' },
    frames: [[
      '.AA..........AA.',
      '.7AA........AA7.',
      '..77A......A77..',
      '...777666777....',
      '...67777777776..',
      '..6777777777776.',
      '..677688886776..',
      '.67768888887766.',
      '.67768877888676.',
      '.67768877888676.',
      '.67768888887766.',
      '..677688886776..',
      '..6777777777776.',
      '...67777777776..',
      '....677....776..',
      '....99......99..',
      '...999......999.',
      '................',
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
