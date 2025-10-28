// Background service worker for the extension
const BACKEND_URL = 'http://localhost:3001';

console.log('AI News Detector background script loaded');

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('AI News Detector extension installed');

    try {
        // Create context menu for selected text
        chrome.contextMenus.create({
            id: 'analyzeNewsText',
            title: 'Analyze with AI News Detector',
            contexts: ['selection']
        }, () => {
            if (chrome.runtime.lastError) {
                console.log('Context menu error:', chrome.runtime.lastError.message);
            } else {
                console.log('Context menu created successfully');
            }
        });
    } catch (error) {
        console.log('Could not create context menu:', error);
    }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log('Context menu clicked:', info);
    
    if (info.menuItemId === 'analyzeNewsText') {
        const selectedText = info.selectionText;

        if (selectedText && selectedText.length > 50) {
            console.log('Selected text length:', selectedText.length);
            
            // Store the text and open dashboard
            const newsId = Date.now().toString();
            
            chrome.storage.local.set({ [newsId]: selectedText }, () => {
                console.log('Stored news with ID:', newsId);
                const dashboardUrl = `${BACKEND_URL}?newsId=${newsId}`;
                console.log('Opening:', dashboardUrl);
                chrome.tabs.create({ url: dashboardUrl });
            });
        } else {
            console.log('Text too short:', selectedText?.length);
            // Show notification if text is too short
            try {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'AI News Detector',
                    message: 'Please select at least 50 characters of text to analyze.'
                });
            } catch (error) {
                console.log('Could not show notification:', error);
            }
        }
    }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);

    if (request.action === 'analyzeNews') {
        const newsContent = request.newsContent;
        const newsId = Date.now().toString();
        
        console.log('Analyzing news, length:', newsContent?.length);
        
        // Store news content
        chrome.storage.local.set({ [newsId]: newsContent }, () => {
            console.log('Stored news with ID:', newsId);
            // Open dashboard
            const dashboardUrl = `${BACKEND_URL}?newsId=${newsId}`;
            console.log('Opening:', dashboardUrl);
            chrome.tabs.create({ url: dashboardUrl });
            sendResponse({ success: true });
        });

        return true; // Keep message channel open for async response
    }

    return false;
});

console.log('Background script initialized successfully');