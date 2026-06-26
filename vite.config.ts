import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readdirSync } from 'fs';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));

// Discover generated article pages (build-writing.mjs runs before vite build).
const writingDir = resolve(srcDir, 'writing');
const articleInputs = existsSync(writingDir)
    ? Object.fromEntries(
          readdirSync(writingDir)
              .filter((f) => f.endsWith('.html'))
              .map((f) => [f.replace(/\.html$/, ''), resolve(writingDir, f)])
      )
    : {};

export default defineConfig({
    root: 'src',
    publicDir: '../public',
    // Root-relative asset URLs. The site is always served from the root of
    // www.codefolio.dev, and absolute paths are required so same-origin assets
    // (e.g. /fonts/*.woff2) resolve identically from / and from /writing/* pages
    // — relative './' paths resolve against the page's own directory and 404.
    base: '/',
    css: {
        preprocessorOptions: {
            scss: { api: 'modern-compiler' }
        }
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(srcDir, 'index.html'),
                ...articleInputs,
            },
            output: {
                entryFileNames: `assets/[name].[hash].js`,
                chunkFileNames: `assets/[name].[hash].js`,
                assetFileNames: `assets/[name].[hash].[ext]`
            }
        }
    }
});