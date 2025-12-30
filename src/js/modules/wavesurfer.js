import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import { WAVESURFER_CONFIG } from "../config/wavesurfer-config.js";
import { SCROLLBAR_STYLES } from "../config/scrollbar-styles.js";

let wavesurfer = null;
export const regions = RegionsPlugin.create();

export function initializeWaveSurfer(container, audioUrl, webAudioPlayer) {
  if (!container) {
    console.error("waveScreen element not found");
    return null;
  }

  try {
    wavesurfer = WaveSurfer.create({
      container,
      ...WAVESURFER_CONFIG,
      url: audioUrl,
      plugins: [regions],
      media: webAudioPlayer,
    });
    console.log("WaveSurfer initialized successfully");
    const style = document.createElement('style')
    style.textContent = SCROLLBAR_STYLES;
    
    wavesurfer.getWrapper().appendChild(style)
    
    
    return wavesurfer;
  } catch (error) {
    console.error("Error initializing WaveSurfer:", error);
    return null;
  }

}


export function getWaveSurfer() {
  return wavesurfer;
}

