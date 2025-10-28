// Content script that acts as a bridge between the page and extension
console.log('🔧 AI News Detector content script loaded');
console.log('📍 Current page:', window.location.href);
console.log('🌐 Origin:', window.location.origin);

// Configuration - CHANGE THIS to match your React app port
const REACT_APP_URL = 'http://localhost:3001';

console.log('✅ Expected origin:', REACT_APP_URL);

// Check if we're on the React app page
const isReactApp = window.location.origin === REACT_APP_URL;
console.log('🎯 Is React app page?', isReactApp);

if (isReactApp) {
    console.log('✅ Content script ACTIVE on React app');
    
    // Listen for messages from the React app
    window.addEventListener('message', async (event) => {
        console.log('📨 Message received:', event.data);
        console.log('📨 Message origin:', event.origin);
        console.log('📨 Expected origin:', REACT_APP_URL);
        
        // Only accept messages from our localhost app
        if (event.origin !== REACT_APP_URL) {
            console.log('❌ Ignoring message from wrong origin');
            return;
        }

        console.log('✅ Message origin matches!');

        if (event.data.type === 'GET_NEWS_DATA') {
            const newsId = event.data.newsId;
            console.log('📰 Getting news data for ID:', newsId);

            try {
                // Get news content from chrome storage
                chrome.storage.local.get([newsId], (result) => {
                    console.log('📦 Storage result:', result);

                    if (chrome.runtime.lastError) {
                        console.error('❌ Storage error:', chrome.runtime.lastError);
                        window.postMessage({
                            type: 'NEWS_DATA_ERROR',
                            newsId: newsId,
                            error: chrome.runtime.lastError.message
                        }, REACT_APP_URL);
                        return;
                    }

                    const newsContent = result[newsId];

                    if (newsContent) {
                        console.log('✅ Found news data, length:', newsContent.length);
                        console.log('📤 Sending NEWS_DATA_RESPONSE to app...');
                        
                        window.postMessage({
                            type: 'NEWS_DATA_RESPONSE',
                            newsId: newsId,
                            newsContent: newsContent
                        }, REACT_APP_URL);

                        console.log('✅ Response sent!');

                        // Clean up storage after sending
                        chrome.storage.local.remove([newsId], () => {
                            console.log('🧹 Cleaned up storage for ID:', newsId);
                        });
                    } else {
                        console.error('❌ News data not found in storage for ID:', newsId);
                        
                        // Debug: List all keys in storage
                        chrome.storage.local.get(null, (allData) => {
                            console.log('📦 All storage keys:', Object.keys(allData));
                            console.log('📦 All storage data:', allData);
                        });

                        window.postMessage({
                            type: 'NEWS_DATA_ERROR',
                            newsId: newsId,
                            error: 'News data not found in storage. Available keys: ' + Object.keys(result).join(', ')
                        }, REACT_APP_URL);
                    }
                });
            } catch (error) {
                console.error('❌ Content script error:', error);
                window.postMessage({
                    type: 'NEWS_DATA_ERROR',
                    newsId: newsId,
                    error: error.message
                }, REACT_APP_URL);
            }
        }
    });

    console.log('✅ Message listener registered and ready!');
    
    // Send ready signal
    setTimeout(() => {
        console.log('📢 Sending CONTENT_SCRIPT_READY signal...');
        window.postMessage({ 
            type: 'CONTENT_SCRIPT_READY',
            timestamp: Date.now()
        }, REACT_APP_URL);
    }, 100);
    
} else {
    console.log('ℹ️ Content script: Not on React app page, listening for context menu only');
    console.log('ℹ️ To enable extension features, open:', REACT_APP_URL);
}

// Context menu integration (right-click to analyze) - works on all pages
document.addEventListener('mouseup', () => {
    const selectedText = window.getSelection().toString().trim();
    
    if (selectedText.length > 50) {
        // Store selection for context menu
        chrome.storage.local.set({ 'lastSelection': selectedText }, () => {
            if (chrome.runtime.lastError) {
                console.log('Could not store selection:', chrome.runtime.lastError);
            } else {
                console.log('✅ Stored last selection, length:', selectedText.length);
            }
        });
    }
});

console.log('✅ Content script initialization complete');