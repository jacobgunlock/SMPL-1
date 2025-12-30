import { DIAL_CONFIG } from "../config/wavesurfer-config.js";

let isInitialized = false;

/**
 * Initialize dial controls
 */
export function initializeDialControls() {
  // Prevent re-initialization (e.g., when loading new audio triggers ready event)
  if (isInitialized) return;
  isInitialized = true;

  const dials = document.querySelectorAll(".dial");

  dials.forEach((dial) => {
    let isDragging = false;
    let startX = 0;
    // Map dial ID to config key
    const dialId = dial.id;
    const configMap = {
      vol: 'VOLUME_CONFIG',
      bass: 'BASS_CONFIG',
      treb: 'TREBLE_CONFIG',
      tempo: 'TEMPO_CONFIG'
    };
    const configKey = configMap[dialId];
    const config = DIAL_CONFIG[configKey];
    
    if (!config) {
      console.warn(`No config found for dial: ${dialId}`);
      return;
    }
    
    const defaultValue = config.defaultValue;
    const maxRotation = config.maxRotation;
    const minValue = config.minValue;
    const maxValue = config.maxValue;
    const sensitivity = config.sensitivity;
    
    let currentValue = defaultValue;
    let startRotation = 0;

    // Calculate rotation per unit based on value range
    const valueRange = maxValue - minValue;
    const centerValue = (maxValue + minValue) / 2;
    const rotationPerUnit = maxRotation / (valueRange / 2); // Rotation per unit from center

    function updateDialRotation(value) {
      // Clamp value between min and max
      value = Math.max(
        minValue,
        Math.min(maxValue, value)
      );
      // Calculate rotation: min = -maxRotation, center = 0deg, max = +maxRotation
      const rotation = (value - centerValue) * rotationPerUnit;
      dial.style.setProperty('--dial-rotation', `${rotation}deg`);
      const oldValue = currentValue;
      currentValue = value;
      dial.dataset.value = Math.round(value);

      // Dispatch input event when value changes (like a real input element)
      if (oldValue !== value) {
        dial.dispatchEvent(new Event('input'));
      }
    }

    // Initialize to dial-specific default position
    updateDialRotation(defaultValue);

    function handleStart(e) {
      isDragging = true;
      startX = e.clientX || e.touches[0].clientX;
      startRotation = currentValue;
      dial.classList.add("dragging");
      e.preventDefault();
    }

    function handleMove(e) {
      if (!isDragging) return;

      const currentX = e.clientX || e.touches[0].clientX;
      const deltaX = currentX - startX;

      const deltaValue = deltaX / sensitivity;
      const newValue = startRotation + deltaValue;

      updateDialRotation(newValue);
      e.preventDefault();
    }

    function handleEnd(e) {
      if (isDragging) {
        isDragging = false;
        dial.classList.remove("dragging");
        e.preventDefault();
      }
    }

    function handleDoubleClick(e) {
      updateDialRotation(defaultValue);
      e.preventDefault();
    }

    // Mouse events
    dial.addEventListener("mousedown", handleStart);
    dial.addEventListener("dblclick", handleDoubleClick);
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);

    // Expose update function and current value for access
    dial.updateValue = updateDialRotation;
    Object.defineProperty(dial, "value", {
      get: () => currentValue,
      set: (val) => updateDialRotation(val),
    });
  });
}
