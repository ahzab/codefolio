// Build step: convert src/writing/content/*.md into styled article HTML pages.
// Markdown (with frontmatter) is the source of truth; the .html output is gitignored.
import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
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
const IMG_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'avif'];

// A locally downloaded photo (from scripts/fetch-images.mjs), if one exists for this slug.
function localImage(slug) {
  for (const ext of IMG_EXTS) {
    const rel = `/writing/img/${slug}.${ext}`;
    if (existsSync(join(root, '../public' + rel))) return rel;
  }
  return '';
}

// Read raster pixel dimensions synchronously (JPEG/PNG) so we can emit
// og:image:width/height — LinkedIn needs them to render the large image card
// instead of falling back to a bare link.
function imageSize(absPath) {
  try {
    const b = readFileSync(absPath);
    if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50) {
      return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; // PNG
    }
    if (b[0] === 0xff && b[1] === 0xd8) {
      let o = 2; // JPEG: walk markers to the SOF frame header
      while (o + 9 < b.length) {
        if (b[o] !== 0xff) { o++; continue; }
        const m = b[o + 1];
        if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) {
          return { h: b.readUInt16BE(o + 5), w: b.readUInt16BE(o + 7) };
        }
        o += 2 + b.readUInt16BE(o + 2);
      }
    }
  } catch {}
  return null;
}

const FONTS =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;700&display=swap';
const SITE = 'https://www.codefolio.dev';
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

// Visible date format only: "2026-06-14" -> "14/06/26". The ISO value from the md
// is kept untouched for <time datetime>, article:published_time, and schema.
function displayDate(d = '') {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d));
  if (!m) return String(d);
  return `${m[3]}/${m[2]}/${m[1].slice(2)}`;
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
  if (t.includes('next') || t.includes('front')) return THEMES.nextjs;
  if (t.includes('secur') || t.includes('incid')) return THEMES.security;
  if (t.includes('stack') || t.includes('data') || t.includes('back')) return THEMES.stack;
  if (t.includes('build') || t.includes('scale')) return THEMES.building;
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
  const hero = image || localImage(slug) || `/writing/hero/${slug}.svg`;
  return `                <a class="writing-card" href="/writing/${slug}.html">
                    <img class="writing-card__hero" src="${hero}" alt="" loading="lazy">
                    <span class="writing-card__tag">${escapeHtml(tag)}</span>
                    <h3 class="writing-card__title">${escapeHtml(title)}</h3>
                    <p class="writing-card__excerpt">${escapeHtml(description)}</p>
                    <span class="writing-card__more">Read →</span>
                </a>`;
}

// "Read next": up to n posts, same-tag first (most relevant), then fill by order.
function pickRelated(current, all, n = 3) {
  const others = all.filter((p) => p.slug !== current.slug);
  const tag = (current.data.tag || '').toLowerCase();
  const sameTag = others.filter((p) => (p.data.tag || '').toLowerCase() === tag);
  const rest = others.filter((p) => (p.data.tag || '').toLowerCase() !== tag);
  return [...sameTag, ...rest].slice(0, n);
}

function relatedSection(related) {
  if (!related.length) return '';
  const cards = related.map((p) => card({ slug: p.slug, ...p.data })).join('\n');
  return `
        <aside class="article__next" aria-label="Read next">
            <h2 class="article__next-title">Read next</h2>
            <div class="article__next-grid">
${cards}
            </div>
        </aside>`;
}

const ICONS = {
  x: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z"/></svg>',
  reddit: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.01 11.07c.02.16.03.32.03.49 0 2.5-2.91 4.52-6.5 4.52s-6.5-2.02-6.5-4.52c0-.17.01-.33.03-.49a1.6 1.6 0 1 1 1.77-2.55c.87-.6 2.06-.99 3.38-1.04l.71-3.35 2.36.5a1.13 1.13 0 1 0 .13-.6l-2.62-.55-.79 3.74c1.27.07 2.41.46 3.26 1.04a1.6 1.6 0 1 1 1.36 2.31zM9.25 12.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm5.5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-.36 3.2c-.5.5-1.4.74-2.39.74s-1.89-.24-2.39-.74a.27.27 0 1 0-.38.38c.66.66 1.73.86 2.77.86s2.11-.2 2.77-.86a.27.27 0 1 0-.38-.38z"/></svg>',
  hn: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 5l5 7 5-7M12 12v7"/></svg>',
  copy: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  native: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
};

