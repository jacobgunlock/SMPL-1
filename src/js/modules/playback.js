import { getWaveSurfer } from "./wavesurfer.js";
import { getWebAudioPlayer } from "./audioContext.js";

let wasPaused = false;
let previousState = "active";
let isInitialized = false;

/**
 * Get the current rotation angle from a transform matrix
 */
function getCurrentRotation(element) {
  const style = window.getComputedStyle(element);
  const transform = style.transform;
  
  if (transform === 'none') return 0;
  
  // Parse the matrix values
  const values = transform.split('(')[1].split(')')[0].split(',');
  const a = parseFloat(values[0]);
  const b = parseFloat(values[1]);
  
  // Calculate angle in degrees
  const angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
  return angle;
}

/**
 * Smoothly stop a wheel by transitioning from current rotation to 0
 */
function smoothStopWheel(wheel) {
  // Get current rotation before removing animation
  const currentRotation = getCurrentRotation(wheel);
  
  // Remove animation classes
  wheel.classList.remove("active", "reverse");
  
  // Apply current rotation as inline style (this prevents snap)
  wheel.style.transform = `rotate(${currentRotation}deg)`;
  
  // Force reflow to ensure the inline style is applied
  wheel.offsetHeight;
  
  // Now transition back to 0
  requestAnimationFrame(() => {
    wheel.style.transform = 'rotate(0deg)';
  });
  
  // Clean up inline style after transition completes
  setTimeout(() => {
    wheel.style.transform = '';
  }, 500); // Match the CSS transition duration
}

/**
 * Initialize playback controls (play, stop, wheels)
 */
export function initializePlaybackControls() {
  // Prevent re-initialization
  if (isInitialized) return;
  isInitialized = true;

  const wheels = document.querySelectorAll(".wheel");
  const stopBtn = document.getElementById("stop");
  const playBtn = document.getElementById("play");
  const wavesurfer = getWaveSurfer();
  
  if (!wavesurfer) {
    console.error("WaveSurfer not initialized");
    return;
  }

  // Helper function to stop all wheels
  const stopAllWheels = () => {
    wheels.forEach((wheel) => {
      smoothStopWheel(wheel);
    });
  };

  // Stop wheels when audio finishes playing (via WaveSurfer)
  wavesurfer.on('finish', stopAllWheels);

  // Also listen directly to WebAudioPlayer's ended event
  // This ensures wheels stop even when waveform is hidden (save screen)
  const webAudioPlayer = getWebAudioPlayer();
  if (webAudioPlayer) {
    webAudioPlayer.on('ended', stopAllWheels);
  }

  // Stop/Pause button - stops wheels
  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      wheels.forEach((wheel) => {
        // Save the current animation state
        if (wheel.classList.contains("active")) {
          previousState = "active";
        } else if (wheel.classList.contains("reverse")) {
          previousState = "reverse";
        }
        // Smoothly stop the wheel
        smoothStopWheel(wheel);
        wasPaused = true;
        wavesurfer.pause();
      });
    });
  }

  // Play button - spins wheels forward
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      wavesurfer.play();      
      wheels.forEach((wheel) => {
        wheel.classList.remove("reverse");
        wheel.classList.add("active");
      });

      wasPaused = false;
      previousState = "active";
    });
  }
}

export { smoothStopWheel };

