import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import glsl from "vite-plugin-glsl";

// Configuration for Vercel static deployment
export default defineConfig({
  plugins: [
    react(),
    glsl(), // GLSL shader support
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "..", "shared"),
    },
  },
  define: {
    // Define production environment variables
    'process.env.NODE_ENV': JSON.stringify('production'),
    'import.meta.env.VITE_STATIC_DEPLOYMENT': JSON.stringify('true'),
  },
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
    sourcemap: true, // Generate sourcemaps for easier debugging
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code into separate chunks for better caching
          vendor: ['react', 'react-dom', 'zustand'],
          // Additional chunks for game-specific libraries
          game: ['@react-three/fiber', '@react-three/drei', 'three']
        }
      }
    }
  },
  // Copy the 404 fallback page
  publicDir: path.resolve(__dirname, 'public'),
  assetsInclude: ["**/*.gltf", "**/*.glb", "**/*.mp3", "**/*.ogg", "**/*.wav"],
});