// Configuration for AI News Detector Extension
// CHANGE THIS to match your React app port

const CONFIG = {
    // Your React app URL - change port if needed
    REACT_APP_URL: 'http://localhost:3001',
    
    // Minimum text length for analysis
    MIN_TEXT_LENGTH: 50,
    MIN_ARTICLE_LENGTH: 100,
    
    // Timeout for loading news data (milliseconds)
    TIMEOUT_MS: 10000
};

// Make config available to other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}