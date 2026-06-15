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
const FEATURED_ON_HOME = 3;
const PAGE_SIZE = 6;

const FONTS =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;700&display=swap';
const SITE = 'https://codefolio.dev';
// Set your GA4 Measurement ID here. Analytics stays OFF while this is the placeholder.
const GA_ID = 'G-XXXXXXXXXX';

function gaTag() {
  if (!GA_ID || GA_ID.includes('XXXX')) {
    return '<!-- Google Analytics disabled: set GA_ID in scripts/build-writing.mjs -->';
  }
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){ dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', '${GA_ID}');
    </script>`;
}

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
  return `                <a class="writing-card" href="/writing/${slug}.html">
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
    ${gaTag()}
</head>
<body>

<header class="site-header">
    <div class="site-header__inner">
        <a href="/" class="mark" aria-label="Home">
            <span class="mark-glyph" aria-hidden="true">
                <span class="mark-glyph__slash"></span>
                <span class="mark-glyph__dot"></span>
            </span>
            <span class="mark-text">
                <span class="mark-text__name">Abdel Ahzab</span>
                <span class="mark-text__role"><span>Engineer / Applied AI</span></span>
            </span>
        </a>
        <a href="/#writing" class="article__back">← Writing</a>
    </div>
</header>

<main>
    <article class="article">
        <img class="article__hero" src="${hero}" alt="">
        <p class="article__meta">${escapeHtml(tag)} · ${escapeHtml(date)}</p>
        <h1>${t}</h1>
        <button class="article__listen" type="button" aria-label="Listen to this article">
          <span class="article__listen-icon" aria-hidden="true">&#9654;</span>
          <span class="article__listen-label">Listen</span>
        </button>
${bodyHtml}
        <div class="article__footer">
            Written by Abdel Ahzab. <a href="../index.html">More at codefolio.dev</a> · <a href="https://x.com/T3chW1zard" target="_blank" rel="noopener noreferrer">@T3chW1zard</a>
        </div>
    </article>
</main>

<script>
(function () {
  var synth = window.speechSynthesis;
  var btn = document.querySelector('.article__listen');
  if (!btn) return;
  if (!synth) { btn.style.display = 'none'; return; }
  var icon = btn.querySelector('.article__listen-icon');
  var label = btn.querySelector('.article__listen-label');
  function setState(s) {
    if (s === 'playing') { icon.textContent = '⏸'; label.textContent = 'Pause'; }
    else if (s === 'paused') { icon.textContent = '▶'; label.textContent = 'Resume'; }
    else { icon.textContent = '▶'; label.textContent = 'Listen'; }
  }
  function articleText() {
    var nodes = document.querySelectorAll('.article h1, .article h2, .article p, .article li');
    var parts = [];
    nodes.forEach(function (n) {
      if (!n.closest('pre') && !n.closest('.article__footer')) parts.push(n.textContent);
    });
    return parts.join('. ');
  }
  btn.addEventListener('click', function () {
    if (synth.speaking && !synth.paused) { synth.pause(); setState('paused'); return; }
    if (synth.paused) { synth.resume(); setState('playing'); return; }
    synth.cancel();
    var u = new SpeechSynthesisUtterance(articleText());
    u.rate = 1;
    u.onend = function () { setState('idle'); };
    synth.speak(u);
    setState('playing');
  });
  window.addEventListener('pagehide', function () { synth.cancel(); });
})();
</script>

<script type="module" src="../styles/main.scss"></script>
</body>
</html>
`;
}

function fileName(k) {
  return k === 1 ? 'index.html' : `page-${k}.html`;
}

function pageLink(k) {
  return k === 1 ? '/writing/index.html' : `/writing/page-${k}.html`;
}

function pagination(pageNum, totalPages) {
  if (totalPages <= 1) return '';
  let nums = '';
  for (let k = 1; k <= totalPages; k++) {
    nums +=
      k === pageNum
        ? `<span class="pagination__num is-current" aria-current="page">${k}</span>`
        : `<a class="pagination__num" href="${pageLink(k)}">${k}</a>`;
  }
  const prev =
    pageNum > 1
      ? `<a class="pagination__step" href="${pageLink(pageNum - 1)}">← Prev</a>`
      : `<span class="pagination__step is-disabled">← Prev</span>`;
  const next =
    pageNum < totalPages
      ? `<a class="pagination__step" href="${pageLink(pageNum + 1)}">Next →</a>`
      : `<span class="pagination__step is-disabled">Next →</span>`;
  return `<nav class="pagination" aria-label="Pagination">
            ${prev}
            <div class="pagination__nums">${nums}</div>
            ${next}
        </nav>`;
}

function writingIndex(gridHtml, pageNum, totalPages) {
  const canonical = `${SITE}/writing/${pageNum === 1 ? '' : `page-${pageNum}.html`}`;
  const label = totalPages > 1 ? ` (page ${pageNum})` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Writing${label} · Abdel Ahzab</title>
    <meta name="description" content="Notes on shipping SaaS solo: applied AI, Next.js, security, and building in public.">
    <link rel="canonical" href="${canonical}">

    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonical}">
    <meta property="og:title" content="Writing · Abdel Ahzab">
    <meta property="og:description" content="Notes on shipping SaaS solo: applied AI, Next.js, security, and building in public.">
    <meta property="og:image" content="${SITE}/og-preview.png">
    <meta property="twitter:card" content="summary_large_image">

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
    ${gaTag()}
</head>
<body>

<header class="site-header">
    <div class="site-header__inner">
        <a href="/" class="mark" aria-label="Home">
            <span class="mark-glyph" aria-hidden="true">
                <span class="mark-glyph__slash"></span>
                <span class="mark-glyph__dot"></span>
            </span>
            <span class="mark-text">
                <span class="mark-text__name">Abdel Ahzab</span>
                <span class="mark-text__role"><span>Engineer / Applied AI</span></span>
            </span>
        </a>
        <a href="/" class="article__back">← Home</a>
    </div>
</header>

<main>
    <section class="writing-page">
        <header class="section-head">
            <span class="section-no">All</span>
            <h1 class="section-title">Writing</h1>
            <span class="section-rule" aria-hidden="true"></span>
        </header>
        <div class="writing-grid">
${gridHtml}
        </div>
        ${pagination(pageNum, totalPages)}
    </section>
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

// Article pages + hero images
for (const { slug, data, content } of posts) {
  const bodyHtml = marked.parse(content);
  writeFileSync(join(outDir, `${slug}.html`), page({ slug, ...data, bodyHtml }));
  if (!data.image) writeFileSync(join(heroDir, `${slug}.svg`), genHero(slug, data.tag));
  console.log(`  writing/${slug}.html`);
}

// Homepage: featured posts only (fall back to the first few by order)
const featured = posts.filter((p) => p.data.featured);
const homePosts = (featured.length ? featured : posts).slice(0, FEATURED_ON_HOME);
const homeCards = homePosts.map((p) => card({ slug: p.slug, ...p.data }, 'writing/')).join('\n');
const indexHtml = readFileSync(indexPath, 'utf8')
  .replace(
    /<!-- writing:cards:start -->[\s\S]*?<!-- writing:cards:end -->/,
    `<!-- writing:cards:start -->\n${homeCards}\n                <!-- writing:cards:end -->`
  )
  .replace(
    /<!-- ga:start -->[\s\S]*?<!-- ga:end -->/,
    `<!-- ga:start -->\n    ${gaTag()}\n    <!-- ga:end -->`
  );
writeFileSync(indexPath, indexHtml);

// Full blog index, paginated (index.html, page-2.html, ...)
const pages = [];
for (let i = 0; i < posts.length; i += PAGE_SIZE) pages.push(posts.slice(i, i + PAGE_SIZE));
const totalPages = Math.max(1, pages.length);
pages.forEach((pagePosts, idx) => {
  const pageNum = idx + 1;
  const grid = pagePosts.map((p) => card({ slug: p.slug, ...p.data }, '')).join('\n');
  writeFileSync(join(outDir, fileName(pageNum)), writingIndex(grid, pageNum, totalPages));
});

console.log(
  `build-writing: ${posts.length} posts, ${homePosts.length} featured on home, ${totalPages} index page(s)`
);
