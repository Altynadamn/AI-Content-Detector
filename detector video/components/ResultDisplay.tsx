
import React from 'react';
import type { AnalysisResult } from '../types';

interface ResultDisplayProps {
  result: AnalysisResult;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  const isFake = result.is_fake;
  const confidencePercent = (result.confidence * 100).toFixed(1);

  const resultColor = isFake ? 'red' : 'green';
  const resultText = isFake ? 'AI-Generated (Fake)' : 'Authentic (Real)';

  const VerdictIcon = () => (
    isFake ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  );

  return (
    <div className={`bg-${resultColor}-900/50 border border-${resultColor}-700 rounded-lg shadow-lg p-6 animate-fade-in`}>
      <div className="flex items-center gap-4">
        <div className={`text-${resultColor}-300`}>
          <VerdictIcon />
        </div>
        <div>
          <h2 className="text-sm uppercase tracking-widest text-gray-400">Verdict</h2>
          <p className={`text-2xl font-bold text-${resultColor}-300`}>{resultText}</p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm uppercase tracking-widest text-gray-400 mb-2">Confidence</h3>
        <div className="w-full bg-gray-700/50 rounded-full h-4">
          <div
            className={`bg-${resultColor}-500 h-4 rounded-full transition-all duration-1000 ease-out`}
            style={{ width: `${confidencePercent}%` }}
          ></div>
        </div>
        <p className="text-right text-lg font-semibold mt-1 text-gray-300">{confidencePercent}%</p>
      </div>

      <div className="mt-6">
        <h3 className="text-sm uppercase tracking-widest text-gray-400 mb-2">AI Reasoning</h3>
        <p className="text-gray-300 bg-gray-800/60 p-4 rounded-md text-sm leading-relaxed">{result.reasoning}</p>
      </div>
    </div>
  );
};

export default ResultDisplay;
