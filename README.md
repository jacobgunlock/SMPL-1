# SMPL-1: Sampler Chrome Extension

An audio sampler with waveform visualization, built as a Chrome extension using WaveSurfer.js.

<img width="1280" height="800" alt="Frame 1" src="https://github.com/user-attachments/assets/b758fa7a-81d7-47d0-80fb-81c9508dae15" />
<img width="1280" height="800" alt="Frame 2" src="https://github.com/user-attachments/assets/975fd2c8-1ba7-4684-b4ab-a6bf74385bd2" />
<img width="1280" height="800" alt="Frame 3" src="https://github.com/user-attachments/assets/8a02a3bd-3ff2-47da-8ac5-3900ae3281ed" />

## Features

- 🎵 Record audio from browser tabs (YouTube, Spotify, etc.)
- 🎚️ Visual waveform display
- 🔊 Playback controls with OP-1 style UI
- 🔄 Loop region support
- 🎚️ Volume, Highpass, Lowpass, and Playback Rate controls
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


## Requirements

- Chrome/Edge browser with Side Panel API support
- Node.js and npm installed

## Notes

- The extension uses Chrome's Side Panel API to display the UI
- Audio recording uses the browser's built-in screen capture API
- WaveSurfer.js is used for waveform visualization and playback

