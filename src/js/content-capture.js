// Content script — injected into every page by the Firefox manifest.
// Stays dormant until it receives a 'startCapture' / 'stopCapture' message
// from the background script.  Architecture mirrors the reference extension:
// createMediaElementSource routes audio to BOTH the speakers and the recorder.
(function () {
  if (window.__smpl1CaptureReady) return; // guard against duplicate injection
  window.__smpl1CaptureReady = true;

  var mediaRecorder = null;
  var chunks = [];
  var captureSourceTabId = null;

  // Persistent AudioContext and source node — createMediaElementSource can only
  // be called once per element; closing the context would permanently mute it.
  var audioCtx = null;
  var captureSource = null; // MediaElementAudioSourceNode — reused across recordings
  var captureDest = null;   // MediaStreamAudioDestinationNode — recreated each recording

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (!request || !request.action) return true;

    // ── Start ──────────────────────────────────────────────────────────────
    if (request.action === 'startCapture') {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        sendResponse({ ok: false, error: 'Already recording' });
        return true;
      }

      captureSourceTabId = request.sourceTabId;
      chunks = [];

      var mediaEl = document.querySelector('video') || document.querySelector('audio');
      if (!mediaEl) {
        chrome.runtime.sendMessage({
          action: 'captureError',
          error: 'No audio or video element found on this page. Make sure media is playing.',
          sourceTabId: captureSourceTabId
        });
        sendResponse({ ok: false });
        return true;
      }

      try {
        // Lazily create AudioContext and source — never close them so audio keeps playing.
        if (!audioCtx || audioCtx.state === 'closed') {
          audioCtx = new AudioContext();
          captureSource = null; // context replaced, must recreate source too
        }
        if (!captureSource) {
          captureSource = audioCtx.createMediaElementSource(mediaEl);
          captureSource.connect(audioCtx.destination); // keep audio audible
        }

        // Fresh destination for each recording.
        captureDest = audioCtx.createMediaStreamDestination();
        captureSource.connect(captureDest);

        var candidates = ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/webm'];
        var mimeType = candidates.find(function (t) { return MediaRecorder.isTypeSupported(t); }) || '';

        mediaRecorder = new MediaRecorder(captureDest.stream, {
          mimeType: mimeType || undefined,
          audioBitsPerSecond: 320000
        });

        mediaRecorder.ondataavailable = function (e) {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = function () {
          var blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
          chunks = [];

          // Disconnect recorder feed only — source→destination stays connected so audio plays on.
          if (captureSource && captureDest) {
            try { captureSource.disconnect(captureDest); } catch (e) {}
          }
          captureDest = null;
          mediaRecorder = null;

          // Blobs are not serializable across runtime.sendMessage; convert to DataURL first.
          var reader = new FileReader();
          reader.onloadend = function () {
            chrome.runtime.sendMessage({
              action: 'captureComplete',
              dataUrl: reader.result,
              mimeType: mimeType || 'audio/webm',
              sourceTabId: captureSourceTabId
            });
          };
          reader.readAsDataURL(blob);
        };

        mediaRecorder.start(500);
        sendResponse({ ok: true });
      } catch (e) {
        chrome.runtime.sendMessage({
          action: 'captureError',
          error: 'Web Audio capture failed: ' + e.message,
          sourceTabId: captureSourceTabId
        });
        sendResponse({ ok: false, error: e.message });
      }
      return true;
    }

    // ── Stop ───────────────────────────────────────────────────────────────
    if (request.action === 'stopCapture') {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false });
      }
      return true;
    }

    return true;
  });
})();
