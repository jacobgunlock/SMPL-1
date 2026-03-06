// Toggle sidebar when the extension toolbar button is clicked (MV2: browserAction).
browser.browserAction.onClicked.addListener(function () {
  browser.sidebarAction.toggle();
});

// Route messages between the sidebar and the content script in the target tab.
browser.runtime.onMessage.addListener(function (request) {
  if (!request) return;

  // Sidebar → background: start recording
  if (request.cmd === 'startCapture') {
    var tabId = request.tabId;

    // Try sending to the content script; if it isn't loaded yet (tab predates
    // extension install/reload), inject via tabs.executeScript and retry once.
    function tryStart(isRetry) {
      browser.tabs.sendMessage(tabId, { action: 'startCapture', sourceTabId: tabId })
        .catch(function (err) {
          if (isRetry) {
            browser.runtime.sendMessage({ captureError: 'Could not start capture: ' + err.message });
            return;
          }
          // MV2: tabs.executeScript works without extra host-permission hurdles.
          browser.tabs.executeScript(tabId, { file: 'content-capture.js' })
            .then(function () { tryStart(true); })
            .catch(function (injectErr) {
              browser.runtime.sendMessage({ captureError: 'Could not inject into tab: ' + injectErr.message });
            });
        });
    }
    tryStart(false);
    return;
  }

  // Sidebar → background: stop recording
  if (request.cmd === 'stopCapture') {
    browser.tabs.sendMessage(request.tabId, { action: 'stopCapture' }).catch(function () {});
    return;
  }

  // Content script → background: recording complete — save DataURL to storage
  if (request.action === 'captureComplete') {
    var dataUrl = request.dataUrl;
    var mimeType = request.mimeType || 'audio/webm';
    // Save for persistence across sidebar reloads.
    browser.storage.local.set({
      lastRecordedAudio: {
        data: dataUrl,
        timestamp: Date.now(),
        type: mimeType
      }
    }).catch(function (err) {
      browser.runtime.sendMessage({ captureError: 'Failed to save recording: ' + err.message });
    });
    // Directly notify the sidebar — don't rely on storage.onChanged.
    browser.runtime.sendMessage({ captureReady: true, dataUrl: dataUrl }).catch(function () {});
    return;
  }

  // Content script → background: error — relay to sidebar
  if (request.action === 'captureError') {
    browser.runtime.sendMessage({ captureError: request.error });
    return;
  }
});

