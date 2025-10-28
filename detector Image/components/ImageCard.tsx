
import React from 'react';
import type { ImageFile } from '../types';
import { Spinner } from './Spinner';
import { AIIcon, HumanIcon, UnknownIcon, CrossIcon } from './icons';

interface ImageCardProps {
  imageFile: ImageFile;
  onRemove: (id: string) => void;
}

const ResultBadge: React.FC<{ result: 'AI' | 'Human' | 'Unsure' }> = ({ result }) => {
    const baseClasses = "flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-full";
    const resultStyles = {
        AI: { icon: <AIIcon />, text: "AI Generated", classes: "bg-purple-500/20 text-purple-300" },
        Human: { icon: <HumanIcon />, text: "Likely Human", classes: "bg-green-500/20 text-green-300" },
        Unsure: { icon: <UnknownIcon />, text: "Unsure", classes: "bg-yellow-500/20 text-yellow-300" }
    };

    const { icon, text, classes } = resultStyles[result];

    return (
        <div className={`${baseClasses} ${classes}`}>
            {icon}
            <span>{text}</span>
        </div>
    );
};


export const ImageCard: React.FC<ImageCardProps> = ({ imageFile, onRemove }) => {
  const { id, previewUrl, status, result, error } = imageFile;

  return (
    <div className="group relative flex flex-col bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-indigo-500/20 hover:border-indigo-800">
      <div className="relative aspect-square">
        <img src={previewUrl} alt="Upload preview" className="object-cover w-full h-full" />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100">
            <button 
                onClick={() => onRemove(id)} 
                className="absolute top-2 right-2 p-1.5 bg-gray-900/70 text-gray-300 rounded-full hover:bg-red-600/80 hover:text-white transition-colors"
                aria-label="Remove image"
            >
                <CrossIcon />
            </button>
        </div>
        {status === 'analyzing' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Spinner />
          </div>
        )}
      </div>
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div className="flex justify-center mb-2 h-8">
            {status === 'completed' && result && <ResultBadge result={result.prediction} />}
        </div>
        
        {status === 'completed' && result && (
          <p className="text-xs text-center text-gray-400 h-8 overflow-hidden">{result.reason}</p>
        )}
        
        {status === 'error' && (
          <div className="text-center text-red-400 text-xs">
            <p className="font-bold">Analysis Failed</p>
            <p className="truncate">{error}</p>
          </div>
        )}

        {status === 'pending' && (
          <div className="text-center text-gray-500 text-xs h-8 content-center">
            Ready to analyze
          </div>
        )}
      </div>
    </div>
  );
};
