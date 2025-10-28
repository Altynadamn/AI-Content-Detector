// Configuration
const REACT_APP_URL = 'http://localhost:3002';

// Get current tab and find videos
async function findVideosOnPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab?.id) {
    showNoVideos();
    return;
  }

  showLoading();

  try {
    // Add timeout to prevent infinite loading
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Scan timeout')), 5000)
    );

    const scanPromise = chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractVideos
    });

    const results = await Promise.race([scanPromise, timeoutPromise]);
    const videos = results[0]?.result || [];
    
    console.log('Found videos:', videos);
    
    if (videos.length === 0) {
      showNoVideos();
    } else {
      displayVideos(videos, tab.id);
    }
  } catch (error) {
    console.error('Error finding videos:', error);
    showError('Failed to scan page. Try refreshing and reopening the extension.');
  }
}

// Simplified function that runs in the page context
function extractVideos() {
  const videos = [];
  const videoElements = document.querySelectorAll('video');
  
  console.log(`Scanning page... found ${videoElements.length} video elements`);
  
  videoElements.forEach((video, index) => {
    try {
      // Get basic video info
      const rect = video.getBoundingClientRect();
      const src = video.currentSrc || video.src || '';
      const hasSource = src.length > 0 || video.querySelector('source');
      
      // Only include videos that have some content
      if (hasSource || video.videoWidth > 0 || rect.width > 50) {
        videos.push({
          id: `video_${Date.now()}_${index}`,
          index: index,
          width: video.videoWidth || rect.width,
          height: video.videoHeight || rect.height,
          duration: video.duration || 0,
          currentSrc: src.substring(0, 100), // Truncate long URLs
          hasSource: !!hasSource,
          readyState: video.readyState
        });
      }
    } catch (e) {
      console.error('Error processing video:', e);
    }
  });
  
  return videos;
}

// Display functions with safety checks
function showLoading() {
  const loading = document.getElementById('loading');
  const videoList = document.getElementById('video-list');
  const noVideos = document.getElementById('no-videos');
  const errorMsg = document.getElementById('error-message');
  
  if (loading) loading.style.display = 'block';
  if (videoList) videoList.style.display = 'none';
  if (noVideos) noVideos.style.display = 'none';
  if (errorMsg) errorMsg.style.display = 'none';
}

function showNoVideos() {
  const loading = document.getElementById('loading');
  const videoList = document.getElementById('video-list');
  const noVideos = document.getElementById('no-videos');
  const errorMsg = document.getElementById('error-message');
  
  if (loading) loading.style.display = 'none';
  if (videoList) videoList.style.display = 'none';
  if (noVideos) noVideos.style.display = 'block';
  if (errorMsg) errorMsg.style.display = 'none';
}

function showError(message) {
  const loading = document.getElementById('loading');
  const videoList = document.getElementById('video-list');
  const noVideos = document.getElementById('no-videos');
  const errorMsg = document.getElementById('error-message');
  
  if (loading) loading.style.display = 'none';
  if (videoList) videoList.style.display = 'none';
  if (noVideos) noVideos.style.display = 'none';
  if (errorMsg) {
    errorMsg.style.display = 'block';
    const p = errorMsg.querySelector('p');
    if (p) p.textContent = message;
  }
}

function displayVideos(videos, tabId) {
  const loading = document.getElementById('loading');
  const videoList = document.getElementById('video-list');
  const noVideos = document.getElementById('no-videos');
  const errorMsg = document.getElementById('error-message');
  
  if (loading) loading.style.display = 'none';
  if (noVideos) noVideos.style.display = 'none';
  if (errorMsg) errorMsg.style.display = 'none';
  
  if (videoList) {
    videoList.style.display = 'block';
    videoList.innerHTML = '';

    videos.forEach(video => {
      const videoItem = createVideoItem(video, tabId);
      videoList.appendChild(videoItem);
    });
  }
}

function createVideoItem(video, tabId) {
  const item = document.createElement('div');
  item.className = 'video-item';
  
  let duration = 'Unknown';
  if (video.duration && video.duration !== Infinity && video.duration > 0) {
    duration = formatDuration(video.duration);
  }
  
  let resolution = 'Unknown';
  if (video.width > 0 && video.height > 0) {
    resolution = `${Math.round(video.width)}x${Math.round(video.height)}`;
  }
  
  item.innerHTML = `
    <div class="video-item-header">
      <div class="video-icon">🎬</div>
      <div class="video-info">
        <div class="video-source">
          <span class="badge">Video ${video.index + 1}</span>
          ${duration !== 'Unknown' ? `<span class="badge">${duration}</span>` : ''}
          ${resolution !== 'Unknown' ? `<span class="badge">${resolution}</span>` : ''}
        </div>
      </div>
    </div>
    <button class="analyze-btn" data-video-id="${video.id}" data-video-index="${video.index}">
      🔍 Analyze for Deepfakes
    </button>
  `;

  const button = item.querySelector('.analyze-btn');
  button.addEventListener('click', () => analyzeVideo(video, tabId));

  return item;
}

