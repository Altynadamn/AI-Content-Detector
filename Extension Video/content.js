// Content script - runs on all web pages
console.log('🔧 Deepfake Detector content script loaded');

// Check if we're on the React app page
const REACT_APP_ORIGIN = 'http://localhost:3002';
const isReactApp = window.location.origin === REACT_APP_ORIGIN;

console.log('📍 Current page:', window.location.href);
console.log('🎯 Is React app page?', isReactApp);

if (isReactApp) {
  console.log('✅ Content script running on React app page');

  // Listen for frame requests from React app via window.postMessage
  window.addEventListener('message', (event) => {
    // Only accept messages from our React app origin
    if (event.origin !== REACT_APP_ORIGIN) {
      console.log('⚠️ Ignoring message from wrong origin:', event.origin);
      return;
    }

    console.log('📨 Content script received window message:', event.data);

    if (event.data.type === 'REQUEST_FRAMES') {
      const videoId = event.data.videoId;
      console.log('🔍 Processing frame request for videoId:', videoId);

      // Get frames from chrome.storage.local
      chrome.storage.local.get('pendingFrames', (result) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Chrome storage error:', chrome.runtime.lastError);
          window.postMessage({
            type: 'FRAMES_ERROR',
            videoId: videoId,
            error: 'Failed to access extension storage: ' + chrome.runtime.lastError.message
          }, REACT_APP_ORIGIN);
          return;
        }

        console.log('📦 Chrome storage get result:', result);

        if (result.pendingFrames) {
          const { frames, videoInfo, videoId: storedVideoId, timestamp } = result.pendingFrames;

          console.log('🔍 Storage data found:', {
            storedVideoId,
            requestedVideoId: videoId,
            frameCount: frames?.length,
            hasVideoInfo: !!videoInfo,
            timestamp,
            ageMs: Date.now() - timestamp
          });

          if (storedVideoId === videoId) {
            if (frames && frames.length > 0) {
              console.log('✅ Sending frames to React app, count:', frames.length);

              // Send frames back to React app
              window.postMessage({
                type: 'FRAMES_DATA',
                videoId: videoId,
                frames: frames,
                videoInfo: videoInfo
              }, REACT_APP_ORIGIN);

              // Clear storage after successful delivery
              chrome.storage.local.remove('pendingFrames', () => {
                if (chrome.runtime.lastError) {
                  console.warn('⚠️ Failed to clear storage:', chrome.runtime.lastError);
                } else {
                  console.log('🧹 Cleared chrome.storage after delivery');
                }
              });
            } else {
              console.error('❌ No frames in stored data');
              window.postMessage({
                type: 'FRAMES_ERROR',
                videoId: videoId,
                error: 'No frames found in stored data'
              }, REACT_APP_ORIGIN);
            }
          } else {
            console.error('❌ Video ID mismatch!', {
              stored: storedVideoId,
              requested: videoId
            });
            window.postMessage({
              type: 'FRAMES_ERROR',
              videoId: videoId,
              error: `Video ID mismatch. Expected ${videoId} but found ${storedVideoId}`
            }, REACT_APP_ORIGIN);
          }
        } else {
          console.error('❌ No pendingFrames in chrome.storage.local');
          
          // Debug: Check all storage
          chrome.storage.local.get(null, (allItems) => {
            console.log('📦 All chrome.storage.local items:', allItems);
          });
          
          window.postMessage({
            type: 'FRAMES_ERROR',
            videoId: videoId,
            error: 'No video data found in storage. Make sure to click "Analyze" from the extension popup first.'
          }, REACT_APP_ORIGIN);
        }
      });
    }
  });

  console.log('✅ Window message listener registered');
  
} else {
  console.log('🌐 Content script on regular web page');

  // Listen for extension messages (for future features)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 Content script received chrome message:', message);
    
    if (message.type === 'PING') {
      sendResponse({ status: 'ok' });
    }
    
    return true;
  });
}