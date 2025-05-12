#!/usr/bin/env node

// A simplified build script for Vercel deployment that avoids CommonJS/ESM conflicts
import { build } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure output directory exists
const distDir = resolve(__dirname, 'dist', 'public');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

async function buildClient() {
  try {
    console.log('Starting Vercel client build...');
    
    // Build using Vite
    await build({
      root: resolve(__dirname, 'client'),
      base: '/',
      build: {
        outDir: resolve(__dirname, 'dist', 'public'),
        emptyOutDir: true,
        minify: true,
        sourcemap: true,
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
        'import.meta.env.VITE_STATIC_DEPLOYMENT': JSON.stringify('true'),
      },
      logLevel: 'info',
    });

    // Copy 404.html for SPA routing
    const publicDir = resolve(__dirname, 'client', 'public');
    const notFoundPage = resolve(publicDir, '404.html');
    
    if (fs.existsSync(notFoundPage)) {
      fs.copyFileSync(notFoundPage, resolve(distDir, '404.html'));
      console.log('Copied 404.html page for client-side routing');
    }

    console.log('Client build completed successfully!');
  } catch (err) {
    console.error('Build error:', err);
    process.exit(1);
  }
}

buildClient();