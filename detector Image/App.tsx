import React, { useState, useCallback, useEffect } from 'react';
import { ImageFile, AnalysisResult } from './types';
import { analyzeImageBatch } from './services/geminiService';
import { FileUpload } from './components/FileUpload';
import { ImageCard } from './components/ImageCard';
import { Header } from './components/Header';
import { ActionButtons } from './components/ActionButtons';

const MAX_FILES = 20;

const App: React.FC = () => {
    const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isExtensionMode, setIsExtensionMode] = useState(false);

    // Handle imageUrl from query params (for browser extension integration)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const imageId = params.get('imageId'); // New: Get imageId instead
        const imageUrl = params.get('imageUrl');
        const imageData = params.get('imageData'); // base64 data from extension

        if (imageId) {
            // Request image data from extension via content script
            console.log('Extension mode: Requesting image data for ID:', imageId);
            setIsExtensionMode(true);
            setIsAnalyzing(true);

            // Listen for response from content script
            const messageHandler = (event: MessageEvent) => {
                if (event.origin !== 'http://localhost:3000') return;

                if (event.data.type === 'IMAGE_DATA_RESPONSE' && event.data.imageId === imageId) {
                    console.log('Received image data from extension');
                    window.removeEventListener('message', messageHandler);

                    const imageData = event.data.imageData;

                    // Convert base64 to blob
                    fetch(imageData)
                        .then(res => res.blob())
                        .then(blob => {
                            const file = new File([blob], 'image.jpg', { type: blob.type });
                            const newImageFile: ImageFile = {
                                id: `ext-${Date.now()}`,
                                file,
                                previewUrl: URL.createObjectURL(blob),
                                status: 'analyzing',
                            };

                            setImageFiles([newImageFile]);

                            return analyzeImageBatch([newImageFile]);
                        })
                        .then(results => {
                            const result = results[0];
                            setImageFiles(prev =>
                                prev.map(f => {
                                    if (f.id === result.id) {
                                        if ("error" in result) {
                                            return { ...f, status: 'error', error: result.error };
                                        } else {
                                            return { ...f, status: 'completed', result: result.data };
                                        }
                                    }
                                    return f;
                                })
                            );
                            console.log('Analysis complete:', result);
                        })
                        .catch(err => {
                            console.error('Analysis error:', err);
                            setError('Analysis failed: ' + err.message);
                        })
                        .finally(() => {
                            setIsAnalyzing(false);
                        });
                } else if (event.data.type === 'IMAGE_DATA_ERROR' && event.data.imageId === imageId) {
                    console.error('Error getting image data:', event.data.error);
                    window.removeEventListener('message', messageHandler);
                    setError('Failed to load image data from extension');
                    setIsAnalyzing(false);
                }
            };

            window.addEventListener('message', messageHandler);

            // Request the image data
            window.postMessage({ type: 'GET_IMAGE_DATA', imageId: imageId }, 'http://localhost:3000');

            // Timeout after 10 seconds
            setTimeout(() => {
                window.removeEventListener('message', messageHandler);
                if (isAnalyzing) {
                    setError('Timeout: Failed to load image data');
                    setIsAnalyzing(false);
                }
            }, 10000);

            return; // Don't process other params
        }

        if (imageData) {
            // Image data provided as base64 (bypasses CORS!)
            console.log('Extension mode activated with base64 data');
            setIsExtensionMode(true);
            setIsAnalyzing(true);

            // Convert base64 to blob
            fetch(imageData)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], 'image.jpg', { type: blob.type });
                    const newImageFile: ImageFile = {
                        id: `data-${Date.now()}`,
                        file,
                        previewUrl: URL.createObjectURL(blob),
                        status: 'analyzing',
                    };

                    setImageFiles([newImageFile]);

                    return analyzeImageBatch([newImageFile]);
                })
                .then(results => {
                    const result = results[0];
                    setImageFiles(prev =>
                        prev.map(f => {
                            if (f.id === result.id) {
                                if ("error" in result) {
                                    return { ...f, status: 'error', error: result.error };
                                } else {
                                    return { ...f, status: 'completed', result: result.data };
                                }
                            }
                            return f;
                        })
                    );
                    console.log('Analysis complete:', result);
                })
                .catch(err => {
                    console.error('Analysis error:', err);
                    setError('Analysis failed: ' + err.message);
                })
                .finally(() => {
                    setIsAnalyzing(false);
                });

            return; // Don't process imageUrl if we have imageData
        }

        if (imageUrl) {
            console.log('Extension mode activated with URL:', imageUrl);
            setIsExtensionMode(true);
            setIsAnalyzing(true);

            // Create image element to load the image (handles CORS better)
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                console.log('Image loaded successfully');

                // Convert to blob via canvas
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        setError('Failed to process image');
                        setIsAnalyzing(false);
                        return;
                    }

                    const file = new File([blob], 'image.jpg', { type: blob.type });
                    const newImageFile: ImageFile = {
                        id: `url-${Date.now()}`,
                        file,
                        previewUrl: URL.createObjectURL(blob),
                        status: 'analyzing',
                    };

                    setImageFiles([newImageFile]);

                    // Analyze the image
                    analyzeImageBatch([newImageFile])
                        .then(results => {
                            const result = results[0];
                            setImageFiles(prev =>
                                prev.map(f => {
                                    if (f.id === result.id) {
                                        if ("error" in result) {
                                            return { ...f, status: 'error', error: result.error };
                                        } else {
                                            return { ...f, status: 'completed', result: result.data };
                                        }
                                    }
                                    return f;
                                })
                            );
                            console.log('Analysis complete:', result);
                        })
                        .catch(err => {
                            console.error('Analysis error:', err);
                            setError('Analysis failed: ' + err.message);
                        })
                        .finally(() => {
                            setIsAnalyzing(false);
                        });
                }, 'image/jpeg');
            };

            img.onerror = () => {
                console.error('Failed to load image - CORS blocked');
                setError('Failed to load image. This website blocks loading images from other sites (CORS policy).');
                setIsAnalyzing(false);
            };

            img.src = imageUrl;
        }
    }, []);

    const handleFilesChange = (files: FileList | null) => {
        setError(null);
        if (!files) return;

        if (files.length + imageFiles.length > MAX_FILES) {
            setError(`You can only upload a maximum of ${MAX_FILES} images in total.`);
            return;
        }

        const newImageFiles: ImageFile[] = Array.from(files).map(file => ({
            id: `${file.name}-${file.lastModified}-${Math.random()}`,
            file,
            previewUrl: URL.createObjectURL(file),
            status: 'pending',
        }));

        setImageFiles(prev => [...prev, ...newImageFiles]);
    };

    const handleAnalyze = useCallback(async () => {
        const filesToAnalyze = imageFiles.filter(f => f.status === 'pending');
        if (filesToAnalyze.length === 0) return;

        setIsAnalyzing(true);
        setImageFiles(prev =>
            prev.map(f => (f.status === 'pending' ? { ...f, status: 'analyzing' } : f))
        );

        try {
            const results = await analyzeImageBatch(filesToAnalyze);
            setImageFiles(prev =>
                prev.map(file => {
                    const result = results.find(r => r.id === file.id);
                    if (result) {
                        if ("error" in result) {
                            return { ...file, status: 'error', error: result.error };
                        } else {
                            return { ...file, status: 'completed', result: result.data };
                        }
                    }
                    return file;
                })
            );
        } catch (err) {
            setError('An unexpected error occurred during analysis. Please try again.');
            setImageFiles(prev =>
                prev.map(f =>
                    f.status === 'analyzing' ? { ...f, status: 'pending', error: 'Analysis failed' } : f
                )
            );
        } finally {
            setIsAnalyzing(false);
        }
    }, [imageFiles]);

    const handleClear = () => {
        imageFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
        setImageFiles([]);
        setError(null);
        setIsAnalyzing(false);
    };

    const handleRemoveImage = (id: string) => {
        setImageFiles(prev => {
            const imageToRemove = prev.find(f => f.id === id);
            if (imageToRemove) {
                URL.revokeObjectURL(imageToRemove.previewUrl);
            }
            return prev.filter(f => f.id !== id);
        });
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
            <main className="container mx-auto px-4 py-8">
                {!isExtensionMode && <Header />}

                {isExtensionMode && (
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-blue-400">🔍 AI Image Detector</h2>
                        <p className="text-gray-400 mt-2">Analyzing image from web...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative my-4 text-center" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {imageFiles.length === 0 && !isExtensionMode && (
                    <FileUpload onFilesChange={handleFilesChange} maxFiles={MAX_FILES} />
                )}

                {imageFiles.length > 0 && (
                    <>
                        {!isExtensionMode && (
                            <ActionButtons
                                onAnalyze={handleAnalyze}
                                onClear={handleClear}
                                isAnalyzing={isAnalyzing}
                                pendingCount={imageFiles.filter(f => f.status === 'pending').length}
                            />
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-8">
                            {imageFiles.map(imageFile => (
                                <ImageCard
                                    key={imageFile.id}
                                    imageFile={imageFile}
                                    onRemove={isExtensionMode ? undefined : handleRemoveImage}
                                />
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default App;