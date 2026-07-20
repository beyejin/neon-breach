// 프로시저럴 픽셀 스프라이트 — 외부 에셋 없이 전부 코드로 생성
import * as THREE from 'three';

// 공통 팔레트
export const COL = {
  cyan: '#d97835',    // 현장 장비 강조색
  magenta: '#b64a3f', // 위험 개체
  magentaDark: '#5f302b',
  mint: '#7f9a76',    // 복구된 아군
  mintDark: '#35493a',
  purple: '#c39a5b',  // 회수 기록
  yellow: '#e7c66a',  // 아군 탄
  orange: '#d97835',
  dark1: '#1b1e19',
  dark2: '#34382f',
  dark3: '#252920',
  white: '#eee7d5',
};

// 픽셀맵 정의: 문자 → 팔레트 색, '.' = 투명
const DEFS = {
  player: {
    pal: {
      h: '#171c27',   // 이도: 짧은 검은 머리
      H: '#35445a',
      s: '#c99170',
      d: '#62483e',   // 수염과 얼굴 음영
      j: '#1c2938',   // 낡은 기술 재킷
      J: '#354b60',
      r: '#d97835',   // 공공 복구 단말
      p: '#18202d',
      b: '#39485a',
    },
    frames: [
      [
        '....hhhh....',
        '...hhhhhh...',
        '..hhHhHhhh..',
        '...ssssss...',
        '...sdsds....',
        '...ssddss...',
        '..JJjjjjJJ..',
        '.jjJjrrjJjj.',
        '.jjjjrrjjjj.',
        '.j..jjjj..j.',
        '....jjjj....',
        '....pppp....',
        '...pp..pp...',
        '...pp..pp...',
        '..bb....bb..',
        '..bb....bb..',
      ],
      [
        '....hhhh....',
        '...hhhhhh...',
        '..hhHhHhhh..',
        '...ssssss...',
        '...sdsds....',
        '...ssddss...',
        '..JJjjjjJJ..',
        '.jjJjrrjJjj.',
        '.jjjjrrjjjj.',
        '.j..jjjj..j.',
        '....pppp....',
        '....pppp....',
        '...pp.pp....',
        '....bb.bb...',
        '...bb...bb..',
      ],
    ],
  },
  nari: {
    pal: {
      h: '#111824', H: '#33465b', s: '#c99578',
      j: '#17241d', J: '#334b3a', c: '#d97835', b: '#384139',
    },
    frames: [[
      '...hhhhhh...',
      '..hhhhhhhh..',
      '..hHssssHh..',
      '.c.ssssssc..',
      '.c.ss..ss...',
      '.c..ssss....',
      '..JJjjjjJJ..',
      '.jjJjccjJjj.',
      '.jjjjccjjjj.',
      '.j..jjjj..j.',
      '....jjjj....',
      '....bbbb....',
      '...bb..bb...',
      '...bb..bb...',
      '..bb....bb..',
      '..bb....bb..',
    ]],
  },
  haeju: {
    pal: {
      h: '#171922', H: '#39404c', s: '#c88f6d',
      u: '#183148', U: '#2c536a', v: '#d1df83', b: '#314253',
    },
    frames: [[
      '...hhhhHh...',
      '..hhhhhhhh..',
      '..hHssssHh.h',
      '...ssssss.hh',
      '...ss..ss...',
      '....ssss....',
      '..UUuuuUUU..',
      '.uuvvUuvvuu.',
      '.uuvvUuvvuu.',
      '.u..uuuu..u.',
      '....uuuu....',
      '....bbbb....',
      '...bb..bb...',
      '...bb..bb...',
      '..bb....bb..',
      '..bb....bb..',
    ]],
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

export function makeImageTexture(url) {
  const key = `image:${url}`;
  if (cache.has(key)) return cache.get(key);
  const texture = new THREE.TextureLoader().load(url);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, texture);
  return texture;
}

export function makePixelCanvas(name, frame = 0, variant = null) {
  const def = DEFS[name];
  if (!def) throw new Error(`unknown sprite: ${name}`);
  const rows = def.frames[frame % def.frames.length];
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(...rows.map((row) => row.length));
  canvas.height = rows.length;
  const context = canvas.getContext('2d');
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const character = row[x];
      if (character === '.') continue;
      let color = def.pal[character];
      if (!color) continue;
      if (variant === 'ally' && ALLY_RECOLOR[color]) color = ALLY_RECOLOR[color];
      context.fillStyle = color;
      context.fillRect(x, y, 1, 1);
    }
  });
  return canvas;
}

export function makeSprite(name, frame = 0, variant = null) {
  const key = `${name}:${frame}:${variant || ''}`;
  if (cache.has(key)) return cache.get(key);

  const cv = makePixelCanvas(name, frame, variant);
  const w = cv.width;
  const h = cv.height;

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
