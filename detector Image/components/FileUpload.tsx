
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface FileUploadProps {
  onFilesChange: (files: FileList | null) => void;
  maxFiles: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesChange, maxFiles }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesChange(e.dataTransfer.files);
    }
  }, [onFilesChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilesChange(e.target.files);
  };

  const activeDragClasses = isDragging ? 'border-indigo-500 bg-gray-800' : 'border-gray-600 hover:border-indigo-500';

  return (
    <div 
      onDragEnter={handleDrag} 
      onDragOver={handleDrag} 
      onDragLeave={handleDrag} 
      onDrop={handleDrop}
      className="mt-12"
    >
      <label
        htmlFor="file-upload"
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 ${activeDragClasses} border-dashed rounded-lg cursor-pointer bg-gray-800/50 transition-colors duration-300`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <UploadIcon />
            <p className="mb-2 text-sm text-gray-400">
                <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, WEBP, GIF (MAX {maxFiles} images)</p>
        </div>
        <input 
            id="file-upload" 
            type="file" 
            className="hidden" 
            multiple 
            accept="image/*"
            onChange={handleChange}
        />
      </label>
    </div>
  );
};
