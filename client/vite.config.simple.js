import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Simplified configuration for Vercel static deployment
export default defineConfig({
  plugins: [
    react(),
    // No GLSL plugin to avoid ESM/CommonJS conflicts
  ],
  resolve: {
    alias: {
      "@": path.resolve("./src"),
      "@shared": path.resolve("../shared"),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'import.meta.env.VITE_STATIC_DEPLOYMENT': JSON.stringify('true'),
  },
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand'],
          game: ['@react-three/fiber', '@react-three/drei', 'three']
        }
      }
    }
  },
  publicDir: path.resolve('./public'),
  assetsInclude: ["**/*.gltf", "**/*.glb", "**/*.mp3", "**/*.ogg", "**/*.wav"],
});