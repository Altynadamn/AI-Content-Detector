
import React from 'react';
import { Spinner } from './Spinner';

interface ActionButtonsProps {
    onAnalyze: () => void;
    onClear: () => void;
    isAnalyzing: boolean;
    pendingCount: number;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onAnalyze, onClear, isAnalyzing, pendingCount }) => {
    const hasPending = pendingCount > 0;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-6 sticky top-0 bg-gray-900 z-10">
            <button
                onClick={onAnalyze}
                disabled={!hasPending || isAnalyzing}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-500 disabled:bg-indigo-900/50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
            >
                {isAnalyzing ? (
                    <>
                        <Spinner />
                        <span>Analyzing...</span>
                    </>
                ) : (
                    `Analyze ${pendingCount > 0 ? `${pendingCount} New` : ''} Image${pendingCount !== 1 ? 's' : ''}`
                )}
            </button>
            <button
                onClick={onClear}
                disabled={isAnalyzing}
                className="w-full sm:w-auto px-6 py-3 font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-300"
            >
                Clear All
            </button>
        </div>
    );
};
