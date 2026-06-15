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

const THEMES = {
  ai: { hue: 265, accent: 290, motif: 'ai' },
  nextjs: { hue: 205, accent: 190, motif: 'web' },
  security: { hue: 6, accent: 30, motif: 'shield' },
  stack: { hue: 150, accent: 168, motif: 'layers' },
  building: { hue: 28, accent: 44, motif: 'blocks' },
  default: { hue: 222, accent: 260, motif: 'ai' },
};

function themeFor(tag) {
  const t = String(tag).toLowerCase();
  if (t.includes('next')) return THEMES.nextjs;
  if (t.includes('secur')) return THEMES.security;
  if (t.includes('stack') || t.includes('data')) return THEMES.stack;
  if (t.includes('build')) return THEMES.building;
  if (t.includes('ai')) return THEMES.ai;
  return THEMES.default;
}

function motifFor(name, acc) {
  const s = `hsl(${acc}, 80%, 72%)`;
  const motifs = {
    ai: `<g transform="translate(840,140)">
    <path d="M40 40 L160 20 M40 40 L120 130 M160 20 L240 90 M120 130 L240 90 M120 130 L80 220 M240 90 L200 200 M80 220 L200 200" stroke="${s}" stroke-opacity="0.3" stroke-width="2" fill="none"/>
    <g fill="${s}" fill-opacity="0.5"><circle cx="40" cy="40" r="9"/><circle cx="160" cy="20" r="7"/><circle cx="240" cy="90" r="10"/><circle cx="120" cy="130" r="8"/><circle cx="80" cy="220" r="7"/><circle cx="200" cy="200" r="9"/></g>
  </g>`,
    web: `<g transform="translate(860,110)" fill="none" stroke="${s}" stroke-width="2.5">
    <path d="M150 30 L260 255 L40 255 Z" stroke-opacity="0.4"/>
    <circle cx="150" cy="175" r="125" stroke-opacity="0.16"/>
    <path d="M150 30 L150 255" stroke-opacity="0.22"/>
  </g>`,
    shield: `<g transform="translate(905,105)" fill="none" stroke="${s}" stroke-width="2.5">
    <path d="M120 20 L220 60 L220 150 C220 232 168 272 120 292 C72 272 20 232 20 150 L20 60 Z" stroke-opacity="0.4"/>
    <path d="M92 150 l22 24 l44 -60" stroke-width="3" stroke-opacity="0.55"/>
  </g>`,
    layers: `<g transform="translate(880,120)" fill="none" stroke="${s}" stroke-width="2.5" stroke-opacity="0.4">
    <ellipse cx="130" cy="50" rx="112" ry="34"/>
    <path d="M18 50 V132 C18 151 68 167 130 167 C192 167 242 151 242 132 V50"/>
    <path d="M18 110 C18 129 68 145 130 145 C192 145 242 129 242 110" stroke-opacity="0.24"/>
  </g>`,
    blocks: `<g transform="translate(885,115)" fill="none" stroke="${s}" stroke-width="2.5" stroke-opacity="0.42">
    <rect x="20" y="200" width="78" height="70" rx="6"/>
    <rect x="108" y="148" width="78" height="122" rx="6"/>
    <rect x="196" y="86" width="78" height="184" rx="6"/>
  </g>`,
  };
  return motifs[name] || motifs.ai;
}

