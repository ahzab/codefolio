// Build step: convert src/writing/content/*.md into styled article HTML pages.
// Markdown (with frontmatter) is the source of truth; the .html output is gitignored.
import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import * as fontkit from 'fontkit';
import sharp from 'sharp';

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
const ogDir = join(root, '../public/writing/og');
const indexPath = join(root, '../src/index.html');
const FEATURED_ON_HOME = 3;
const PAGE_SIZE = 6;

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

// Self-hosted fonts (same-origin, no third-party round-trips). Preload the body
// face; inline @font-face with font-display: optional (no swap → no CLS).
const FONTS = `<link rel="preload" as="font" type="font/woff2" href="/fonts/doto-900.woff2" crossorigin>
    <link rel="preload" as="font" type="font/woff2" href="/fonts/geist.woff2" crossorigin>
    <style>
    @font-face{font-family:'Doto';font-style:normal;font-weight:900;font-display:optional;src:url(/fonts/doto-900.woff2) format('woff2')}
    @font-face{font-family:'Geist';font-style:normal;font-weight:400 600;font-display:optional;src:url(/fonts/geist.woff2) format('woff2')}
    @font-face{font-family:'Geist Mono';font-style:normal;font-weight:400 500;font-display:optional;src:url(/fonts/geist-mono.woff2) format('woff2')}
    </style>`;
const SITE = 'https://www.codefolio.dev';
// Set your GA4 Measurement ID here. Analytics stays OFF while this is the placeholder.
const GA_ID = 'G-9B47PMLJZH';

