import React from 'react';

import type { AnalysisResult } from '../types';
import { Classification } from '../types';

interface ResultDisplayProps {
    result: AnalysisResult;
}

const classificationConfig = {
    [Classification.REAL]: {
        label: 'Likely Real',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-400/30',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    },
    [Classification.FAKE]: {
        label: 'Likely Fake',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-400/30',
        icon: (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    },
    [Classification.UNCERTAIN]: {
        label: 'Uncertain',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-400/30',
        icon: (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    },
};

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
    const config = classificationConfig[result.classification];

    return (
        <div className="mt-8 p-6 bg-gray-800 border border-gray-700 rounded-lg shadow-lg animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Analysis Result</h2>

            <div className={`flex items-center p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
                <div className={`${config.color}`}>{config.icon}</div>
                <div className="ml-4">
                    <p className={`text-xl font-semibold ${config.color}`}>{config.label}</p>
                    <p className="text-gray-400">Confidence: {result.confidence}%</p>
                </div>
            </div>
            
            <div className="mt-6 space-y-4">
                <div>
                    <h3 className="font-semibold text-lg text-blue-300">Reasoning</h3>
                    <p className="text-gray-300 mt-1">{result.reasoning}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-lg text-teal-300">AI Generation Analysis</h3>
                    <p className={`font-medium ${result.isGenerated ? 'text-red-400' : 'text-green-400'}`}>
                        {result.isGenerated ? 'Likely AI-Generated' : 'Likely Human-Written'}
                    </p>
                    <p className="text-gray-300 mt-1">{result.generationAnalysis}</p>
                </div>
            </div>
        </div>
    );
};

export default ResultDisplay;
