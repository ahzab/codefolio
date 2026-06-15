// Build step: convert src/writing/content/*.md into styled article HTML pages.
// Markdown (with frontmatter) is the source of truth; the .html output is gitignored.
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const root = dirname(fileURLToPath(import.meta.url));
const contentDir = join(root, '../src/writing/content');
const outDir = join(root, '../src/writing');

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

function page({ slug, title = slug, description = '', tag = '', date = '', bodyHtml }) {
  const t = escapeHtml(title);
  const url = `${SITE}/writing/${slug}.html`;
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
    <meta property="og:image" content="${SITE}/og-preview.png">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${url}">
    <meta property="twitter:title" content="${t}">
    <meta property="twitter:description" content="${escapeHtml(description)}">
    <meta property="twitter:image" content="${SITE}/og-preview.png">

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

const files = readdirSync(contentDir).filter((f) => f.endsWith('.md'));
for (const file of files) {
  const slug = basename(file, '.md');
  const { data, content } = matter(readFileSync(join(contentDir, file), 'utf8'));
  const bodyHtml = marked.parse(content);
  writeFileSync(join(outDir, `${slug}.html`), page({ slug, ...data, bodyHtml }));
  console.log(`  writing/${slug}.html`);
}
console.log(`build-writing: generated ${files.length} article page(s) from markdown`);