function gaTag() {
  if (!GA_ID || GA_ID.includes('XXXX')) {
    return '<!-- Google Analytics disabled: set GA_ID in scripts/build-writing.mjs -->';
  }
  return `<script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){ dataLayer.push(arguments); }
        gtag('js', new Date());
        // ?internal=1 marks this browser as Abdel's own (GA internal-traffic filter); ?internal=0 clears it.
        (function () {
            var internal = false;
            try {
                var flag = new URLSearchParams(location.search).get('internal');
                if (flag === '1') localStorage.setItem('ga_internal', '1');
                if (flag === '0') localStorage.removeItem('ga_internal');
                internal = localStorage.getItem('ga_internal') === '1';
            } catch (e) { /* storage blocked */ }
            gtag('config', '${GA_ID}', internal ? { traffic_type: 'internal' } : {});
        })();
        // Defer the GA library (~66 KiB) off the critical path. Events queue in dataLayer until it loads.
        (function () {
            function loadGA() {
                var s = document.createElement('script');
                s.async = true;
                s.src = 'https://www.googletagmanager.com/gtag/js?id=${GA_ID}';
                document.head.appendChild(s);
            }
            if ('requestIdleCallback' in window) { requestIdleCallback(loadGA, { timeout: 1500 }); }
            else { window.addEventListener('load', function () { setTimeout(loadGA, 300); }); }
        })();
        // Custom events: contact, email copy, social, project and share clicks, article reads.
        (function () {
            function track(name, params) { gtag('event', name, params || {}); }
            function text(el) { return (el && el.textContent || '').replace('↗', '').replace('→', '').trim(); }
            function slug() { return location.pathname.split('/').pop().replace('.html', '') || 'home'; }
            var SOCIAL = { 'github.com': 'github', 'www.linkedin.com': 'linkedin', 'linkedin.com': 'linkedin', 'x.com': 'x', 'twitter.com': 'x', 'www.instagram.com': 'instagram' };

            document.addEventListener('click', function (e) {
                var el = e.target.closest && e.target.closest('a, button');
                if (!el) return;
                if (el.id === 'copy-btn') return track('email_copy', { location: 'contact' });
                if (el.id === 'contact-btn' || el.id === 'contact-mail') return track('contact_click', { method: 'email', location: el.id });
                if (el.matches('.article__share-btn, .article__rail-btn')) {
                    var network = el.hasAttribute('data-copy') ? 'copy_link'
                        : el.classList.contains('article__share-native') ? 'native'
                        : (el.getAttribute('aria-label') || '').replace('Share on ', '').toLowerCase();
                    return track('share_click', { network: network, article: slug() });
                }
                if (el.classList.contains('module__link')) {
                    var mod = el.closest('.module');
                    return track('project_click', { project: text(mod && mod.querySelector('.module__title')), link_text: text(el), link_url: el.href });
                }
                if (el.tagName === 'A' && el.hostname && SOCIAL[el.hostname]) {
                    var path = el.pathname.replace(/\\/$/, '');
                    var profile = el.hostname.indexOf('linkedin') > -1 ? path.indexOf('/in/') === 0 : path.split('/').length === 2;
                    if (profile) track('social_click', { network: SOCIAL[el.hostname], location: el.closest('footer, .article__footer') ? 'footer' : 'page' });
                }
            }, true);

            // article_read: 75% of the article scrolled past, with at least 15 s on the page. Once per view.
            // This tag sits in <head>, so wait for the article element to exist.
            var start = Date.now();
            function watchRead() {
                var body = document.querySelector('article.article');
                if (!body) return;
                var done = false;
                function check() {
                    if (done) return;
                    var rect = body.getBoundingClientRect();
                    var seen = (window.innerHeight - rect.top) / rect.height;
                    if (seen >= 0.75 && Date.now() - start >= 15000) {
                        done = true;
                        track('article_read', { article: slug(), seconds: Math.round((Date.now() - start) / 1000) });
                        window.removeEventListener('scroll', check);
                    }
                }
                window.addEventListener('scroll', check, { passive: true });
                setTimeout(check, Math.max(0, 15000 - (Date.now() - start)));
            }
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchRead);
            else watchRead();
        })();
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

// Post image card ("Trace", canvas page G): one 1200x627 card per post in the
// site's own tokens, used as the index-card and post hero (SVG) and, rastered,
// as og:image. Text is drawn as glyph paths from the static TTFs in
// scripts/fonts/, so the card renders the same in an <img> (which can't load
// web fonts), in sharp, and on build machines without Geist installed.
// Everything sits inside x 64..1136, y 80..547, so neither the 16:9 index crop
// nor the 12:5 post crop (object-fit: cover) cuts the tag or the title.
const CARD_W = 1200;
const CARD_H = 627;
const SAFE_X = 64;
const SAFE_W = CARD_W - SAFE_X * 2;
const C = { bg: '#0b0b0b', ink: '#ededed', muted: '#8a8a8a', hairline: '#262626', dot: '#2e2e2e', signal: '#ff3b30' };

const CARD_FONTS = {
  sans: fontkit.openSync(join(root, 'fonts/geist-600.ttf')),
  mono: fontkit.openSync(join(root, 'fonts/geist-mono-400.ttf')),
  dot: fontkit.openSync(join(root, 'fonts/doto-900.ttf')),
};

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// The tag as a module code: "Applied AI" -> "AI".
const TAG_CODES = { 'applied ai': 'AI', 'next.js': 'NX', security: 'SEC', payments: 'PAY', building: 'BLD', incidents: 'INC', stack: 'STK', scale: 'SCL', frontend: 'FE', backend: 'BE' };
function tagCode(tag) {
  const t = String(tag).trim().toLowerCase();
  return TAG_CODES[t] || t.replace(/[^a-z]/g, '').slice(0, 3).toUpperCase() || 'NOTE';
}

// Glyph paths, each glyph defined once per SVG and placed with <use>.
function textRun(defs, font, text, { size, x, y, fill, tracking = 0, anchor = 'start' }) {
  const run = font.layout(String(text));
  const s = size / font.unitsPerEm;
  const track = tracking * size;
  const width = run.positions.reduce((w, p) => w + p.xAdvance * s + track, 0) - (run.glyphs.length ? track : 0);
  let pen = anchor === 'end' ? x - width : x;
  const uses = [];
  run.glyphs.forEach((g, i) => {
    const id = `${font === CARD_FONTS.sans ? 's' : font === CARD_FONTS.mono ? 'm' : 'd'}${g.id}`;
    if (!defs.has(id)) defs.set(id, g.path.toSVG());
    const p = run.positions[i];
    const gx = pen + p.xOffset * s;
    const gy = y - p.yOffset * s;
    if (defs.get(id)) uses.push(`<use href="#${id}" transform="translate(${gx.toFixed(1)} ${gy.toFixed(1)}) scale(${s.toFixed(5)} ${(-s).toFixed(5)})"/>`);
    pen += p.xAdvance * s + track;
  });
  return { svg: `<g fill="${fill}">${uses.join('')}</g>`, width };
}

function measure(font, text, size) {
  return (font.layout(String(text)).advanceWidth * size) / font.unitsPerEm;
}

function wrap(font, text, size, maxW) {
  const lines = [];
  let line = '';
  // A word wider than the line (a URL, a package name) is broken by characters.
  const words = [];
  for (const w of String(text).split(/\s+/).filter(Boolean)) {
    let rest = w;
    while (measure(font, rest, size) > maxW) {
      let n = rest.length - 1;
      while (n > 1 && measure(font, rest.slice(0, n), size) > maxW) n--;
      words.push(rest.slice(0, n));
      rest = rest.slice(n);
    }
    words.push(rest);
  }
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(font, next, size) > maxW) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function genHero({ slug, title = slug, tag = '', date = '', num = 0 }) {
  const defs = new Map();
  const parts = [];
  const code = `${tagCode(tag)}-${String(num).padStart(2, '0')}`;

  // Header: module code + tag, note number as a Doto readout.
  const head = textRun(defs, CARD_FONTS.mono, code, { size: 24, x: SAFE_X, y: 106, fill: C.ink, tracking: 0.14 });
  parts.push(head.svg);
  parts.push(textRun(defs, CARD_FONTS.mono, String(tag).toUpperCase(), { size: 24, x: SAFE_X + head.width + 20, y: 106, fill: C.muted, tracking: 0.14 }).svg);
  parts.push(textRun(defs, CARD_FONTS.dot, String(num), { size: 48, x: SAFE_X + SAFE_W, y: 112, fill: C.ink, anchor: 'end' }).svg);

  // Title from the bottom up: shrink until it fits in three lines.
  let size = 50;
  let lines = wrap(CARD_FONTS.sans, title, size, 980);
  while (lines.length > 3 && size > 34) lines = wrap(CARD_FONTS.sans, title, (size -= 2), 980);
  if (lines.length > 3) {
    lines = lines.slice(0, 3);
    let last = lines[2];
    while (last && measure(CARD_FONTS.sans, `${last}…`, size) > 980) last = last.slice(0, -1);
    lines[2] = `${last.trimEnd()}…`;
  }
  const lead = Math.round(size * 1.08);
  const dateY = 540;
  const lastY = dateY - 44;
  const firstY = lastY - lead * (lines.length - 1);
  lines.forEach((l, i) => parts.push(textRun(defs, CARD_FONTS.sans, l, { size, x: SAFE_X, y: firstY + i * lead, fill: C.ink, tracking: -0.02 }).svg));
  parts.push(textRun(defs, CARD_FONTS.mono, `${displayDate(date)} · CODEFOLIO.DEV`, { size: 20, x: SAFE_X, y: dateY, fill: C.muted, tracking: 0.14 }).svg);

  // Scope: dot grid between two hairlines, one trace with a signal blip seeded by the slug.
  const gridTop = 128;
  const gridBot = firstY - Math.round(size * 0.78) - 18;
  const mid = Math.round((gridTop + gridBot) / 2);
  const amp = Math.min(44, Math.floor((gridBot - gridTop) / 2) - 8);
  const h = hashStr(slug);
  const bx = SAFE_X + 300 + (h % 600);
  const blip = `M${bx} ${mid} l16 0 l12 ${-amp} l16 ${amp * 2} l14 ${-Math.round(amp * 1.4)} l14 ${Math.round(amp * 0.4)} l24 0`;
  const lines2 = `M${SAFE_X} ${mid} H${bx} M${bx + 96} ${mid} H${SAFE_X + SAFE_W}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_W} ${CARD_H}" width="${CARD_W}" height="${CARD_H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <pattern id="dots" x="${SAFE_X}" y="${gridTop}" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r="1.5" fill="${C.dot}"/></pattern>
    ${[...defs].filter(([, d]) => d).map(([id, d]) => `<path id="${id}" d="${d}"/>`).join('\n    ')}
  </defs>
  <rect width="${CARD_W}" height="${CARD_H}" fill="${C.bg}"/>
  <rect x="${SAFE_X}" y="${gridTop}" width="${SAFE_W}" height="${gridBot - gridTop}" fill="url(#dots)"/>
  <path d="M${SAFE_X} ${gridTop}.5 H${SAFE_X + SAFE_W} M${SAFE_X} ${gridBot}.5 H${SAFE_X + SAFE_W}" stroke="${C.hairline}" stroke-width="1"/>
  <path d="${lines2}" fill="none" stroke="${C.ink}" stroke-width="2"/>
  <path d="${blip}" fill="none" stroke="${C.signal}" stroke-width="3" stroke-linejoin="round"/>
  ${parts.join('\n  ')}
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

// "Read next": up to n posts, same-tag first (most relevant), then fill by order.
// Homepage "field notes" row (the Instrument home lists posts, it does not card them).
function homeRow({ slug, title = slug, tag = '', date = '' }) {
  return `                <a class="note-row" href="/writing/${slug}.html">
                    <span class="lbl">${escapeHtml(displayDate(date))}</span>
                    <span class="lbl">${escapeHtml(tag)}</span>
                    <span class="note-row__title">${escapeHtml(title)}</span>
                    <span class="note-row__arrow" aria-hidden="true">→</span>
                </a>`;
}

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
  const hero = image || `/writing/hero/${slug}.svg`;
  // og:image must be an absolute raster URL — social crawlers (X, Facebook) don't
  // render SVG, so a post without its own image gets the PNG of its card.
  const ogSrc = image || `/writing/og/${slug}.png`;
  const ogImage = ogSrc.startsWith('http') ? ogSrc : `${SITE}${ogSrc.startsWith('/') ? '' : '/'}${ogSrc}`;
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
    <link rel="alternate" type="application/rss+xml" title="Abdel Ahzab — Writing" href="/rss.xml">

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

    ${FONTS}
    <link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
    <meta name="theme-color" content="#0b0b0b">

    ${gaTag()}
</head>
<body>

<header class="site-header">
    <div class="shell site-header__inner">
        <a href="/" class="brand" aria-label="Abdel Ahzab, home"><svg class="brand__mark" viewBox="12 12 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="44" r="6"/><path d="M27 50h8l12-36h-8z"/></svg><span>A.AHZAB</span></a>
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

  // Floating share rail: stays vertically centered while reading, but stops just
  // above the "Read next" section (or the footer) so it never overlaps it. Scroll
  // back up and it resumes floating in the centre of the viewport.
  var rail = document.querySelector('.article__rail');
  var railStop = document.querySelector('.article__next') || document.querySelector('.article__footer');
  if (rail && railStop && window.getComputedStyle(rail).display !== 'none') {
    var GAP = 24;
    var railTick = false;
    var positionRail = function () {
      railTick = false;
      if (window.getComputedStyle(rail).display === 'none') {
        rail.style.top = '';
        rail.style.transform = '';
        return;
      }
      var railH = rail.offsetHeight;
      var center = window.innerHeight / 2;
      var stopTop = railStop.getBoundingClientRect().top; // viewport coords (rail is fixed)
      var maxTop = stopTop - GAP - railH;
      if (center - railH / 2 > maxTop) {
        rail.style.top = Math.max(0, maxTop) + 'px';
        rail.style.transform = 'none';
      } else {
        rail.style.top = '50%';
        rail.style.transform = 'translateY(-50%)';
      }
    };
    var onRailScroll = function () {
      if (!railTick) { railTick = true; window.requestAnimationFrame(positionRail); }
    };
    window.addEventListener('scroll', onRailScroll, { passive: true });
    window.addEventListener('resize', onRailScroll, { passive: true });
    positionRail();
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
    <link rel="alternate" type="application/rss+xml" title="Abdel Ahzab — Writing" href="/rss.xml">

    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonical}">
    <meta property="og:title" content="Writing · Abdel Ahzab">
    <meta property="og:description" content="Notes on shipping SaaS solo: applied AI, Next.js, security, and building in public.">
    <meta property="og:image" content="${SITE}/og-preview.png">
    <meta property="twitter:card" content="summary_large_image">

    ${FONTS}
    <link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
    <meta name="theme-color" content="#0b0b0b">

    ${gaTag()}
</head>
<body>

<header class="site-header">
    <div class="shell site-header__inner">
        <a href="/" class="brand" aria-label="Abdel Ahzab, home"><svg class="brand__mark" viewBox="12 12 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="44" r="6"/><path d="M27 50h8l12-36h-8z"/></svg><span>A.AHZAB</span></a>
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
mkdirSync(ogDir, { recursive: true });

// Note number for the card: position by date, oldest = 1. A new post takes the next
// number; a backdated one renumbers the posts after it (and their cards).
const isoDate = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d ?? ''));
const byDate = [...posts].sort((a, b) => isoDate(a.data.date).localeCompare(isoDate(b.data.date)) || a.slug.localeCompare(b.slug));
const noteNum = new Map(byDate.map((p, i) => [p.slug, i + 1]));