function formatDuration(seconds) {
  if (!seconds || seconds === Infinity) return 'Unknown';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function analyzeVideo(video, tabId) {
  const button = document.querySelector(`[data-video-id="${video.id}"]`);
  
  try {
    if (button) {
      button.innerHTML = '⏳ Extracting frames...';
      button.disabled = true;
    }

    console.log('🎬 Starting extraction for video:', video.index);

    // Extract frames with timeout
    const extractPromise = chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: extractFramesFromVideo,
      args: [video.index]
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Frame extraction timeout')), 30000)
    );

    const [result] = await Promise.race([extractPromise, timeoutPromise]);

    if (result.result.success) {
      const { frames, videoInfo } = result.result;
      
      console.log('✅ Extracted frames:', frames.length);
      console.log('📊 Video info:', videoInfo);
      
      // ⚠️ CRITICAL FIX: Use chrome.storage.local instead of sessionStorage
      const storageData = {
        frames: frames,
        videoInfo: videoInfo,
        videoId: video.id,
        timestamp: Date.now()
      };
      
      console.log('💾 Storing frames in chrome.storage.local...');
      
      // Store in chrome.storage.local (shared across extension contexts)
      await chrome.storage.local.set({ 
        pendingFrames: storageData 
      });
      
      console.log('✅ Frames stored successfully');
      
      // Verify storage immediately
      chrome.storage.local.get('pendingFrames', (verifyResult) => {
        console.log('🔍 Verification - data in storage:', verifyResult);
        console.log('🔍 Frame count:', verifyResult.pendingFrames?.frames?.length);
      });
      
      // Also send to background script (optional, for redundancy)
      try {
        await chrome.runtime.sendMessage({
          type: 'STORE_VIDEO_FRAMES',
          videoId: video.id,
          frames: frames,
          videoInfo: videoInfo
        });
        console.log('✅ Frames also sent to background');
      } catch (bgError) {
        console.warn('⚠️ Background message failed (non-critical):', bgError);
      }

      // Open React app with videoId
      const analysisUrl = `${REACT_APP_URL}?videoId=${encodeURIComponent(video.id)}`;
      console.log('🚀 Opening React app:', analysisUrl);
      
      await chrome.tabs.create({ url: analysisUrl });
      
      // Close popup
      window.close();
    } else {
      throw new Error(result.result.error || 'Frame extraction failed');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Failed to extract frames: ' + error.message + '\n\nTips:\n- Make sure video is playing\n- Try playing it for a few seconds first\n- Some videos cannot be analyzed due to DRM');
    
    if (button) {
      button.innerHTML = '🔍 Analyze for Deepfakes';
      button.disabled = false;
    }
  }
}

// Simplified frame extraction
function extractFramesFromVideo(videoIndex) {
  return new Promise(async (resolve) => {
    try {
      const videos = document.querySelectorAll('video');
      const video = videos[videoIndex];

      if (!video) {
        return resolve({ success: false, error: 'Video not found' });
      }

      console.log('Extracting from video:', {
        duration: video.duration,
        readyState: video.readyState,
        paused: video.paused
      });

      // Pause video
      const wasPlaying = !video.paused;
      video.pause();

      // Wait for metadata if needed
      if (video.readyState < 2) {
        await new Promise((res, rej) => {
          const timeout = setTimeout(() => rej(new Error('Video load timeout')), 8000);
          video.addEventListener('loadeddata', () => {
            clearTimeout(timeout);
            res();
          }, { once: true });
          if (video.readyState === 0) video.load();
        });
      }

      let duration = video.duration;
      
      // Handle problematic durations
      if (!duration || duration === Infinity || duration < 1) {
        if (video.currentTime > 0) {
          duration = video.currentTime + 5; // Use current position
        } else {
          return resolve({ success: false, error: 'Cannot determine video duration. Try playing the video first.' });
        }
      }

      // Extract 5 frames
      const frames = [];
      const timestamps = [0.2, 0.35, 0.5, 0.65, 0.8].map(t => t * duration);

      for (let i = 0; i < timestamps.length; i++) {
        const time = Math.min(timestamps[i], duration - 0.5);
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return resolve({ success: false, error: 'Canvas error' });
        }

        // Seek and capture
        await new Promise((res, rej) => {
          const timeout = setTimeout(() => rej(new Error('Seek timeout')), 5000);
          
          video.addEventListener('seeked', () => {
            clearTimeout(timeout);
            try {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
              frames.push(base64);
              res();
            } catch (e) {
              rej(e);
            }
          }, { once: true });
          
          video.currentTime = time;
        });
      }

      // Resume if was playing
      if (wasPlaying) video.play();

      resolve({ 
        success: true, 
        frames: frames, 
        videoInfo: {
          source: window.location.hostname,
          duration: duration,
          width: video.videoWidth,
          height: video.videoHeight
        }
      });
    } catch (error) {
      console.error('Extraction error:', error);
      resolve({ success: false, error: error.message });
    }
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  findVideosOnPage();
  
  // Retry buttons
  const retryBtn = document.getElementById('retry-btn');
  const retryBtnError = document.getElementById('retry-btn-error');
  
  if (retryBtn) {
    retryBtn.addEventListener('click', findVideosOnPage);
  }
  if (retryBtnError) {
    retryBtnError.addEventListener('click', findVideosOnPage);
  }
});