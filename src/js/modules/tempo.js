import { getWaveSurfer } from "./wavesurfer.js";

export function initializeTempoControl() {
  const wavesurfer = getWaveSurfer();
  const tempoDial = document.getElementById("tempo");
  tempoDial.oninput = (e) => {
    // Fixed WebAudioPlayer handles rate changes correctly during playback
    wavesurfer.setPlaybackRate(e.target.value, false);
  };
}

