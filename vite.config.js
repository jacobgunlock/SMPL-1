import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const browser = mode === 'firefox' ? 'firefox' : 'chrome';
  const outDir = `dist/${browser}`;

  return {
    base: './',
    build: {
      outDir,
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

          const manifestSrc = browser === 'firefox'
            ? path.resolve(__dirname, 'manifest.firefox.json')
            : path.resolve(__dirname, 'manifest.json');
          fs.copyFileSync(manifestSrc, path.resolve(__dirname, `${outDir}/manifest.json`));

          const backgroundSrc = browser === 'firefox'
            ? path.resolve(__dirname, 'background.firefox.js')
            : path.resolve(__dirname, 'background.js');
          fs.copyFileSync(backgroundSrc, path.resolve(__dirname, `${outDir}/background.js`));

          console.log(`Copied manifest and background.js to ${outDir}/`);

          // For Firefox, copy the content script (plain JS, not bundled).
          if (browser === 'firefox') {
            fs.copyFileSync(
              path.resolve(__dirname, 'src/js/content-capture.js'),
              path.resolve(__dirname, `${outDir}/content-capture.js`)
            );
          }
        },
      },
    ],
  };
});

