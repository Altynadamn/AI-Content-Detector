// Store video data temporarily
const videoDataStore = new Map();

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('🔧 Background received message:', message.type);

  // Store video frames from popup
  if (message.type === 'STORE_VIDEO_FRAMES') {
    const { videoId, frames, videoInfo } = message;
    
    console.log('💾 Storing video frames:', {
      videoId,
      frameCount: frames?.length,
      videoInfo
    });

    // Store in chrome.storage.local (persistent across tabs)
    chrome.storage.local.set({
      pendingFrames: {
        videoId,
        frames,
        videoInfo,
        timestamp: Date.now()
      }
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('❌ Error storing frames:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('✅ Frames stored successfully in chrome.storage.local');
        sendResponse({ success: true });
      }
    });

    return true; // Keep message channel open for async response
  }

  // Store video URL (legacy - keeping for compatibility)
  if (message.type === 'STORE_VIDEO_DATA') {
    videoDataStore.set(message.videoId, {
      videoUrl: message.videoUrl,
      timestamp: Date.now()
    });
    
    console.log('📌 Stored video URL:', message.videoId);
    sendResponse({ success: true });
    
    // Clean up after 5 minutes
    setTimeout(() => {
      videoDataStore.delete(message.videoId);
    }, 5 * 60 * 1000);
    
    return true;
  }

  // Retrieve video data
  if (message.type === 'GET_VIDEO_DATA') {
    const data = videoDataStore.get(message.videoId);
    
    if (data) {
      console.log('✅ Retrieved video data:', message.videoId);
      sendResponse({ 
        success: true, 
        videoUrl: data.videoUrl 
      });
    } else {
      console.log('❌ Video data not found:', message.videoId);
      sendResponse({ 
        success: false, 
        error: 'Video data not found or expired' 
      });
    }
    
    return true;
  }
});

// Clean up old chrome.storage entries when browser starts
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.remove('pendingFrames');
  console.log('🧹 Cleaned up pending frames on startup');
});

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  
  // Clean up Map-based storage
  for (const [key, value] of videoDataStore.entries()) {
    if (now - value.timestamp > maxAge) {
      videoDataStore.delete(key);
      console.log('🧹 Cleaned up old video data:', key);
    }
  }

  // Clean up chrome.storage if too old
  chrome.storage.local.get('pendingFrames', (result) => {
    if (result.pendingFrames && now - result.pendingFrames.timestamp > maxAge) {
      chrome.storage.local.remove('pendingFrames');
      console.log('🧹 Cleaned up old pending frames');
    }
  });
}, 60 * 1000); // Check every minute

console.log('✅ Deepfake Detector background service worker loaded');