// Article pages + hero images
for (const post of posts) {
  const { slug, data, content } = post;
  const bodyHtml = marked.parse(content);
  const related = pickRelated(post, posts, 3);
  if (!data.image) {
    const svg = genHero({ slug, ...data, date: isoDate(data.date), num: noteNum.get(slug) });
    writeFileSync(join(heroDir, `${slug}.svg`), svg);
    await sharp(Buffer.from(svg)).png().toFile(join(ogDir, `${slug}.png`));
  }
  writeFileSync(join(outDir, `${slug}.html`), page({ slug, ...data, bodyHtml, related }));
  console.log(`  writing/${slug}.html`);
}

// Homepage: featured posts only (fall back to the first few by order)
const featured = posts.filter((p) => p.data.featured);
const homePosts = (featured.length ? featured : posts).slice(0, FEATURED_ON_HOME);
const homeCards = homePosts.map((p) => homeRow({ slug: p.slug, ...p.data })).join('\n');
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

// llms.txt: a plain map of the site for AI assistants, from the home page's
// own description and the posts, so it never says more than the site does.
const homeDesc = (/<meta name="description"\s+content="([^"]*)"/.exec(readFileSync(indexPath, 'utf8')) || [])[1] || '';
const llms =
  `# Abdel Ahzab\n\n` +
  (homeDesc ? `> ${homeDesc.replace(/\s+/g, ' ').trim()}\n\n` : '') +
  `## Pages\n\n` +
  `- [Home](${SITE}/): who I am, what I build, selected work\n` +
  `- [Writing](${SITE}/writing/): every post\n\n` +
  `## Writing\n\n` +
  posts.map((p) => `- [${p.data.title || p.slug}](${SITE}/writing/${p.slug}): ${(p.data.description || '').replace(/\s+/g, ' ').trim()}`).join('\n') +
  `\n\n## Feeds\n\n- [RSS](${SITE}/rss.xml)\n- [Sitemap](${SITE}/sitemap.xml)\n`;
