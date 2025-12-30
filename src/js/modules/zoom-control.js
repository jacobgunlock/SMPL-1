import { getWaveSurfer } from "./wavesurfer.js";
import { ZOOM_CONFIG } from "../config/wavesurfer-config.js";

let isInitialized = false;

/**
 * Initialize zoom slider control with scroll wheel support
 */
export function initializeZoomControl() {
  // Prevent re-initialization
  if (isInitialized) return;
  isInitialized = true;

  const slider = document.getElementById("zoom-slider");
  const wavesurfer = getWaveSurfer();
  const waveformContainer = wavesurfer.getWrapper();
  
  // Zoom step for scroll wheel (adjust for sensitivity)
  const zoomStep = 2;
  
  /**
   * Apply zoom level and sync slider
   * @param {number} zoomLevel - The zoom level (minPxPerSec value for slider)
   */
  function applyZoom(zoomLevel) {
    // Clamp zoom level to min/max bounds
    const clampedZoom = Math.max(ZOOM_CONFIG.min, Math.min(ZOOM_CONFIG.max, zoomLevel));
    
    // Update WaveSurfer zoom
    wavesurfer.zoom(clampedZoom * 2);
    
    // Sync slider value
    slider.value = clampedZoom;
  }
  
  // Slider input handler
  slider.addEventListener("input", (e) => {
    const minPxPerSec = Number(e.target.value);
    applyZoom(minPxPerSec);
  });
  
  // Scroll wheel zoom on waveform
  waveformContainer.addEventListener("wheel", (e) => {
    // Check if this is primarily a horizontal scroll (touchpad left/right)
    // Allow horizontal scrolling to pass through for waveform panning
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      return; // Let horizontal scroll happen naturally
    }
    
    // Only handle vertical scroll for zoom
    if (e.deltaY === 0) return;
    
    // Prevent page scroll when zooming vertically
    e.preventDefault();
    
    // Get current zoom level from slider
    let currentZoom = Number(slider.value);
    
    // Determine zoom direction (scroll up = zoom in, scroll down = zoom out)
    if (e.deltaY < 0) {
      // Scroll up - zoom out
      currentZoom -= zoomStep;
    } else {
      // Scroll down - zoom in
      currentZoom += zoomStep;
    }
    
    applyZoom(currentZoom);
  }, { passive: false });
}
