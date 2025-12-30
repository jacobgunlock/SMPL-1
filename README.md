# Sampler Chrome Extension

An audio sampler with waveform visualization, built as a Chrome extension using WaveSurfer.js.

## Features

- 🎵 Record audio from browser tabs (YouTube, Spotify, etc.)
- 🎚️ Visual waveform display
- 🔊 Playback controls with cassette-style UI
- 🔄 Loop region support
- 🎚️ Volume, bass, treble, and tempo controls
- 🔍 Zoom functionality

## Quick Start

### Load as Chrome Extension

1. **Build the extension**:
   ```bash
   npm run build
   ```

2. **Open Chrome Extensions page**:
   - Go to `chrome://extensions/` in Chrome
   - Toggle "Developer mode" in the top-right

3. **Load unpacked extension**:
   - Click "Load unpacked"
   - Select the **`dist`** folder from this project
   - Click "Select Folder"

4. **Use the extension**:
   - Click the extension icon in Chrome toolbar
   - Click record to capture audio from any browser tab
   - Use playback controls to play/stop your recordings

## Development

- **Run dev server**: `npm run dev`
- **Build for production**: `npm run build`
- **After changes**: Rebuild and reload extension in Chrome

## Project Structure

```
├── src/
│   └── js/
│       ├── main.js              # Entry point
│       ├── config/              # Configuration
│       └── modules/             # Feature modules
├── dist/                        # Built extension (load this in Chrome)
├── manifest.json                # Extension manifest
├── background.js                # Background service worker
├── index.html                   # Main HTML
└── vite.config.js              # Vite build config
```

For detailed module documentation, see [`src/js/README.md`](./src/js/README.md).

## Requirements

- Chrome/Edge browser with Side Panel API support
- Node.js and npm installed

## Notes

- The extension uses Chrome's Side Panel API to display the UI
- Audio recording uses the browser's built-in screen capture API
- WaveSurfer.js is used for waveform visualization and playback

