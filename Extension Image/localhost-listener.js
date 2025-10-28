// This script runs on localhost:3000 to capture analysis results
console.log('Extension listener loaded on localhost:3000');

// Listen for the analysis result from React app
window.addEventListener('aiAnalysisResult', (event) => {
  console.log('Analysis result received:', event.detail);
  
  const { isAI, confidence, url, error } = event.detail;
  
  // Send message to background script
  chrome.runtime.sendMessage({
    action: "analysisComplete",
    result: {
      isAI,
      confidence: confidence || 0.95,
      url,
      error
    }
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message:', chrome.runtime.lastError);
    }
  });
  
  // Also try to communicate with opener window
  if (window.opener && !window.opener.closed) {
    try {
      window.opener.postMessage({
        type: 'AI_ANALYSIS_COMPLETE',
        data: { isAI, confidence: confidence || 0.95, url, error }
      }, '*');
    } catch (e) {
      console.error('Could not post to opener:', e);
    }
  }
});