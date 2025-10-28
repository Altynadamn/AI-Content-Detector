let currentImageElement = null;
let resultCallbacks = {};

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkImage") {
    checkImage(request.imageUrl);
  } else if (request.action === "showResult") {
    showResult(request);
  }
  return true;
});

async function checkImage(imageUrl) {
  try {
    // Send the image URL directly to background script
    chrome.runtime.sendMessage({
      action: "analyzeImageUrl",
      imageUrl: imageUrl
    });
    
    // Show loading immediately
    showResult({ status: "loading" });
    
  } catch (error) {
    console.error('Check image error:', error);
    showResult({
      status: "error",
      error: "Failed to process image: " + error.message
    });
  }
}

function showResult(data) {
  // Remove any existing result popup
  const existing = document.getElementById('ai-detector-popup');
  if (existing) {
    existing.remove();
  }

  // Create popup
  const popup = document.createElement('div');
  popup.id = 'ai-detector-popup';
  popup.className = 'ai-detector-popup';

  if (data.status === "loading") {
    popup.innerHTML = `
      <div class="ai-detector-content">
        <div class="ai-detector-spinner"></div>
        <p>Analyzing image...</p>
      </div>
    `;
  } else if (data.status === "success") {
    const isAI = data.result.isAI || data.result.is_ai || false;
    const confidence = data.result.confidence || data.result.score || 0;
    
    popup.innerHTML = `
      <div class="ai-detector-content">
        <div class="ai-detector-icon ${isAI ? 'ai' : 'real'}">
          ${isAI ? '🤖' : '📷'}
        </div>
        <h3>${isAI ? 'AI Generated' : 'Real Image'}</h3>
        <p class="confidence">Confidence: ${(confidence * 100).toFixed(1)}%</p>
        <button class="close-btn">Close</button>
      </div>
    `;
  } else if (data.status === "error") {
    popup.innerHTML = `
      <div class="ai-detector-content">
        <div class="ai-detector-icon error">⚠️</div>
        <h3>Error</h3>
        <p>${data.error || 'Failed to analyze image'}</p>
        <p class="hint">Make sure your app is running on localhost:3000</p>
        <button class="close-btn">Close</button>
      </div>
    `;
  }

  document.body.appendChild(popup);

  // Add close button functionality
  const closeBtn = popup.querySelector('.close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      popup.remove();
    });
  }

  // Auto-close after 5 seconds
  setTimeout(() => {
    if (popup.parentElement) {
      popup.classList.add('fade-out');
      setTimeout(() => popup.remove(), 300);
    }
  }, 5000);
}