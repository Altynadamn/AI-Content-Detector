
import React, { useCallback, useState } from 'react';

interface VideoUploaderProps {
  onVideoSelect: (file: File) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onVideoSelect(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if(e.dataTransfer.files[0].type.startsWith('video/')) {
        onVideoSelect(e.dataTransfer.files[0]);
      } else {
        alert("Please drop a video file.");
      }
    }
  }, [onVideoSelect]);

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <div className="w-full max-w-xl">
      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`flex justify-center w-full h-64 px-4 transition bg-gray-800/50 border-2 ${isDragging ? 'border-purple-400' : 'border-gray-600'} border-dashed rounded-md appearance-none cursor-pointer hover:border-purple-500 focus:outline-none backdrop-blur-sm`}
      >
        <span className="flex flex-col items-center justify-center space-x-2 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>

          <span className="font-medium text-gray-300">
            Drop a video file, or{' '}
            <span className="text-purple-400 underline">browse</span>
          </span>
          <span className="text-gray-500 text-sm mt-1">
            MP4, WebM, or Ogg formats
          </span>
        </span>
        <input type="file" name="file_upload" className="hidden" accept="video/*" onChange={handleFileChange} />
      </label>
    </div>
  );
};

export default VideoUploader;