function genHero(slug, tag) {
  const h = hashStr(slug);
  const th = themeFor(tag);
  const h1 = th.hue;
  const h2 = (th.hue + 16) % 360;
  const bx = 14 + (h % 24);
  const by = 18 + ((h >> 3) % 24);
  const cx = 58 + ((h >> 6) % 20);
  const cy = 52 + ((h >> 9) % 22);
  const label = escapeHtml(String(tag).toUpperCase());
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 500" width="1200" height="500" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${h1}, 48%, 12%)"/>
      <stop offset="1" stop-color="hsl(${h2}, 44%, 7%)"/>
    </linearGradient>
    <radialGradient id="b1" cx="${bx}%" cy="${by}%" r="48%">
      <stop offset="0" stop-color="hsl(${th.accent}, 82%, 62%)" stop-opacity="0.45"/>
      <stop offset="1" stop-color="hsl(${th.accent}, 82%, 62%)" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="b2" cx="${cx}%" cy="${cy}%" r="44%">
      <stop offset="0" stop-color="hsl(${h1}, 80%, 58%)" stop-opacity="0.38"/>
      <stop offset="1" stop-color="hsl(${h1}, 80%, 58%)" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.1" fill="#ffffff" opacity="0.05"/>
    </pattern>
  </defs>
  <rect width="1200" height="500" fill="url(#bg)"/>
  <rect width="1200" height="500" fill="url(#b1)"/>
  <rect width="1200" height="500" fill="url(#b2)"/>
  <rect width="1200" height="500" fill="url(#dots)"/>
  ${motifFor(th.motif, th.accent)}
  <text x="58" y="452" font-family="'JetBrains Mono', ui-monospace, monospace" font-size="26" letter-spacing="8" fill="#ffffff" fill-opacity="0.72">${label}</text>
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
  const url = `${SITE}/writing/${slug}`;
  const hero = image || `/writing/hero/${slug}.svg`;
  const ogImage = !image
    ? `${SITE}/og-preview.png`
    : image.startsWith('http')
      ? image
      : `${SITE}${image.startsWith('/') ? '' : '/'}${image}`;
  const shareUrl = encodeURIComponent(url);
  const shareText = encodeURIComponent(title);
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
        <div class="article__share" aria-label="Share this article">
          <span class="article__share-label">Share</span>
          <a class="article__share-btn" href="https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}" target="_blank" rel="noopener noreferrer">X</a>
          <a class="article__share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <button class="article__share-btn" type="button" data-copy="${url}">Copy link</button>
        </div>
        <div class="article__footer">
            Written by Abdel Ahzab. <a href="../index.html">More at codefolio.dev</a> · <a href="https://x.com/T3chW1zard" target="_blank" rel="noopener noreferrer">@T3chW1zard</a>
        </div>
    </article>
</main>

<script>
(function () {
  // Copy-link share
  var copyBtn = document.querySelector('.article__share-btn[data-copy]');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var link = copyBtn.getAttribute('data-copy');
      var done = function () {
        var prev = copyBtn.textContent;
        copyBtn.textContent = 'Copied';
        setTimeout(function () { copyBtn.textContent = prev; }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(done, done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = link; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta); done();
      }
    });
  }

  // Listen (text-to-speech) with the most natural voice available
  var synth = window.speechSynthesis;
  var btn = document.querySelector('.article__listen');
  if (!btn) return;
  if (!synth) { btn.style.display = 'none'; return; }
  var icon = btn.querySelector('.article__listen-icon');
  var label = btn.querySelector('.article__listen-label');

  function pickVoice() {
    var voices = synth.getVoices() || [];
    if (!voices.length) return null;
    var en = voices.filter(function (v) { return /^en(-|_|$)/i.test(v.lang); });
    var pool = en.length ? en : voices;
    var prefer = [
      function (v) { return /natural|neural|premium|enhanced/i.test(v.name); },
      function (v) { return /google/i.test(v.name); },
      function (v) { return /(samantha|aria|jenny|libby|sonia|serena|allison|ava|nora|emma)/i.test(v.name); },
      function (v) { return v.localService === false; },
    ];
    for (var i = 0; i < prefer.length; i++) {
      var found = pool.find(prefer[i]);
      if (found) return found;
    }
    return pool[0];
  }

  var voice = null;
  function ensureVoice() { if (!voice) voice = pickVoice(); return voice; }
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = function () { voice = pickVoice(); };
  }
  ensureVoice();

  function setState(s) {
    if (s === 'playing') { icon.textContent = '⏸'; label.textContent = 'Pause'; }
    else if (s === 'paused') { icon.textContent = '▶'; label.textContent = 'Resume'; }
    else { icon.textContent = '▶'; label.textContent = 'Listen'; }
  }
  function articleText() {
    var nodes = document.querySelectorAll('.article h1, .article h2, .article p, .article li');
    var parts = [];
    nodes.forEach(function (n) {
      if (!n.closest('pre') && !n.closest('.article__footer') && !n.closest('.article__share')) parts.push(n.textContent);
    });
    return parts.join('. ');
  }
  btn.addEventListener('click', function () {
    if (synth.speaking && !synth.paused) { synth.pause(); setState('paused'); return; }
    if (synth.paused) { synth.resume(); setState('playing'); return; }
    synth.cancel();
    var u = new SpeechSynthesisUtterance(articleText());
    var v = ensureVoice();
    if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = 0.96;
    u.pitch = 1.02;
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
