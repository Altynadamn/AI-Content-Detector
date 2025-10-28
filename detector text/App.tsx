import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import ResultDisplay from './components/ResultDisplay';
import Loader from './components/Loader';
import { getNewsAnalysis } from './services/geminiService';
import type { AnalysisResult } from './types';

const App: React.FC = () => {
    const [newsText, setNewsText] = useState<string>('');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isExtensionMode, setIsExtensionMode] = useState<boolean>(false);

    // Configuration - CHANGE THIS to match your React app port
    const REACT_APP_URL = 'http://localhost:3001';

    // Handle news text from query params (for browser extension integration)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const newsContent = params.get('newsContent');
        const newsId = params.get('newsId');

        console.log('App loaded with params:', { newsContent: !!newsContent, newsId });

        if (newsId) {
            // Request news data from extension via content script
            console.log('Extension mode: Requesting news data for ID:', newsId);
            setIsExtensionMode(true);
            setIsLoading(true);

            let messageReceived = false;

            // Listen for response from content script
            const messageHandler = (event: MessageEvent) => {
                console.log('App received message:', event.data);
                
                if (event.origin !== 'http://localhost:3001') {
                    console.log('Ignoring message from wrong origin:', event.origin);
                    return;
                }

                if (event.data.type === 'NEWS_DATA_RESPONSE' && event.data.newsId === newsId) {
                    console.log('Received news data from extension, length:', event.data.newsContent?.length);
                    window.removeEventListener('message', messageHandler);
                    messageReceived = true;

                    const content = event.data.newsContent;
                    setNewsText(content);

                    // Analyze the news
                    console.log('Starting analysis...');
                    getNewsAnalysis(content)
                        .then(result => {
                            setAnalysisResult(result);
                            console.log('Analysis complete:', result);
                        })
                        .catch(err => {
                            console.error('Analysis error:', err);
                            setError('Analysis failed: ' + err.message);
                        })
                        .finally(() => {
                            setIsLoading(false);
                        });
                } else if (event.data.type === 'NEWS_DATA_ERROR' && event.data.newsId === newsId) {
                    console.error('Error getting news data:', event.data.error);
                    window.removeEventListener('message', messageHandler);
                    messageReceived = true;
                    setError('Failed to load news data from extension: ' + event.data.error);
                    setIsLoading(false);
                }
            };

            window.addEventListener('message', messageHandler);
            console.log('Message listener registered, sending GET_NEWS_DATA request...');

            // Request the news data
            window.postMessage({ type: 'GET_NEWS_DATA', newsId: newsId }, 'http://localhost:3001');

            // Timeout after 10 seconds
            setTimeout(() => {
                if (!messageReceived) {
                    console.error('Timeout: No response from content script');
                    window.removeEventListener('message', messageHandler);
                    setError('Timeout: Failed to load news data. Make sure the extension is installed and enabled.');
                    setIsLoading(false);
                }
            }, 10000);

            return;
        }

        if (newsContent) {
            // Direct news content provided via URL param
            console.log('Extension mode activated with direct content');
            setIsExtensionMode(true);
            setIsLoading(true);

            try {
                const decodedContent = decodeURIComponent(newsContent);
                setNewsText(decodedContent);

                // Analyze the news
                getNewsAnalysis(decodedContent)
                    .then(result => {
                        setAnalysisResult(result);
                        console.log('Analysis complete:', result);
                    })
                    .catch(err => {
                        console.error('Analysis error:', err);
                        setError('Analysis failed: ' + err.message);
                    })
                    .finally(() => {
                        setIsLoading(false);
                    });
            } catch (err) {
                console.error('Decoding error:', err);
                setError('Failed to decode news content');
                setIsLoading(false);
            }
        }
    }, []);

    const handleAnalysis = useCallback(async () => {
        if (!newsText.trim()) {
            setError('Please paste some news article text to analyze.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const result = await getNewsAnalysis(newsText);
            setAnalysisResult(result);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [newsText]);

    const handleClear = () => {
        setNewsText('');
        setAnalysisResult(null);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 md:p-8">
            <div className="max-w-3xl mx-auto">
                {!isExtensionMode && <Header />}

                {isExtensionMode && (
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-blue-400">🔍 AI News Detector</h2>
                        <p className="text-gray-400 mt-2">Analyzing news article from web...</p>
                    </div>
                )}

                <main className="mt-8">
                    {!isExtensionMode && (
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                            <label htmlFor="news-input" className="block text-lg font-medium text-gray-300">
                                Paste News Article
                            </label>
                            <textarea
                                id="news-input"
                                value={newsText}
                                onChange={(e) => setNewsText(e.target.value)}
                                placeholder="Enter the full text of the news article here..."
                                className="mt-2 w-full h-64 p-3 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-gray-200 resize-y"
                                disabled={isLoading}
                            />
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={handleAnalysis}
                                    disabled={isLoading || !newsText.trim()}
                                    className="flex-1 flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    {isLoading ? 'Analyzing...' : 'Verify News'}
                                </button>
                                {newsText && (
                                    <button
                                        onClick={handleClear}
                                        disabled={isLoading}
                                        className="px-6 py-3 border border-gray-600 text-base font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {isExtensionMode && newsText && (
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 mb-6">
                            <h3 className="text-lg font-medium text-gray-300 mb-2">Analyzed Article:</h3>
                            <div className="max-h-48 overflow-y-auto p-3 bg-gray-900 rounded text-sm text-gray-400">
                                {newsText}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
                            <p><span className="font-bold">Error:</span> {error}</p>
                        </div>
                    )}
                    
                    {isLoading && <Loader />}
                    
                    {analysisResult && !isLoading && <ResultDisplay result={analysisResult} />}
                </main>
                
                <footer className="text-center mt-12 py-4 text-gray-500">
                </footer>
            </div>
        </div>
    );
};

export default App;