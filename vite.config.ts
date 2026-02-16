import { defineConfig } from 'vite';

export default defineConfig({
    root: 'src',
    base: './',
    css: {
        preprocessorOptions: {
            scss: { api: 'modern-compiler' }
        }
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                entryFileNames: `assets/[name].[hash].js`,
                chunkFileNames: `assets/[name].[hash].js`,
                assetFileNames: `assets/[name].[hash].[ext]`
            }
        }
    }
});