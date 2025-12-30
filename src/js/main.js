import { initializeWaveSurfer } from "./modules/wavesurfer.js";
import { initializePlaybackControls } from "./modules/playback.js";
import { initializeLoopControls } from "./modules/loop-region.js";
import { initializeRecordingControls } from "./modules/recording.js";
import { initializeDialControls } from "./modules/dial-controls.js";
import { initializeZoomControl } from "./modules/zoom-control.js";
import { initializeFilterControls } from "./modules/filter.js";
import { initializeTempoControl } from "./modules/tempo.js";
import { initializeGainControl } from "./modules/gain.js";
import { saveScreen } from "./modules/save-screen.js";
import { getAudioContext } from "./modules/audioContext.js";
import { getWebAudioPlayer } from "./modules/audioContext.js";
import { loadRecordedAudio } from "./modules/audioStorage.js";

const DEFAULT_AUDIO = "./arp.mp3";

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener("DOMContentLoaded", async () => {
  // Handle donate link click - Chrome extensions need this to open external links
  const donateLink = document.getElementById("donate-link");
  if (donateLink) {
    donateLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.open(donateLink.href, "_blank");
    });
  }

  // Initialize WaveSurfer first
  const waveScreen = document.querySelector(".waveScreen");
  const audioContext = getAudioContext();
  const webAudioPlayer = getWebAudioPlayer();
  
  // Check for saved recording, otherwise use default
  const savedAudioUrl = await loadRecordedAudio();
  const audioSource = savedAudioUrl || DEFAULT_AUDIO;
  
  const wavesurfer = initializeWaveSurfer(waveScreen, audioSource, webAudioPlayer);
  
  
  if (!wavesurfer) {
    console.error("Failed to initialize WaveSurfer");
    return;
  }
  // Initialize all controls
  wavesurfer.on("ready", () => {
    // Initialize all controls
    initializePlaybackControls();
    initializeLoopControls();
    initializeRecordingControls();
    initializeDialControls();
    initializeZoomControl();
    initializeFilterControls(webAudioPlayer.getGainNode());
    initializeTempoControl();
    initializeGainControl();
    saveScreen();
  });
});
