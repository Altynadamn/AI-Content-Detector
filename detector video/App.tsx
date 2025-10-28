import React, { useState, useRef, useCallback, useEffect } from 'react';
import { analyzeVideoFrames } from './services/geminiService';
import type { AnalysisResult } from './types';
import VideoUploader from './components/VideoUploader';
import ResultDisplay from './components/ResultDisplay';
import Loader from './components/Loader';

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isExtensionMode, setIsExtensionMode] = useState<boolean>(false);
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle video frames from extension
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('videoId');

    console.log('App loaded with params:', { videoId });

    if (videoId) {
      console.log('Extension mode: Loading video frames from storage');
      setIsExtensionMode(true);
      setIsLoading(true);

      let timeoutId: NodeJS.Timeout;
      let receivedFrames = false;

      // Listen for messages from content script
      const messageHandler = (event: MessageEvent) => {
        // Only accept messages from our origin
        if (event.origin !== window.location.origin) {
          return;
        }

        console.log('📨 React app received message:', event.data);

        if (event.data.type === 'FRAMES_DATA' && event.data.videoId === videoId) {
          const { frames, videoInfo } = event.data;
          
          receivedFrames = true;
          clearTimeout(timeoutId); // Clear timeout on success
          
          console.log('✅ Received frames from content script:', frames.length);
          setVideoInfo(videoInfo);
          setIsLoading(true);
          
          // Analyze the frames
          console.log('🚀 Starting analysis...');
          analyzeVideoFrames(frames)
            .then(analysisResult => {
              setResult(analysisResult);
              console.log('✅ Analysis complete:', analysisResult);
            })
            .catch(err => {
              console.error('❌ Analysis error:', err);
              setError('Analysis failed: ' + err.message);
            })
            .finally(() => {
              setIsLoading(false);
            });
        } else if (event.data.type === 'FRAMES_ERROR' && event.data.videoId === videoId) {
          clearTimeout(timeoutId); // Clear timeout on error too
          console.error('❌ Error from content script:', event.data.error);
          setError(event.data.error);
          setIsLoading(false);
        }
      };

      window.addEventListener('message', messageHandler);

      // Request frames from content script
      console.log('📤 Requesting frames from content script...');
      window.postMessage({
        type: 'REQUEST_FRAMES',
        videoId: videoId
      }, window.location.origin);

      // Timeout after 10 seconds
      timeoutId = setTimeout(() => {
        if (!receivedFrames) {
          console.error('❌ Timeout waiting for frames');
          setError('Timeout: Failed to receive video data. Please try again.');
          setIsLoading(false);
        }
      }, 10000);

      return () => {
        window.removeEventListener('message', messageHandler);
        clearTimeout(timeoutId);
      };
    }
  }, []);

  const handleVideoSelect = (file: File) => {
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setResult(null);
    setError(null);
  };

  const resetState = () => {
    if (videoUrl && videoFile) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoFile(null);
    setVideoUrl(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
  };

  const extractFrame = useCallback((video: HTMLVideoElement, time: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const onSeeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error("Could not get canvas context"));
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
          video.removeEventListener('seeked', onSeeked);
          resolve(base64);
        } catch(e) {
          reject(e);
        }
      };
      video.addEventListener('seeked', onSeeked, { once: true });
      video.currentTime = time;
    });
  }, []);

  const handleAnalyze = async () => {
    if (!videoRef.current) {
      setError("Video element not found.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const video = videoRef.current;
      await new Promise<void>(resolve => {
        if (video.readyState >= 1) {
          resolve();
        } else {
          video.onloadedmetadata = () => resolve();
        }
      });

      const duration = video.duration;
      const timestamps = [duration * 0.1, duration * 0.3, duration * 0.5, duration * 0.7, duration * 0.9];
      
      const framePromises = timestamps.map(time => extractFrame(video, time));
      const base64Frames = await Promise.all(framePromises);
      
      const analysisResult = await analyzeVideoFrames(base64Frames);
      setResult(analysisResult);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "An unknown error occurred during analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-950 min-h-screen text-gray-100 flex flex-col items-center p-4 selection:bg-purple-500/30 relative">
      {/* Subtle background gradient - much less intense */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-950/20 via-gray-950 to-cyan-950/20 pointer-events-none"></div>
      
      <div className="relative z-10 w-full flex flex-col items-center">
        {!isExtensionMode && (
          <header className="text-center my-8 md:my-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-purple-300 to-cyan-400 drop-shadow-lg">
              Deepfake Detector AI
            </h1>
            <p className="text-gray-300 mt-4 max-w-2xl text-lg">
              Is it real or AI? Upload a video to uncover the truth with deepfake analysis.
            </p>
          </header>
        )}

        {isExtensionMode && (
          <header className="text-center my-8">
            <h1 className="text-3xl md:text-4xl font-bold text-purple-400 drop-shadow-lg">🎥 Deepfake Detector AI</h1>
            <p className="text-gray-300 mt-2 text-lg">Analyzing video from web...</p>
            {videoInfo && (
              <div className="mt-4 text-sm text-gray-400 bg-gray-900/50 rounded-lg p-3 backdrop-blur-sm border border-gray-800">
                <p><span className="font-semibold text-gray-300">Source:</span> {videoInfo.source}</p>
                {videoInfo.duration && <p><span className="font-semibold text-gray-300">Duration:</span> {formatDuration(videoInfo.duration)}</p>}
              </div>
            )}
          </header>
        )}

        <main className="w-full max-w-2xl flex-grow flex flex-col items-center">
          {!videoUrl && !isExtensionMode ? (
            <VideoUploader onVideoSelect={handleVideoSelect} />
          ) : videoUrl ? (
            <div className="w-full bg-gray-900/80 rounded-lg p-4 backdrop-blur-sm border border-gray-700 shadow-2xl">
              <video 
                ref={videoRef} 
                src={videoUrl} 
                controls 
                className="w-full rounded-md shadow-lg" 
                id="video-preview" 
                preload="metadata"
              ></video>
              <div className="mt-4 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="flex-1 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Video'}
                </button>
                <button
                  onClick={resetState}
                  disabled={isLoading}
                  className="flex-1 w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-md transition-all duration-300 shadow-lg"
                >
                  Choose Another Video
                </button>
              </div>
            </div>
          ) : null}
          
          <div className="w-full mt-8">
            {isLoading && <Loader />}
            {error && (
              <div className="text-center p-4 bg-red-900/80 border-2 border-red-600 text-red-100 rounded-lg shadow-xl backdrop-blur-sm">
                <p className="font-bold mb-2 text-lg">⚠️ Error</p>
                <p className="text-red-200">{error}</p>
              </div>
            )}
            {result && !isLoading && <ResultDisplay result={result} />}
          </div>
        </main>
        
        <footer className="text-center p-4 text-gray-500 text-sm mt-8">
        </footer>
      </div>
    </div>
  );
};

export default App;