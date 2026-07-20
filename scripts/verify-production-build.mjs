/* global console */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const assets = await readdir('dist/assets');
const bundles = assets.filter((name) => name.endsWith('.js'));
if (bundles.length === 0) throw new Error('dist/assets에 JavaScript 번들이 없습니다.');

const source = (await Promise.all(bundles.map((name) => readFile(join('dist/assets', name), 'utf8')))).join('\n');
if (source.includes('__game')) {
  throw new Error('프로덕션 번들에 DEV debug API가 남아 있습니다.');
}
console.log(`프로덕션 debug API 검증 통과 (${bundles.length}개 번들)`);
