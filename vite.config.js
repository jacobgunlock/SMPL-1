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

          // For Firefox, copy the content script (plain JS, not bundled)
          // and package the whole dist folder as a .xpi file so it can be
          // loaded via about:debugging without changing any about:config flags.
          if (browser === 'firefox') {
            fs.copyFileSync(
              path.resolve(__dirname, 'src/js/content-capture.js'),
              path.resolve(__dirname, `${outDir}/content-capture.js`)
            );

            const xpiDest = path.resolve(__dirname, `${outDir}/smpl-1-firefox.xpi`);
            const absOutDir = path.resolve(__dirname, outDir);
            const { execSync } = require('child_process');
            const os = require('os');

            // Remove any previous .xpi before recreating it.
            if (fs.existsSync(xpiDest)) fs.unlinkSync(xpiDest);

            // Build the archive in a temp path outside the source directory so
            // ZipFile.CreateFromDirectory doesn't try to include the destination
            // file in its own archive.
            const xpiTemp = path.join(os.tmpdir(), 'smpl-1-firefox.xpi');
            if (fs.existsSync(xpiTemp)) fs.unlinkSync(xpiTemp);

            if (process.platform === 'win32') {
              // Write a temporary PS1 script that builds the ZIP using
              // ZipArchive with forward-slash entry names. The ZIP spec
              // requires '/' separators; Firefox rejects archives that use
              // Windows-style backslashes and reports them as "corrupt".
              const ps1 = [
                'Add-Type -AssemblyName System.IO.Compression',
                `$src = '${absOutDir}'`,
                `$dst = '${xpiTemp}'`,
                '$fs = [System.IO.File]::Create($dst)',
                '$archive = New-Object System.IO.Compression.ZipArchive($fs, [System.IO.Compression.ZipArchiveMode]::Create)',
                'Get-ChildItem -Path $src -Recurse -File | ForEach-Object {',
                '    $entryName = $_.FullName.Substring($src.Length + 1).Replace("\\", "/")',
                '    $entry = $archive.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Optimal)',
                '    $s = [System.IO.File]::OpenRead($_.FullName)',
                '    $e = $entry.Open()',
                '    $s.CopyTo($e)',
                '    $s.Close(); $e.Close()',
                '}',
                '$archive.Dispose(); $fs.Close()',
              ].join('\r\n');
              const ps1Path = path.join(os.tmpdir(), 'smpl1-xpi.ps1');
              fs.writeFileSync(ps1Path, ps1, 'utf8');
              try {
                execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${ps1Path}"`);
              } finally {
                fs.unlinkSync(ps1Path);
              }
            } else {
              execSync(`cd '${absOutDir}' && zip -r '${xpiTemp}' .`);
            }

            fs.renameSync(xpiTemp, xpiDest);
            console.log(`Created Firefox extension package: ${outDir}/smpl-1-firefox.xpi`);
          }
        },
      },
    ],
  };
});

