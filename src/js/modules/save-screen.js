import { getWebAudioPlayer } from "./audioContext.js";
import { loopRegion } from "./loop-region.js";
import { getWaveSurfer } from "./wavesurfer.js";
import toWav from "audiobuffer-to-wav";

// Frequency range constants (must match filter.js)
const MIN_FREQ = 20;
const MAX_FREQ = 20000;

// Convert dial value (0-100) to frequency (20-20000) using logarithmic scale
function dialToFrequency(dialValue) {
  const normalized = dialValue / 100;
  return MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, normalized);
}

let isInitialized = false;

export function saveScreen() {
  // Prevent re-initialization
  if (isInitialized) return;
  isInitialized = true;

  const ejectBtn = document.getElementById("eject");
  const waveScreen = document.querySelector(".waveScreen");
  const downloadBtn = document.getElementById("download");

  if (!ejectBtn || !waveScreen) return;

  // Setup download button listener (element already exists in HTML)
  if (downloadBtn) {
    downloadBtn.addEventListener("click", downloadAudio);
  }

  // Toggle visibility on eject button click
  ejectBtn.addEventListener("click", () => {
    const isActive = waveScreen.classList.toggle("save-screen-active");
    
    // When returning to waveform view, trigger a redraw
    if (!isActive) {
      const wavesurfer = getWaveSurfer();
      if (wavesurfer) {
        // Small delay to ensure CSS transition completes
        setTimeout(() => {
          wavesurfer.drawer?.fireEvent?.('redraw') || wavesurfer.setOptions({});
        }, 50);
      }
    }
  });
}

async function downloadAudio() {
  // Get audio buffer from WebAudioPlayer
  const webAudioPlayer = getWebAudioPlayer();
  const originalBuffer = webAudioPlayer.buffer;

  if (!originalBuffer) {
    console.error("No audio buffer available");
    return;
  }

  // Get toggle states
  const formatToggle = document.getElementById("format-toggle");
  const modeToggle = document.getElementById("mode-toggle");
  const isWav = formatToggle.checked; // checked = WAV, unchecked = MP3
  const isLoopMode = modeToggle.checked; // checked = LOOP (region), unchecked = CLIP (full)

  // Get current effect values from dials
  const tempoDial = document.getElementById("tempo");
  const bassDial = document.getElementById("bass");
  const trebleDial = document.getElementById("treb");
  const volDial = document.getElementById("vol");

  const playbackRate = parseFloat(tempoDial?.value) || 1;
  const bassFreq = dialToFrequency(parseFloat(bassDial?.value) || 0);
  const trebleFreq = dialToFrequency(parseFloat(trebleDial?.value) || 100);
  const volume = (parseFloat(volDial?.value) || 100) / 100;

  // Determine audio segment to export
  let startTime = 0;
  let endTime = originalBuffer.duration;

  if (isLoopMode && loopRegion) {
    // LOOP mode - export only the loop region
    startTime = loopRegion.start;
    endTime = loopRegion.end;
  } 

  // Extract segment from buffer
  const startSample = Math.floor(startTime * originalBuffer.sampleRate);
  const endSample = Math.floor(endTime * originalBuffer.sampleRate);
  const segmentLength = endSample - startSample;

  // Create offline context with adjusted length for tempo
  const duration = segmentLength / originalBuffer.sampleRate / playbackRate;
  const offlineContext = new OfflineAudioContext(
    originalBuffer.numberOfChannels,
    Math.ceil(duration * originalBuffer.sampleRate),
    originalBuffer.sampleRate
  );

  // Create source with tempo
  const source = offlineContext.createBufferSource();
  source.buffer = originalBuffer;
  source.playbackRate.value = playbackRate;

  // Create gain node for volume
  const gainNode = offlineContext.createGain();
  gainNode.gain.value = volume;

  // Create filters
  const bassFilter = offlineContext.createBiquadFilter();
  bassFilter.type = "highpass";
  bassFilter.frequency.value = bassFreq;
  bassFilter.Q.value = 0.7; // Match filter.js Q value

  const trebleFilter = offlineContext.createBiquadFilter();
  trebleFilter.type = "lowpass";
  trebleFilter.frequency.value = trebleFreq;
  trebleFilter.Q.value = 0.7; // Match filter.js Q value

  // Connect chain: source -> gainNode -> bassFilter -> trebleFilter -> destination
  source.connect(gainNode);
  gainNode.connect(bassFilter);
  bassFilter.connect(trebleFilter);
  trebleFilter.connect(offlineContext.destination);

  // Render audio with effects (start at segment start time)
  source.start(0, startTime, endTime - startTime);
  const renderedBuffer = await offlineContext.startRendering();
  

  // Get filename
  const nameInput = document.getElementById("save-name");
  const filename =
    nameInput && nameInput.value.trim() ? nameInput.value.trim() : "recording";

  // Export in selected format
  let blobToDownload;
  let extension;

  if (isWav) {
    // Export as WAV
    const wav = toWav(renderedBuffer);
    blobToDownload = new Blob([wav], { type: "audio/wav" });
    extension = "wav";
  } else {
    // Export as MP3
    const mp3Data = encodeToMp3(renderedBuffer);
    blobToDownload = new Blob(mp3Data, { type: "audio/mp3" });
    extension = "mp3";
  }

  // Download file
  const url = URL.createObjectURL(blobToDownload);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function encodeToMp3(audioBuffer) {
  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const mp3encoder = new window.lamejs.Mp3Encoder(channels, sampleRate, 128); // 128 kbps

  const mp3Data = [];
  const sampleBlockSize = 1152;

  // Get channel data
  const left = audioBuffer.getChannelData(0);
  const right = channels > 1 ? audioBuffer.getChannelData(1) : left;

  // Convert to 16-bit PCM
  const leftPcm = new Int16Array(left.length);
  const rightPcm = new Int16Array(right.length);

  for (let i = 0; i < left.length; i++) {
    leftPcm[i] = Math.max(-32768, Math.min(32767, left[i] * 32768));
    rightPcm[i] = Math.max(-32768, Math.min(32767, right[i] * 32768));
  }

  // Encode in blocks
  for (let i = 0; i < leftPcm.length; i += sampleBlockSize) {
    const leftChunk = leftPcm.subarray(i, i + sampleBlockSize);
    const rightChunk = rightPcm.subarray(i, i + sampleBlockSize);
    const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  // Flush remaining data
  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }

  return mp3Data;
}