writeFileSync(join(root, '../public/llms.txt'), llms);

// RSS 2.0 feed (written to public/ so Vite copies it to the site root).
function rfc822(d = '') {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d));
  return m ? new Date(`${d}T00:00:00Z`).toUTCString() : '';
}
const FEED_TITLE = 'Abdel Ahzab — Writing';
const FEED_DESC =
  'Notes on shipping SaaS solo: applied AI, Next.js, security, and building in public.';
const rssItems = posts
  .map((p) => {
    const u = `${SITE}/writing/${p.slug}`;
    const pub = rfc822(p.data.date);
    return (
      `    <item>\n` +
      `      <title>${escapeHtml(p.data.title || p.slug)}</title>\n` +
      `      <link>${u}</link>\n` +
      `      <guid isPermaLink="true">${u}</guid>\n` +
      (pub ? `      <pubDate>${pub}</pubDate>\n` : '') +
      (p.data.tag ? `      <category>${escapeHtml(p.data.tag)}</category>\n` : '') +
      `      <description>${escapeHtml(p.data.description || '')}</description>\n` +
      `    </item>`
    );
  })
  .join('\n');
const rss =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n` +
  `  <channel>\n` +
  `    <title>${FEED_TITLE}</title>\n` +
  `    <link>${SITE}/writing</link>\n` +
  `    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>\n` +
  `    <description>${FEED_DESC}</description>\n` +
  `    <language>en</language>\n` +
  rssItems +
  `\n  </channel>\n</rss>\n`;
writeFileSync(join(root, '../public/rss.xml'), rss);

console.log(
  `build-writing: ${posts.length} posts, ${homePosts.length} featured on home, ${totalPages} index page(s), ${sitemapUrls.length} sitemap urls, rss feed`
);
