const BACKEND_URL = 'http://localhost:3001';

console.log('Popup script loaded');

const analyzeBtn = document.getElementById('analyzeBtn');
const selectTextBtn = document.getElementById('selectTextBtn');
const openDashboardBtn = document.getElementById('openDashboardBtn');
const statusDiv = document.getElementById('status');
const statusText = document.getElementById('statusText');

function showStatus(message, type = 'loading') {
    statusDiv.style.display = 'block';
    statusDiv.className = `status ${type}`;
    
    if (type === 'loading') {
        statusText.innerHTML = `<div class="spinner"></div> ${message}`;
    } else {
        statusText.textContent = message;
    }
}

function hideStatus() {
    statusDiv.style.display = 'none';
}

// Analyze current page
analyzeBtn.addEventListener('click', async () => {
    try {
        console.log('Analyze button clicked');
        showStatus('Extracting article text...', 'loading');
        analyzeBtn.disabled = true;

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('Current tab:', tab.url);
        
        // Inject content script and extract article text
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractArticleText
        });

        const newsContent = results[0].result;
        console.log('Extracted text length:', newsContent?.length);

        if (!newsContent || newsContent.trim().length < 100) {
            showStatus('Could not find enough article text on this page. Try selecting text manually.', 'error');
            analyzeBtn.disabled = false;
            return;
        }

        showStatus('Opening analysis dashboard...', 'loading');

        // Open dashboard with news content
        const newsId = Date.now().toString();
        console.log('Creating news ID:', newsId);
        
        chrome.storage.local.set({ [newsId]: newsContent }, () => {
            console.log('News stored in chrome.storage with ID:', newsId);
            
            const dashboardUrl = `${BACKEND_URL}?newsId=${newsId}`;
            console.log('Opening URL:', dashboardUrl);
            
            chrome.tabs.create({ url: dashboardUrl }, (newTab) => {
                console.log('New tab created:', newTab.id);
            });
        });

        showStatus('Analysis started! Check the new tab.', 'success');
        
        setTimeout(() => {
            analyzeBtn.disabled = false;
            hideStatus();
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
        showStatus(`Error: ${error.message}`, 'error');
        analyzeBtn.disabled = false;
    }
});

// Analyze selected text
selectTextBtn.addEventListener('click', async () => {
    try {
        console.log('Select text button clicked');
        showStatus('Getting selected text...', 'loading');
        selectTextBtn.disabled = true;

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('Current tab:', tab.url);
        
        // Get selected text from page
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => window.getSelection().toString()
        });

        const selectedText = results[0].result;
        console.log('Selected text length:', selectedText?.length);

        if (!selectedText || selectedText.trim().length < 50) {
            showStatus('Please select some text on the page first (at least 50 characters).', 'error');
            selectTextBtn.disabled = false;
            return;
        }

        showStatus('Opening analysis dashboard...', 'loading');

        // Open dashboard with selected text
        const newsId = Date.now().toString();
        console.log('Creating news ID:', newsId);
        
        chrome.storage.local.set({ [newsId]: selectedText }, () => {
            console.log('Selected text stored with ID:', newsId);
            
            const dashboardUrl = `${BACKEND_URL}?newsId=${newsId}`;
            console.log('Opening URL:', dashboardUrl);
            
            chrome.tabs.create({ url: dashboardUrl }, (newTab) => {
                console.log('New tab created:', newTab.id);
            });
        });

        showStatus('Analysis started! Check the new tab.', 'success');
        
        setTimeout(() => {
            selectTextBtn.disabled = false;
            hideStatus();
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
        showStatus(`Error: ${error.message}`, 'error');
        selectTextBtn.disabled = false;
    }
});

// Open dashboard
openDashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: BACKEND_URL });
});

// Function to extract article text (injected into page)
function extractArticleText() {
    // Try common article selectors
    const selectors = [
        'article',
        '[role="article"]',
        '.article-content',
        '.post-content',
        '.entry-content',
        '.story-body',
        'main article',
        'main'
    ];

    let articleText = '';

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            articleText = element.innerText || element.textContent;
            if (articleText.length > 200) {
                break;
            }
        }
    }

    // Fallback: get all paragraphs
    if (articleText.length < 200) {
        const paragraphs = Array.from(document.querySelectorAll('p'))
            .map(p => p.innerText || p.textContent)
            .filter(text => text.length > 50);
        articleText = paragraphs.join('\n\n');
    }

    // Clean up the text
    articleText = articleText
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();

    return articleText;
}