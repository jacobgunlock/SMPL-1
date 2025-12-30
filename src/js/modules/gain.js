import { getWaveSurfer } from "./wavesurfer.js";

let isInitialized = false;

export function initializeGainControl() {
  // Prevent re-initialization
  if (isInitialized) return;
  isInitialized = true;

  const wavesurfer = getWaveSurfer();
  const volDial = document.getElementById("vol");

  wavesurfer.on("ready", () => {
    const initialVolume = volDial.value / 100;
    wavesurfer.setVolume(initialVolume);
  });

  volDial.addEventListener("input", (e) => {
    const volume = e.target.value / 100;
    wavesurfer.setVolume(volume);
  });
}
