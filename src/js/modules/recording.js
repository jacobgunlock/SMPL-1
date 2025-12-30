import { RECORDING_TEXT_STYLES } from "../config/constants.js";
import { getWaveSurfer } from "./wavesurfer.js";
import { getAudioContext } from "./audioContext.js";
import { smoothStopWheel } from "./playback.js";
import { saveRecordedAudio } from "./audioStorage.js";

let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;
let displayStream = null; // Store the original display stream
let isControlsInitialized = false;

// Live waveform visualization (DAW-style growing waveform)
let liveCanvas = null;
let liveCanvasCtx = null;
let analyserNode = null;
let animationFrameId = null;
let sourceNode = null;
let waveformPeaks = []; // Store accumulated peaks for DAW-style display
let recordingStartTime = null;
let lastPeakTime = 0;

// Configuration for DAW-style waveform
const PEAK_INTERVAL_MS = 50; // How often to capture a new peak (controls waveform density)
const BAR_WIDTH = 2; // Width of each bar
const BAR_GAP = 1; // Gap between bars
const BAR_RADIUS = 1; // Rounded corners on bars

/**
 * Create and setup live waveform canvas
 */
function createLiveWaveformCanvas(waveScreen) {
  // Create canvas if it doesn't exist
  if (!liveCanvas) {
    liveCanvas = document.createElement("canvas");
    liveCanvas.className = "live-waveform-canvas";
    liveCanvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10;
      background: transparent;
      display: none;
    `;
    waveScreen.appendChild(liveCanvas);
  }
  
  // Set canvas resolution to match container
  const rect = waveScreen.getBoundingClientRect();
  liveCanvas.width = rect.width * window.devicePixelRatio;
  liveCanvas.height = rect.height * window.devicePixelRatio;
  liveCanvasCtx = liveCanvas.getContext("2d");
  liveCanvasCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
  
  // Reset peaks array
  waveformPeaks = [];
  recordingStartTime = Date.now();
  lastPeakTime = 0;
  
  return liveCanvas;
}

/**
 * Start live waveform visualization
 */
function startLiveWaveform(stream) {
  const audioContext = getAudioContext();
  
  // Create analyser node
  analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 256; // Smaller for faster peak detection
  analyserNode.smoothingTimeConstant = 0.3;
  
  // Connect stream to analyser
  sourceNode = audioContext.createMediaStreamSource(stream);
  sourceNode.connect(analyserNode);
  
  // Show canvas
  if (liveCanvas) {
    liveCanvas.style.display = "block";
  }
  
  // Start drawing
  drawLiveWaveform();
}

/**
 * Get current peak amplitude from analyser
 */
function getCurrentPeak() {
  if (!analyserNode) return 0;
  
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyserNode.getByteTimeDomainData(dataArray);
  
  // Find peak deviation from center (128)
  let maxPeak = 0;
  for (let i = 0; i < bufferLength; i++) {
    const deviation = Math.abs(dataArray[i] - 128);
    if (deviation > maxPeak) {
      maxPeak = deviation;
    }
  }
  
  // Normalize to 0-1 range
  return maxPeak / 128;
}

/**
 * Format time as MM:SS
 */
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Draw DAW-style growing waveform
 */
function drawLiveWaveform() {
  if (!analyserNode || !liveCanvasCtx || !liveCanvas) return;
  
  function draw() {
    if (!isRecording) return;
    
    animationFrameId = requestAnimationFrame(draw);
    
    const now = Date.now();
    const elapsed = now - recordingStartTime;
    
    // Capture new peak at intervals
    if (now - lastPeakTime >= PEAK_INTERVAL_MS) {
      const peak = getCurrentPeak();
      waveformPeaks.push(peak);
      lastPeakTime = now;
    }
    
    const width = liveCanvas.width / window.devicePixelRatio;
    const height = liveCanvas.height / window.devicePixelRatio;
    const centerY = height / 2;
    
    // Clear canvas with dark background
    liveCanvasCtx.fillStyle = "#14141e";
    liveCanvasCtx.fillRect(0, 0, width, height);
    
    // Draw center line
    liveCanvasCtx.strokeStyle = "rgba(100, 181, 246, 0.15)";
    liveCanvasCtx.lineWidth = 1;
    liveCanvasCtx.beginPath();
    liveCanvasCtx.moveTo(0, centerY);
    liveCanvasCtx.lineTo(width, centerY);
    liveCanvasCtx.stroke();
    
    // Calculate how many bars fit on screen
    const barTotalWidth = BAR_WIDTH + BAR_GAP;
    const maxBarsOnScreen = Math.floor(width / barTotalWidth);
    
    // Determine which peaks to show (scroll if needed)
    const startIndex = Math.max(0, waveformPeaks.length - maxBarsOnScreen);
    const visiblePeaks = waveformPeaks.slice(startIndex);
    
    // Draw waveform bars
    visiblePeaks.forEach((peak, index) => {
      const x = index * barTotalWidth;
      const barHeight = Math.max(2, peak * (height * 0.8)); // Min height of 2px
      
      // Draw mirrored bars (top and bottom from center)
      liveCanvasCtx.fillStyle = "rgb(100, 181, 246)";
      
      // Top bar
      roundRect(
        liveCanvasCtx,
        x,
        centerY - barHeight / 2,
        BAR_WIDTH,
        barHeight / 2,
        BAR_RADIUS
      );
      
      // Bottom bar
      roundRect(
        liveCanvasCtx,
        x,
        centerY,
        BAR_WIDTH,
        barHeight / 2,
        BAR_RADIUS
      );
    });
    
    // Draw playhead (current position indicator)
    const playheadX = Math.min(visiblePeaks.length * barTotalWidth, width - 2);
    liveCanvasCtx.fillStyle = "rgba(255, 255, 255, 0.8)";
    liveCanvasCtx.fillRect(playheadX, 0, 2, height);
    
    // Draw recording indicator (pulsing red dot)
    const pulseAlpha = 0.6 + 0.4 * Math.sin(now / 300);
    liveCanvasCtx.fillStyle = `rgba(255, 82, 82, ${pulseAlpha})`;
    liveCanvasCtx.beginPath();
    liveCanvasCtx.arc(21, 16, 6, 0, Math.PI * 2);
    liveCanvasCtx.fill();
    
    // Draw recording time
    liveCanvasCtx.fillStyle = "rgba(255, 255, 255, 0.9)";
    liveCanvasCtx.font = "bold 13px monospace";
    liveCanvasCtx.fillText(formatTime(elapsed), 33, 20);
  }
  
  draw();
}

/**
 * Draw a rounded rectangle (for bar waveform style)
 */
function roundRect(ctx, x, y, width, height, radius) {
  if (height < 1) return;
  
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

/**
 * Stop live waveform visualization
 */
function stopLiveWaveform() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = null;
  }
  
  if (analyserNode) {
    analyserNode.disconnect();
    analyserNode = null;
  }
  
  if (liveCanvas) {
    liveCanvas.style.display = "none";
  }
  
  // Clear peaks
  waveformPeaks = [];
  recordingStartTime = null;
}

/**
 * Start recording audio from browser tabs (e.g., YouTube videos)
 */
async function startRecording() {
  try {
    // Request screen/desktop audio capture (browser will show dialog to select tab)
    // Request audio with video option for better browser compatibility
    displayStream = await navigator.mediaDevices.getDisplayMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        suppressLocalAudioPlayback: false,
      },
      video: true, // Some browsers require video to be true, but we'll only use audio tracks
    });

    // Extract only audio tracks (filter out video tracks)
    const audioTracks = displayStream.getAudioTracks();
    if (audioTracks.length === 0) {
      throw new Error(
        "No audio track available. Please ensure you select a tab with audio."
      );
    }

    // Create a new stream with only audio tracks
    audioStream = new MediaStream(audioTracks);

    // Create MediaRecorder instance with high quality settings
    const options = {
      audioBitsPerSecond: 320000, // 320 kbps for higher quality
    };

    // Prefer Opus codec if supported
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
      options.mimeType = "audio/webm;codecs=opus";
    } else if (MediaRecorder.isTypeSupported("audio/webm")) {
      options.mimeType = "audio/webm";
    }

    mediaRecorder = new MediaRecorder(audioStream, options);
    audioChunks = [];

    // Collect audio data chunks
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    // When recording stops, process the audio
    mediaRecorder.onstop = async () => {
      // Stop live waveform visualization
      stopLiveWaveform();
      
      // Create blob from chunks
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Save to Chrome storage for persistence
      await saveRecordedAudio(audioBlob);

      // Load the recorded audio into WaveSurfer
      const wavesurfer = getWaveSurfer();
      if (wavesurfer) {
        wavesurfer.load(audioUrl);
        console.log("Recorded browser audio loaded into WaveSurfer");
      } else {
        console.error("WaveSurfer instance not available");
      }

      // Stop all tracks to release resources
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
        audioStream = null;
      }

      // Also stop the original display stream if it still has tracks
      if (displayStream) {
        displayStream.getTracks().forEach((track) => {
          if (track.readyState !== "ended") {
            track.stop();
          }
        });
        displayStream = null;
      }
    };

    // Handle if user stops sharing via browser UI
    audioTracks[0].onended = () => {
      if (isRecording && mediaRecorder && mediaRecorder.state !== "inactive") {
        stopRecording();
        stopLiveWaveform();
        // Reset UI state
        isRecording = false;
        const recordBtn = document.getElementById("record");
        const waveScreen = document.querySelector(".waveScreen");
        if (recordBtn) {
          recordBtn.classList.remove("recording");
        }
        if (waveScreen) {
          waveScreen.classList.remove("recording");
          const recordingText = waveScreen.querySelector(".recording-text");
          if (recordingText) {
            recordingText.style.display = "none";
          }
        }
      }
    };

    // Stop any currently playing audio before starting recording
    const wavesurfer = getWaveSurfer();
    if (wavesurfer) {
      wavesurfer.stop();
      const wheels = document.querySelectorAll(".wheel");
      if (wheels) {
        wheels.forEach((wheel) => {
          smoothStopWheel(wheel);
        });
      }
    }

    // Start recording
    mediaRecorder.start();
    
    // Start live waveform visualization
    const waveScreen = document.querySelector(".waveScreen");
    if (waveScreen) {
      createLiveWaveformCanvas(waveScreen);
      startLiveWaveform(audioStream);
    }

    console.log("Recording browser audio started");
  } catch (error) {
    console.error("Error accessing browser audio:", error);

    // Stop live waveform if started
    stopLiveWaveform();
    
    // Clean up streams if they were created
    if (displayStream) {
      displayStream.getTracks().forEach((track) => track.stop());
      displayStream = null;
    }
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
      audioStream = null;
    }

    if (error.name === "NotAllowedError") {
      alert(
        "Please allow screen/tab sharing to record audio from browser tabs."
      );
    } else if (error.name === "NotFoundError") {
      alert("No audio source found. Please select a tab with audio playing.");
    } else {
      alert(
        "Could not access browser audio. Please check permissions and try again."
      );
    }

    // Reset recording state if error occurs
    isRecording = false;
    const recordBtn = document.getElementById("record");
    const waveScreen = document.querySelector(".waveScreen");
    if (recordBtn) {
      recordBtn.classList.remove("recording");
    }
    if (waveScreen) {
      waveScreen.classList.remove("recording");
      const recordingText = waveScreen.querySelector(".recording-text");
      if (recordingText) {
        recordingText.style.display = "none";
      }
    }
  }
}

/**
 * Stop recording audio
 */
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
}

/**
 * Initialize recording controls
 */
export function initializeRecordingControls() {
  // Prevent re-initialization
  if (isControlsInitialized) return;
  isControlsInitialized = true;

  const recordBtn = document.getElementById("record");
  const waveScreen = document.querySelector(".waveScreen");

  if (!recordBtn || !waveScreen) {
    return;
  }

  // Create recording text element
  const recordingText = document.createElement("div");
  recordingText.className = "recording-text";
  recordingText.style.display = "none";
  waveScreen.appendChild(recordingText);

  recordBtn.addEventListener("click", async () => {
    isRecording = !isRecording;
    recordBtn.classList.toggle("recording");
    waveScreen.classList.toggle("recording");

    if (isRecording) {
      recordingText.style.display = "block";
      recordingText.textContent = "recording...";

      // Apply styles
      Object.assign(recordingText.style, RECORDING_TEXT_STYLES);

      // Start recording
      await startRecording();
    } else {
      recordingText.style.display = "none";

      // Stop recording
      stopRecording();
    }
  });
}
export { isRecording };
