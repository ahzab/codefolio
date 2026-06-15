// Build step: convert src/writing/content/*.md into styled article HTML pages.
// Markdown (with frontmatter) is the source of truth; the .html output is gitignored.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';

// Syntax-highlight code blocks at build time (Atom One Dark via _code.scss).
marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  })
);

const root = dirname(fileURLToPath(import.meta.url));
const contentDir = join(root, '../src/writing/content');
const outDir = join(root, '../src/writing');
const heroDir = join(root, '../public/writing/hero');
const indexPath = join(root, '../src/index.html');

const FONTS =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;700&display=swap';
const SITE = 'https://codefolio.dev';

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Deterministic, on-brand hero banner per post (no external images / licensing).
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function genHero(slug, tag) {
  const h = hashStr(slug);
  const h1 = h % 360;
  const h2 = (h1 + 150) % 360;
  const h3 = (h1 + 45) % 360;
  const bx = 18 + (h % 30);
  const by = 22 + ((h >> 3) % 30);
  const cx = 64 + ((h >> 6) % 26);
  const cy = 58 + ((h >> 9) % 26);
  const label = escapeHtml(String(tag).toUpperCase());
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 500" width="1200" height="500" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${h1}, 45%, 13%)"/>
      <stop offset="1" stop-color="hsl(${h2}, 42%, 8%)"/>
    </linearGradient>
    <radialGradient id="b1" cx="${bx}%" cy="${by}%" r="46%">
      <stop offset="0" stop-color="hsl(${h1}, 82%, 62%)" stop-opacity="0.5"/>
      <stop offset="1" stop-color="hsl(${h1}, 82%, 62%)" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="b2" cx="${cx}%" cy="${cy}%" r="42%">
      <stop offset="0" stop-color="hsl(${h3}, 85%, 60%)" stop-opacity="0.4"/>
      <stop offset="1" stop-color="hsl(${h3}, 85%, 60%)" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.1" fill="#ffffff" opacity="0.06"/>
    </pattern>
  </defs>
  <rect width="1200" height="500" fill="url(#bg)"/>
  <rect width="1200" height="500" fill="url(#b1)"/>
  <rect width="1200" height="500" fill="url(#b2)"/>
  <rect width="1200" height="500" fill="url(#dots)"/>
  <path d="M1066 360 h74 M1103 323 v74" stroke="#ffffff" stroke-opacity="0.22" stroke-width="2"/>
  <text x="58" y="452" font-family="'JetBrains Mono', ui-monospace, monospace" font-size="26" letter-spacing="8" fill="#ffffff" fill-opacity="0.7">${label}</text>
</svg>
`;
}

function card({ slug, title = slug, tag = '', description = '', image = '' }) {
  const hero = image || `/writing/hero/${slug}.svg`;
  return `                <a class="writing-card" href="writing/${slug}.html">
                    <img class="writing-card__hero" src="${hero}" alt="" loading="lazy">
                    <span class="writing-card__tag">${escapeHtml(tag)}</span>
                    <h3 class="writing-card__title">${escapeHtml(title)}</h3>
                    <p class="writing-card__excerpt">${escapeHtml(description)}</p>
                    <span class="writing-card__more">Read →</span>
                </a>`;
}

function page({ slug, title = slug, description = '', tag = '', date = '', image = '', bodyHtml }) {
  const t = escapeHtml(title);
  const url = `${SITE}/writing/${slug}.html`;
  const hero = image || `/writing/hero/${slug}.svg`;
  const ogImage = !image
    ? `${SITE}/og-preview.png`
    : image.startsWith('http')
      ? image
      : `${SITE}${image.startsWith('/') ? '' : '/'}${image}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>${t} · Abdel Ahzab</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${url}">

    <meta property="og:type" content="article">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${t}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${ogImage}">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${url}">
    <meta property="twitter:title" content="${t}">
    <meta property="twitter:description" content="${escapeHtml(description)}">
    <meta property="twitter:image" content="${ogImage}">

    <link rel="stylesheet" href="${FONTS}">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
    <meta name="theme-color" content="#0a0a0c">

    <script>
        const theme = localStorage.getItem('theme') || 'system';
        if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    </script>
</head>
<body>

<header class="site-header">
    <div class="site-header__inner">
        <a href="../index.html" class="mark" aria-label="Home">
            <span class="mark-glyph" aria-hidden="true">
                <span class="mark-glyph__slash"></span>
                <span class="mark-glyph__dot"></span>
            </span>
            <span class="mark-text">
                <span class="mark-text__name">Abdel Ahzab</span>
                <span class="mark-text__role"><span>Engineer / Applied AI</span></span>
            </span>
        </a>
        <a href="../index.html#writing" class="article__back">← Writing</a>
    </div>
</header>

<main>
    <article class="article">
        <img class="article__hero" src="${hero}" alt="">
        <p class="article__meta">${escapeHtml(tag)} · ${escapeHtml(date)}</p>
        <h1>${t}</h1>
${bodyHtml}
        <div class="article__footer">
            Written by Abdel Ahzab. <a href="../index.html">More at codefolio.dev</a> · <a href="https://x.com/T3chW1zard" target="_blank" rel="noopener noreferrer">@T3chW1zard</a>
        </div>
    </article>
</main>

<script type="module" src="../styles/main.scss"></script>
</body>
</html>
`;
}

const posts = readdirSync(contentDir)
  .filter((f) => f.endsWith('.md'))
  .map((file) => {
    const slug = basename(file, '.md');
    const { data, content } = matter(readFileSync(join(contentDir, file), 'utf8'));
    return { slug, data, content };
  })
  .sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999));

mkdirSync(heroDir, { recursive: true });

const cards = [];
for (const { slug, data, content } of posts) {
  const bodyHtml = marked.parse(content);
  writeFileSync(join(outDir, `${slug}.html`), page({ slug, ...data, bodyHtml }));
  if (!data.image) writeFileSync(join(heroDir, `${slug}.svg`), genHero(slug, data.tag));
  cards.push(card({ slug, ...data }));
  console.log(`  writing/${slug}.html`);
}

// Inject the generated cards into the homepage Writing section (between markers).
const indexHtml = readFileSync(indexPath, 'utf8').replace(
  /<!-- writing:cards:start -->[\s\S]*?<!-- writing:cards:end -->/,
  `<!-- writing:cards:start -->\n${cards.join('\n')}\n                <!-- writing:cards:end -->`
);
writeFileSync(indexPath, indexHtml);

console.log(`build-writing: generated ${posts.length} articles, hero images, and homepage cards`);
