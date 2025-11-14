import React, { useRef, useState } from 'react';
import { ImageData, VideoFile } from '../types';

interface FileUploaderProps {
  label: string;
  accept: string;
  onFileChange: (file: ImageData | VideoFile | null) => void;
  currentFile: ImageData | VideoFile | null;
  fileType: 'image' | 'video';
}

// Fix: Helper to convert File to Base64, returning ImageData or VideoFile based on isVideo flag
async function fileToBase64Helper(file: File, isVideo: boolean): Promise<ImageData | VideoFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64Data = reader.result.split(',')[1]; // Remove "data:image/png;base64," or "data:video/mp4;base64," part
        if (isVideo) {
          resolve({ base64: base64Data, mimeType: file.type, name: file.name });
        } else {
          resolve({ base64: base64Data, mimeType: file.type });
        }
      } else {
        reject(new Error("Failed to convert file to base64 string."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

const FileUploader: React.FC<FileUploaderProps> = ({ label, accept, onFileChange, currentFile, fileType }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    const files = 'files' in event.target ? event.target.files : (event as React.DragEvent<HTMLDivElement>).dataTransfer?.files;

    if (files && files.length > 0) {
      const file = files[0];
      try {
        // Use the helper function with the fileType to ensure correct type resolution
        const base64File = await fileToBase64Helper(file, fileType === 'video');
        onFileChange(base64File);
      } catch (error) {
        console.error("Error processing file:", error);
        onFileChange(null);
      }
    } else {
      onFileChange(null);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileChange(e);
  };

  const clearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileChange(null);
  };

  // Only generate preview URL if currentFile is not null
  const previewUrl = currentFile ? `data:${currentFile.mimeType};base64,${currentFile.base64}` : null;

  return (
    <div className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
      <label htmlFor={`file-upload-${fileType}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <div
        className={`
          flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer
          ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          id={`file-upload-${fileType}`}
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        {currentFile ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {fileType === 'image' && previewUrl && (
              <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-md" />
            )}
            {fileType === 'video' && previewUrl && (
              <video src={previewUrl} controls className="max-h-full max-w-full object-contain rounded-md"></video>
            )}
            <button
              onClick={clearFile}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Fix: Conditionally render file name only if it's a VideoFile and `name` exists */}
            {fileType === 'video' && (currentFile as VideoFile).name && (
              <p className="absolute bottom-2 left-2 text-xs text-gray-600 bg-white bg-opacity-70 px-2 py-1 rounded-md max-w-[80%] truncate">
                {(currentFile as VideoFile).name}
              </p>
            )}
          </div>
        ) : (
          <label htmlFor={`file-upload-${fileType}`} className="flex flex-col items-center justify-center h-full w-full text-center text-gray-500 dark:text-gray-400">
            <svg className="w-10 h-10 mb-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            <p className="mb-2 text-sm">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs">{accept}</p>
          </label>
        )}
      </div>
    </div>
  );
};

export default FileUploader;