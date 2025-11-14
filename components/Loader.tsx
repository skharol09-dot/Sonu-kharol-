import React, { useEffect, useState } from 'react';
import { VIDEO_GENERATION_LOADING_MESSAGES } from '../constants';

interface LoaderProps {
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  const [currentMessage, setCurrentMessage] = useState(message || VIDEO_GENERATION_LOADING_MESSAGES[0]);

  useEffect(() => {
    if (!message) {
      const interval = setInterval(() => {
        setCurrentMessage(prevMessage => {
          const currentIndex = VIDEO_GENERATION_LOADING_MESSAGES.indexOf(prevMessage);
          const nextIndex = (currentIndex + 1) % VIDEO_GENERATION_LOADING_MESSAGES.length;
          return VIDEO_GENERATION_LOADING_MESSAGES[nextIndex];
        });
      }, 3000); // Change message every 3 seconds
      return () => clearInterval(interval);
    } else {
      setCurrentMessage(message);
    }
  }, [message]);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center max-w-sm mx-auto">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 dark:border-indigo-400"></div>
      <p className="mt-5 text-lg font-medium text-gray-700 dark:text-gray-200">{currentMessage}</p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">This might take a few moments...</p>
    </div>
  );
};

export default Loader;
