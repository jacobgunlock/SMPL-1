import { getWaveSurfer } from "./wavesurfer.js";
import { regions } from "./wavesurfer.js";
import { LOOP_REGION_COLOR } from "../config/constants.js";

let loopRegion = null;
let isLooping = false;
let isInitialized = false;

/**
 * Create a loop region at the current playback position
 */
export function createLoopRegion() {
  const wavesurfer = getWaveSurfer();
  if (!wavesurfer) return;

  // Remove existing region if it exists
  if (loopRegion) {
    loopRegion.remove();
  }

  // Create a loop region covering most of the audio (you can adjust these values)
  const startTime = wavesurfer.getCurrentTime();
  const endTime = wavesurfer.getCurrentTime() + 2; // 2 seconds loop by default

  loopRegion = regions.addRegion({
    start: startTime,
    end: endTime,
    color: LOOP_REGION_COLOR,
    drag: true, // Allow dragging the region
    resize: true, // Allow resizing the region
  });

  // Set up loop behavior
  loopRegion.on("update-end", () => {
    if (isLooping && wavesurfer.isPlaying()) {
      // If looping is enabled and audio is playing, ensure it loops
      wavesurfer.play();
    }
  });
}

/**
 * Initialize loop button and event handlers
 */
export function initializeLoopControls() {
  // Prevent re-initialization
  if (isInitialized) return;
  isInitialized = true;

  const loopBtn = document.getElementById("loop");
  const wavesurfer = getWaveSurfer();

  if (!wavesurfer) {
    console.error("WaveSurfer not initialized");
    return;
  }

  // Loop button - toggles loop state and rotates icon backwards when active
  if (loopBtn) {
    loopBtn.addEventListener("click", () => {
      isLooping = !isLooping;
      loopBtn.classList.toggle("active");

      // Toggle loop region visibility
      if (isLooping) {
        // Create the region when loop is activated
        if (!loopRegion) {
          createLoopRegion();
        }
      } else {
        // Hide the region when loop is inactive
        if (loopRegion) {
          loopRegion.remove();
          loopRegion = null;
        }
        
        // Uncheck the loop/clip toggle (slider-2) when looping is disabled
        const slider2Checkbox = document.querySelector('#slider-2')?.previousElementSibling;
        if (slider2Checkbox && slider2Checkbox.type === 'checkbox') {
          slider2Checkbox.checked = false;
        }
      }
    });
  }

  // Handle time update to implement looping
  wavesurfer.on("timeupdate", (currentTime) => {
    if (isLooping && loopRegion) {
      const regionStart = loopRegion.start;
      const regionEnd = loopRegion.end;

      // If we've reached the end of the region, loop back to the start
      if (currentTime >= regionEnd) {
        wavesurfer.seekTo(regionStart / wavesurfer.getDuration());
      }
    }
  });
}

export { loopRegion };

