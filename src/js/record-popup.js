const startBtn = document.getElementById("start-btn");
const statusEl = document.getElementById("status");
const stopBtn = document.getElementById("stop-btn");
const dotEl = document.getElementById("dot");

let targetTabId = null;

// ---------------------------------------------------------------------------
// Content script injected into the target tab.
// Must be fully self-contained — no closures over outer-scope variables.
// Uses captureStream() / mozCaptureStream() to grab audio from <audio>/<video>
// elements (works reliably for MSE-based sites like YouTube that use blob: URLs).
// ---------------------------------------------------------------------------
function captureTabAudio() {
  const mediaEls = Array.from(document.querySelectorAll("audio, video")).filter(
    (el) => typeof (el.captureStream || el.mozCaptureStream) === "function"
  );

  if (mediaEls.length === 0) {
    browser.runtime.sendMessage({
      type: "tab-capture-status",
      status: "error",
      message: "No audio/video elements found on this page. Make sure media is playing.",
    });
    return;
  }

  const ctx = new AudioContext();
  const dest = ctx.createMediaStreamDestination();
  let captured = 0;

  mediaEls.forEach((el) => {
    try {
      const fn = el.captureStream || el.mozCaptureStream;
      const stream = fn.call(el);
      const tracks = stream.getAudioTracks();
      if (tracks.length > 0) {
        ctx.createMediaStreamSource(new MediaStream(tracks)).connect(dest);
        captured++;
      }
    } catch (_) {}
  });

  if (captured === 0) {
    ctx.close();
    browser.runtime.sendMessage({
      type: "tab-capture-status",
      status: "error",
      message: "Could not capture audio (CORS restriction or no audio tracks).",
    });
    return;
  }

  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";
  const recorder = new MediaRecorder(dest.stream, { mimeType, audioBitsPerSecond: 320000 });
  const chunks = [];

  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: mimeType });
    const reader = new FileReader();
    reader.onloadend = () => {
      browser.storage.local
        .set({ lastRecordedAudio: { data: reader.result, timestamp: Date.now(), type: blob.type } })
        .then(() => browser.runtime.sendMessage({ type: "tab-capture-status", status: "saved" }));
    };
    reader.readAsDataURL(blob);
    ctx.close();
  };

  recorder.start();
  browser.runtime.sendMessage({ type: "tab-capture-status", status: "started" });

  const stopHandler = (msg) => {
    if (msg?.type === "stop-tab-capture") {
      recorder.stop();
      browser.runtime.onMessage.removeListener(stopHandler);
    }
  };
  browser.runtime.onMessage.addListener(stopHandler);
}

// ---------------------------------------------------------------------------

function stop() {
  if (targetTabId !== null) {
    browser.tabs.sendMessage(targetTabId, { type: "stop-tab-capture" }).catch(() => {});
  }
}

startBtn.addEventListener("click", async () => {
  startBtn.style.display = "none";
  statusEl.style.display = "inline";
  statusEl.textContent = "Starting…";

  // Read the tab ID stored by the sidebar before this popup was opened.
  const result = await browser.storage.local.get("recordingTabId");
  targetTabId = result.recordingTabId ?? null;

  if (!targetTabId) {
    statusEl.textContent = "Error: could not determine target tab.";
    setTimeout(() => window.close(), 2500);
    return;
  }

  // Listen for status messages sent back from the injected content script.
  browser.runtime.onMessage.addListener((msg) => {
    if (msg?.type !== "tab-capture-status") return;
    if (msg.status === "started") {
      statusEl.textContent = "Recording";
      dotEl.style.display = "inline";
      stopBtn.style.display = "inline-block";
      let visible = true;
      setInterval(() => { dotEl.style.opacity = (visible = !visible) ? "1" : "0.2"; }, 600);
    } else if (msg.status === "saved") {
      window.close();
    } else if (msg.status === "error") {
      statusEl.textContent = msg.message || "Error capturing audio.";
      setTimeout(() => window.close(), 3000);
    }
  });

  // Inject the capture script into the target tab.
  try {
    await browser.scripting.executeScript({
      target: { tabId: targetTabId },
      func: captureTabAudio,
    });
  } catch (err) {
    statusEl.textContent = "Cannot inject into this tab: " + err.message;
    setTimeout(() => window.close(), 3000);
  }
});

stopBtn.addEventListener("click", stop);

// Allow the sidebar record button (second click) to stop recording.
browser.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "stop-recording") stop();
});