function shareLinks(url, title) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return [
    { name: 'X', href: `https://twitter.com/intent/tweet?text=${t}&url=${u}`, icon: ICONS.x },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, icon: ICONS.linkedin },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, icon: ICONS.facebook },
    { name: 'Reddit', href: `https://www.reddit.com/submit?url=${u}&title=${t}`, icon: ICONS.reddit },
  ];
}

// Structured data (schema.org) so search engines render rich results for posts.
function articleLd({ url, title, description, ogImage, date, tag }) {
  const author = { '@type': 'Person', name: 'Abdel Ahzab', url: SITE };
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${url}#article`,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        headline: title,
        description,
        image: ogImage,
        author,
        publisher: author,
        url,
        ...(date ? { datePublished: date } : {}),
        ...(tag ? { keywords: tag } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Writing', item: `${SITE}/writing` },
          { '@type': 'ListItem', position: 3, name: title },
        ],
      },
    ],
  };
  // Escape "<" so a "</script>" sequence in any field can't break out of the tag.
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

function page({ slug, title = slug, description = '', tag = '', date = '', image = '', bodyHtml, related = [] }) {
  const t = escapeHtml(title);
  const url = `${SITE}/writing/${slug}`;
  const hero = image || localImage(slug) || `/writing/hero/${slug}.svg`;
  // og:image must be an absolute raster URL — social crawlers (X, Facebook) don't
  // render the generated SVG fallback, so use the real photo when one exists and
  // only fall back to the site-wide raster preview when there's no hero photo.
  const ogSrc = image || localImage(slug);
  const ogImage = ogSrc
    ? ogSrc.startsWith('http')
      ? ogSrc
      : `${SITE}${ogSrc.startsWith('/') ? '' : '/'}${ogSrc}`
    : `${SITE}/og-preview.png`;
  let ogDims = '';
  if (ogSrc && !ogSrc.startsWith('http')) {
    const d = imageSize(join(root, '../public' + (ogSrc.startsWith('/') ? '' : '/') + ogSrc));
    if (d) ogDims = `\n    <meta property="og:image:width" content="${d.w}">\n    <meta property="og:image:height" content="${d.h}">`;
  }
  const links = shareLinks(url, title);
  const barLinks = links
    .map((l) => `<a class="article__share-btn" href="${l.href}" target="_blank" rel="noopener noreferrer" aria-label="Share on ${l.name}">${l.icon}</a>`)
    .join('\n          ');
  const railLinks = links
    .map((l) => `<a class="article__rail-btn" href="${l.href}" target="_blank" rel="noopener noreferrer" aria-label="Share on ${l.name}">${l.icon}</a>`)
    .join('\n      ');
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>${t} · Abdel Ahzab</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="author" content="Abdel Ahzab">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="${url}">
    <link rel="sitemap" type="application/xml" href="/sitemap.xml">

    <meta property="og:type" content="article">
    <meta property="og:site_name" content="codefolio.dev">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${t}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${ogImage}">${ogDims}
    <meta property="og:image:alt" content="${t}">
    ${date ? `<meta property="article:published_time" content="${escapeHtml(date)}">` : ''}
    <meta property="article:author" content="Abdel Ahzab">
    ${tag ? `<meta property="article:tag" content="${escapeHtml(tag)}">` : ''}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${url}">
    <meta name="twitter:title" content="${t}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${ogImage}">
    <meta name="twitter:creator" content="@T3chW1zard">
    ${articleLd({ url, title, description, ogImage, date, tag })}

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
                <span class="mark-text__role">
                    <span class="mark-text__issue">No. 2026 / V2</span>
                    <span class="mark-text__sep" aria-hidden="true">·</span>
                    <span>Engineer / Applied AI</span>
                </span>
            </span>
        </a>
        <a href="/writing" class="article__back">← Writing</a>
    </div>
</header>

<main>
    <div class="article__rail" aria-label="Share this article">
      ${railLinks}
      <button class="article__rail-btn" type="button" data-copy="${url}" aria-label="Copy link">${ICONS.copy}</button>
      <button class="article__rail-btn article__share-native" type="button" hidden data-url="${url}" data-title="${t}" aria-label="Share">${ICONS.native}</button>
    </div>
    <article class="article">
        <img class="article__hero" src="${hero}" alt="${t}" width="1200" height="627">
        <p class="article__meta">${escapeHtml(tag)} · <time datetime="${escapeHtml(date)}">${escapeHtml(displayDate(date))}</time></p>
        <h1>${t}</h1>
        <div class="article__actions">
          <button class="article__listen" type="button" aria-label="Listen to this article">
            <span class="article__listen-icon" aria-hidden="true">&#9654;</span>
            <span class="article__listen-label">Listen</span>
          </button>
          <div class="article__share-inline">
            <span class="article__share-label">Share</span>
            <button class="article__share-btn article__share-native" type="button" hidden data-url="${url}" data-title="${t}" aria-label="Share">${ICONS.native}</button>
            ${barLinks}
            <button class="article__share-btn" type="button" data-copy="${url}" aria-label="Copy link">${ICONS.copy}</button>
          </div>
        </div>
${bodyHtml}
        <div class="article__footer">
            Written by Abdel Ahzab. <a href="../index.html">More at codefolio.dev</a> · <a href="https://x.com/T3chW1zard" target="_blank" rel="noopener noreferrer">@T3chW1zard</a>
        </div>
    </article>
${relatedSection(related)}
</main>

<script>
(function () {
  // Copy-link share (toolbar + rail)
  document.querySelectorAll('[data-copy]').forEach(function (cb) {
    cb.addEventListener('click', function () {
      var link = cb.getAttribute('data-copy');
      var flash = function () {
        cb.classList.add('is-copied');
        var prev = cb.getAttribute('aria-label');
        cb.setAttribute('aria-label', 'Link copied');
        setTimeout(function () { cb.classList.remove('is-copied'); cb.setAttribute('aria-label', prev); }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(flash, flash);
      } else {
        var ta = document.createElement('textarea');
        ta.value = link; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta); flash();
      }
    });
  });

  // Social share links (Facebook/X/LinkedIn/Reddit) open in a centered popup.
  // Falls back to the anchor's default new-tab behaviour if the popup is blocked.
  document.querySelectorAll('a.article__share-btn, a.article__rail-btn').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var w = 600, h = 540;
      var dualLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;
      var dualTop = window.screenTop !== undefined ? window.screenTop : screen.top;
      var vw = window.innerWidth || document.documentElement.clientWidth || screen.width;
      var vh = window.innerHeight || document.documentElement.clientHeight || screen.height;
      var left = (vw - w) / 2 + dualLeft;
      var top = (vh - h) / 2 + dualTop;
      var popup = window.open(a.href, 'share-window', 'scrollbars=yes,width=' + w + ',height=' + h + ',top=' + top + ',left=' + left);
      if (popup) { e.preventDefault(); popup.focus(); }
    });
  });

  // Native share sheet (toolbar + rail), where supported
  if (navigator.share) {
    document.querySelectorAll('.article__share-native').forEach(function (nb) {
      nb.hidden = false;
      nb.addEventListener('click', function () {
        navigator.share({
          title: nb.getAttribute('data-title') || document.title,
          text: nb.getAttribute('data-title') || '',
          url: nb.getAttribute('data-url') || location.href
        }).catch(function () {});
      });
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
      if (!n.closest('pre') && !n.closest('.article__footer') && !n.closest('.article__actions')) parts.push(n.textContent);
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
                <span class="mark-text__role">
                    <span class="mark-text__issue">No. 2026 / V2</span>
                    <span class="mark-text__sep" aria-hidden="true">·</span>
                    <span>Engineer / Applied AI</span>
                </span>
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
for (const post of posts) {
  const { slug, data, content } = post;
  const bodyHtml = marked.parse(content);
  const related = pickRelated(post, posts, 3);
  writeFileSync(join(outDir, `${slug}.html`), page({ slug, ...data, bodyHtml, related }));
  if (!data.image && !localImage(slug)) writeFileSync(join(heroDir, `${slug}.svg`), genHero(slug, data.tag));
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

// Sitemap (written to public/ so Vite copies it to the site root).
const sitemapUrls = [
  `${SITE}/`,
  ...Array.from({ length: totalPages }, (_, i) =>
    `${SITE}/writing/${i === 0 ? '' : `page-${i + 1}.html`}`
  ),
  ...posts.map((p) => `${SITE}/writing/${p.slug}`),
];
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  sitemapUrls.map((loc) => `  <url><loc>${loc}</loc></url>`).join('\n') +
  `\n</urlset>\n`;
writeFileSync(join(root, '../public/sitemap.xml'), sitemap);

console.log(
  `build-writing: ${posts.length} posts, ${homePosts.length} featured on home, ${totalPages} index page(s), ${sitemapUrls.length} sitemap urls`
);
