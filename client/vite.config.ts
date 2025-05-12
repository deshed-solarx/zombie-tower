import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import glsl from "vite-plugin-glsl";

export default defineConfig({
  plugins: [
    react(),
    glsl(), // Add GLSL shader support
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../dist/public"),
    emptyOutDir: true,
    // Make the build optimized for static hosting
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          game: [
            './src/game/Game.ts',
            './src/game/Bullet.ts',
            './src/game/Particle.ts',
            './src/game/SoundManager.ts',
            './src/game/Tower.ts',
            './src/game/UpgradeSystem.ts',
            './src/game/Zombie.ts'
          ]
        }
      }
    }
  },
  // Add support for large models and audio files
  assetsInclude: ["**/*.gltf", "**/*.glb", "**/*.mp3", "**/*.ogg", "**/*.wav"],
  // Define environment variables for the Vercel build
  define: {
    'import.meta.env.VITE_STATIC_DEPLOYMENT': JSON.stringify('true'),
    'import.meta.env.VITE_IS_VERCEL': JSON.stringify('true'),
  }
});