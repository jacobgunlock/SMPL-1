/**
 * Audio Storage Module
 * Handles saving and loading the last recorded audio clip using Chrome storage
 */

const STORAGE_KEY = "lastRecordedAudio";

/**
 * Convert a Blob to base64 string
 * @param {Blob} blob - The audio blob to convert
 * @returns {Promise<string>} - Base64 encoded string
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert a base64 string back to Blob
 * @param {string} base64 - Base64 encoded string
 * @returns {Blob} - The reconstructed blob
 */
function base64ToBlob(base64) {
  const parts = base64.split(";base64,");
  const contentType = parts[0].split(":")[1];
  const raw = atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Save the recorded audio to Chrome storage
 * @param {Blob} audioBlob - The recorded audio blob
 * @returns {Promise<boolean>} - True if saved successfully
 */
export async function saveRecordedAudio(audioBlob) {
  try {
    const base64Data = await blobToBase64(audioBlob);
    
    await chrome.storage.local.set({
      [STORAGE_KEY]: {
        data: base64Data,
        timestamp: Date.now(),
        type: audioBlob.type
      }
    });
    
    console.log("Audio saved to Chrome storage");
    return true;
  } catch (error) {
    console.error("Error saving audio to storage:", error);
    return false;
  }
}

/**
 * Load the last recorded audio from Chrome storage
 * @returns {Promise<string|null>} - Object URL to the audio blob, or null if none exists
 */
export async function loadRecordedAudio() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    
    if (result[STORAGE_KEY] && result[STORAGE_KEY].data) {
      const blob = base64ToBlob(result[STORAGE_KEY].data);
      const audioUrl = URL.createObjectURL(blob);
      console.log("Loaded saved audio from Chrome storage");
      return audioUrl;
    }
    
    return null;
  } catch (error) {
    console.error("Error loading audio from storage:", error);
    return null;
  }
}

/**
 * Check if there's a saved recording
 * @returns {Promise<boolean>}
 */
export async function hasSavedRecording() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return !!(result[STORAGE_KEY] && result[STORAGE_KEY].data);
  } catch (error) {
    console.error("Error checking storage:", error);
    return false;
  }
}

/**
 * Clear the saved recording
 * @returns {Promise<boolean>}
 */
export async function clearSavedRecording() {
  try {
    await chrome.storage.local.remove(STORAGE_KEY);
    console.log("Cleared saved audio from storage");
    return true;
  } catch (error) {
    console.error("Error clearing storage:", error);
    return false;
  }
}
