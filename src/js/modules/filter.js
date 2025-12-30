import { getAudioContext } from "./audioContext.js";

// Store filter nodes at module level
let bassFilter = null;
let trebleFilter = null;
let isInitialized = false;

// Frequency range constants
const MIN_FREQ = 20;
const MAX_FREQ = 20000;

// Convert dial value (0-100) to frequency (20-20000) using logarithmic scale
function dialToFrequency(dialValue) {
  const normalized = dialValue / 100;
  return MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, normalized);
}

export function initializeFilterControls(gainNode) {
  // Prevent re-initialization
  if (isInitialized) return;
  isInitialized = true;

  const audioContext = getAudioContext();

  // Disconnect gainNode from destination so we can insert filters
  gainNode.disconnect();

  // Create filters
  bassFilter = audioContext.createBiquadFilter();
  bassFilter.type = "highpass";
  bassFilter.frequency.value = MIN_FREQ;
  bassFilter.Q.value = 0.7; // Gentle slope

  trebleFilter = audioContext.createBiquadFilter();
  trebleFilter.type = "lowpass";
  trebleFilter.frequency.value = MAX_FREQ;
  trebleFilter.Q.value = 0.7; // Gentle slope

  // Chain filters in series: gainNode -> bassFilter -> trebleFilter -> destination
  gainNode.connect(bassFilter);
  bassFilter.connect(trebleFilter);
  trebleFilter.connect(audioContext.destination);

  const bassDial = document.getElementById("bass");
  const trebleDial = document.getElementById("treb");

  // Use oninput event (dial-controls.js dispatches this event)
  bassDial.oninput = () => {
    bassFilter.frequency.value = dialToFrequency(bassDial.value);
  };

  trebleDial.oninput = () => {
    trebleFilter.frequency.value = dialToFrequency(trebleDial.value);
  };

  // Set initial values (bass at 0 = 20Hz, treble at 100 = 20kHz = full passthrough)
  bassFilter.frequency.value = dialToFrequency(bassDial.value);
  trebleFilter.frequency.value = dialToFrequency(trebleDial.value);
}
