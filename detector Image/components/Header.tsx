
import React from 'react';

export const Header: React.FC = () => (
    <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
            AI Image Detector
        </h1>
        <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Upload your images to determine if they were created by an AI or a human. 
            Powered by Gemini.
        </p>
    </header>
);
