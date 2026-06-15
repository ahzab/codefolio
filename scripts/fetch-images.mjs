// Fetch a relevant photo per post from Pexels and save it locally under
// public/writing/img/<slug>.jpg. Posts without a match keep the generated SVG hero.
//
// Usage: PEXELS_API_KEY=xxxxx node scripts/fetch-images.mjs
// Add `force: true` to a post's frontmatter handling below to re-download.
import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';
import matter from 'gray-matter';

const root = dirname(fileURLToPath(import.meta.url));
const contentDir = join(root, '../src/writing/content');
const imgDir = join(root, '../public/writing/img');
const KEY = process.env.PEXELS_API_KEY;

if (!KEY) {
  console.error('PEXELS_API_KEY not set — skipping image fetch (posts keep the generated SVG hero).');
  process.exit(0);
}

mkdirSync(imgDir, { recursive: true });

// Default search query per tag (override per-post with a `query:` frontmatter field).
const QUERY_BY_TAG = {
  'applied ai': 'artificial intelligence abstract technology',
  'next.js': 'web development code on screen',
  security: 'cyber security padlock',
  stack: 'server room database technology',
  building: 'startup workspace minimal desk',
};

function queryFor(data) {
  if (data.query) return data.query;
  const t = String(data.tag || '').toLowerCase();
  return QUERY_BY_TAG[t] || `${data.tag || 'technology'} abstract`;
}

const files = readdirSync(contentDir).filter((f) => f.endsWith('.md'));
let got = 0;

for (const file of files) {
  const slug = basename(file, '.md');
  const { data } = matter(readFileSync(join(contentDir, file), 'utf8'));

  if (!data.force && IMG_EXISTS(slug)) {
    console.log(`  ${slug}: image already saved, skipping`);
    continue;
  }

  const q = queryFor(data);
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&orientation=landscape&size=large&per_page=1`,
      { headers: { Authorization: KEY } }
    );
    if (!res.ok) {
      console.log(`  ${slug}: Pexels HTTP ${res.status} — keeping SVG`);
      continue;
    }
    const json = await res.json();
    const photo = json.photos && json.photos[0];
    if (!photo) {
      console.log(`  ${slug}: no result for "${q}" — keeping SVG`);
      continue;
    }
    const src = photo.src.landscape || photo.src.large2x || photo.src.large || photo.src.original;
    const imgRes = await fetch(src);
    if (!imgRes.ok) {
      console.log(`  ${slug}: image download HTTP ${imgRes.status} — keeping SVG`);
      continue;
    }
    writeFileSync(join(imgDir, `${slug}.jpg`), Buffer.from(await imgRes.arrayBuffer()));
    got++;
    console.log(`  ${slug}: saved photo for "${q}" (by ${photo.photographer}, Pexels)`);
  } catch (e) {
    console.log(`  ${slug}: fetch error — keeping SVG (${e.message})`);
  }
}

function IMG_EXISTS(slug) {
  return ['jpg', 'jpeg', 'png', 'webp'].some((ext) => existsSync(join(imgDir, `${slug}.${ext}`)));
}

console.log(`fetch-images: downloaded ${got} new image(s) to public/writing/img/`);
