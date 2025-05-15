import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import glsl from 'vite-plugin-glsl';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    glsl(),
    // Custom plugin to handle paths in final HTML
    {
      name: 'fix-asset-paths',
      enforce: 'post',
      generateBundle(_, bundle) {
        // Find the index.html file in the bundle
        const indexHtml = Object.values(bundle).find(
          (chunk) => chunk.fileName === 'index.html'
        );
        
        if (indexHtml) {
          // Replace TSX source reference with the correct bundle path
          indexHtml.source = indexHtml.source.replace(
            /<script type="module" src="\/src\/main\.tsx"><\/script>/,
            (match) => {
              // Find the main JS entry file
              const mainJsFile = Object.keys(bundle).find(
                (filename) => filename.startsWith('assets/index-') && filename.endsWith('.js')
              );
              
              if (mainJsFile) {
                return `<script type="module" src="/${mainJsFile}"></script>`;
              }
              return match;
            }
          );
          
          // Also replace CSS references
          indexHtml.source = indexHtml.source.replace(
            /<link rel="stylesheet" href="\.\/assets\/index\.css" \/>/,
            (match) => {
              // Find the CSS file in the bundle
              const cssFile = Object.keys(bundle).find(
                (filename) => filename.startsWith('assets/index-') && filename.endsWith('.css')
              );
              
              if (cssFile) {
                return `<link rel="stylesheet" href="/${cssFile}" />`;
              }
              return match;
            }
          );
        }
      }
    }
  ],
  build: {
    outDir: '../dist/public',
    emptyOutDir: false,
    sourcemap: true,
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/',
});