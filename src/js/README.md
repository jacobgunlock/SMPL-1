# Sampler Application - Modular Structure

This directory contains the refactored, modular JavaScript code for the sampler application.

## Directory Structure

```
src/js/
├── main.js                          # Entry point that initializes all modules
├── config/                          # Configuration files
│   ├── wavesurfer-config.js        # WaveSurfer configuration constants
│   └── constants.js                # Application-wide constants (colors, styles, etc.)
└── modules/                         # Feature modules
    ├── wavesurfer.js               # WaveSurfer initialization and management
    ├── playback-controls.js        # Play/stop button controls and wheel animations
    ├── loop-region.js              # Loop region creation and management
    ├── recording.js                # Recording functionality and UI
    ├── dial-controls.js            # Draggable dial controls (volume, bass, treble, tempo)
    └── zoom-control.js             # Zoom slider functionality
```

## Module Descriptions

### Wavesurfer Module (`modules/wavesurfer.js`)
- Initializes WaveSurfer instance
- Manages the regions plugin
- Exports WaveSurfer instance getter

### Playback Controls (`modules/playback-controls.js`)
- Handles play/stop button functionality
- Manages wheel animations
- Controls WaveSurfer playback

### Loop Region (`modules/loop-region.js`)
- Creates and manages loop regions
- Handles loop toggle functionality
- Implements time-based looping logic

### Recording (`modules/recording.js`)
- Manages recording state
- Handles recording UI feedback
- Toggles recording mode

### Dial Controls (`modules/dial-controls.js`)
- Implements draggable dials
- Manages popover display
- Handles value updates and rotations

### Zoom Control (`modules/zoom-control.js`)
- Controls WaveSurfer zoom functionality
- Maps slider input to zoom levels

## Configuration Files

### Wavesurfer Config (`config/wavesurfer-config.js`)
Contains WaveSurfer visual configuration:
- Colors, dimensions
- Bar styling
- Zoom settings
- Dial defaults

### Constants (`config/constants.js`)
Application-wide constants:
- Dial colors mapping
- Loop region styling
- Recording text styles

## Usage

The main entry point (`main.js`) initializes all modules when the DOM is loaded:

```javascript
document.addEventListener("DOMContentLoaded", () => {
  // Initialize WaveSurfer first
  const wavesurfer = initializeWaveSurfer(waveScreen, "./Sayin.wav");
  
  // Initialize all controls
  initializePlaybackControls();
  initializeLoopControls();
  initializeRecordingControls();
  initializeDialControls();
  initializeZoomControl();
});
```

## Migration Notes

The original `main.js` was backed up as `main.js.backup` in the root directory.

