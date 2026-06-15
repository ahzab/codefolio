// Optimize hero photos in public/writing/img/ in place: cap width, recompress as
// progressive mozjpeg. Safe to re-run (idempotent enough for web heroes).
// Usage: node scripts/optimize-images.mjs   (or `yarn optimize:images`)
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import sharp from 'sharp';

const root = dirname(fileURLToPath(import.meta.url));
const imgDir = join(root, '../public/writing/img');

export const MAX_WIDTH = 1600;
export const QUALITY = 72;

const files = readdirSync(imgDir).filter((f) => /\.(jpe?g|png)$/i.test(f));
let before = 0;
let after = 0;

for (const f of files) {
  const p = join(imgDir, f);
  const inBuf = readFileSync(p);
  const out = await sharp(inBuf)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true, progressive: true })
    .toBuffer();
  writeFileSync(p.replace(/\.(jpe?g|png)$/i, '.jpg'), out);
  before += inBuf.length;
  after += out.length;
  console.log(`  ${f}: ${(inBuf.length / 1024).toFixed(0)}KB -> ${(out.length / 1024).toFixed(0)}KB`);
}

console.log(
  `optimize-images: ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB (${files.length} files)`
);
