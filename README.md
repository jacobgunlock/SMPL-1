# SMPL-1: Sampler Browser Extension

An audio sampler with waveform visualization, built as a browser extension using WaveSurfer.js. Supports Chrome and Firefox.

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
   npm run build:chrome
   ```

2. **Open Chrome Extensions page**:
   - Go to `chrome://extensions/` in Chrome
   - Toggle "Developer mode" in the top-right

3. **Load unpacked extension**:
   - Click "Load unpacked"
   - Select the **`dist/chrome`** folder from this project
   - Click "Select Folder"

4. **Use the extension**:
   - Click the extension icon in Chrome toolbar
   - Click record to capture audio from any browser tab
   - Use playback controls to play/stop your recordings

### Load as Firefox Extension

No `about:config` changes required.

1. **Build the Firefox extension**:
   ```bash
   npm run build:firefox
   ```
   This produces **`dist/smpl-1-firefox.xpi`**.

2. **Open the Add-on Debugger**:
   - Go to `about:debugging#/runtime/this-firefox` in Firefox

3. **Load the extension**:
   - Click **"Load Temporary Add-on…"**
   - Select the **`dist/smpl-1-firefox.xpi`** file

4. **Use the extension**:
   - Click the extension icon in the Firefox toolbar to toggle the sidebar
   - Click record to capture audio from any browser tab
   - Use playback controls to play/stop your recordings

> **Note:** Temporary add-ons are removed when Firefox is closed. Reload via `about:debugging` after restarting.

## Development

- **Run dev server**: `npm run dev`
- **Build for Chrome**: `npm run build:chrome`
- **Build for Firefox**: `npm run build:firefox`
- **After changes**: Rebuild and reload extension in the browser

## Project Structure

```
├── src/
│   └── js/
│       ├── main.js              # Entry point
│       ├── config/              # Configuration
│       └── modules/             # Feature modules
├── dist/
│   ├── chrome/                  # Chrome build (load unpacked in chrome://extensions)
│   ├── firefox/                 # Firefox build files
│   └── smpl-1-firefox.xpi      # Firefox extension package (load in about:debugging)
├── manifest.json                # Chrome extension manifest (MV3)
├── manifest.firefox.json        # Firefox extension manifest (MV2)
├── background.js                # Chrome background service worker
├── background.firefox.js        # Firefox background script
├── index.html                   # Main HTML
└── vite.config.js              # Vite build config
```


## Requirements

- Chrome/Edge (Side Panel API) or Firefox
- Node.js and npm installed

## Notes

- Chrome uses Manifest V3 with the Side Panel API; Firefox uses Manifest V2 with the Sidebar Action API
- Audio recording uses the browser's built-in screen capture API
- WaveSurfer.js is used for waveform visualization and playback

