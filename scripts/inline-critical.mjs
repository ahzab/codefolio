// Post-build: inline critical above-the-fold CSS into each built HTML page and
// defer the full stylesheet, so the 49 KB CSS bundle no longer render-blocks
// first paint. Runs after `vite build` (see package.json "build" script).
//
// Uses beasties (the maintained successor to critters): it reads each dist HTML
// file, inlines the CSS rules actually used above the fold into a <style> tag,
// and rewrites the <link rel="stylesheet"> to load asynchronously with a
// <noscript> fallback. No runtime cost, graceful degradation.

import Beasties from 'beasties';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');

// Collect every built HTML page: dist/index.html + dist/writing/*.html.
async function htmlFiles() {
    const out = [];
    const walk = async (dir) => {
        for (const entry of await readdir(dir, { withFileTypes: true })) {
            const full = resolve(dir, entry.name);
            if (entry.isDirectory()) await walk(full);
            else if (entry.name.endsWith('.html')) out.push(full);
        }
    };
    await walk(distDir);
    return out;
}

const beasties = new Beasties({
    path: distDir,        // root for resolving stylesheet hrefs
    publicPath: './',     // matches vite `base: './'`
    preload: 'swap',      // async-load the full stylesheet, swap rel onload
    pruneSource: false,   // keep the external CSS intact (shared across pages)
    inlineFonts: false,
    fonts: false,         // we manage Google Fonts loading ourselves in <head>
    logLevel: 'silent',
});

const files = await htmlFiles();
for (const file of files) {
    const html = await readFile(file, 'utf8');
    // beasties prunes the inline @font-face <style> (it treats the rules as
    // "unused" since no element selector matches them). Capture it first and
    // re-insert it afterwards so the self-hosted fonts keep working.
    const fontFace = html.match(/<style>\s*@font-face[\s\S]*?<\/style>/);
    let processed = await beasties.process(html);
    if (fontFace && !processed.includes('@font-face')) {
        processed = processed.replace('</head>', `${fontFace[0]}\n</head>`);
    }
    await writeFile(file, processed, 'utf8');
    console.log(`inline-critical: ${file.replace(distDir, 'dist')}`);
}
console.log(`inline-critical: done (${files.length} page(s))`);
