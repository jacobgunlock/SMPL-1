import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './', // Use relative paths for Chrome extension
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  publicDir: 'public',
  plugins: [
    {
      name: 'copy-manifest-and-background',
      closeBundle() {
        const fs = require('fs');
        const path = require('path');
        
        // Copy manifest.json
        fs.copyFileSync(
          path.resolve(__dirname, 'manifest.json'),
          path.resolve(__dirname, 'dist/manifest.json')
        );
        
        // Copy background.js
        fs.copyFileSync(
          path.resolve(__dirname, 'background.js'),
          path.resolve(__dirname, 'dist/background.js')
        );
        
        console.log('Copied manifest.json and background.js to dist/');
      },
    },
  ],
});

