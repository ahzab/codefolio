// Post-build (homepage only): inline the pre-generated above-the-fold critical
// CSS into dist/index.html and load the full stylesheet asynchronously, so the
// 49 KB CSS no longer render-blocks first paint. Lighthouse's Lantern model
// gates FCP on the render-blocking stylesheet even though it downloads fast;
// taking it off the critical path is what moves mobile FCP/LCP.
//
// Pure string manipulation — no headless browser at build time, so it runs
// fine on Vercel. The critical CSS itself (src/critical-home.css) is generated
// locally with `npx critical@7 dist/index.html --base dist --dimensions
// 390x844 --dimensions 1366x900 > src/critical-home.css` and committed.
// Regenerate it when above-the-fold styles change.

import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const critical = (await readFile(resolve(root, 'src/critical-home.css'), 'utf8')).trim();
const htmlPath = resolve(root, 'dist/index.html');
let html = await readFile(htmlPath, 'utf8');

// The Vite-injected render-blocking stylesheet (hash varies per build).
const linkRe = /<link rel="stylesheet"[^>]*href="(\/assets\/main\.[^"]+\.css)"[^>]*>/;
const m = html.match(linkRe);
if (!m) throw new Error('inline-critical-home: main stylesheet <link> not found in dist/index.html');
const href = m[1];

const replacement =
    `<style id="critical-css">${critical}</style>` +
    `<link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'">` +
    `<noscript><link rel="stylesheet" href="${href}"></noscript>`;

html = html.replace(m[0], replacement);
await writeFile(htmlPath, html, 'utf8');
console.log(`inline-critical-home: inlined ${(critical.length / 1024).toFixed(1)} KB critical, async-loaded ${href}`);
