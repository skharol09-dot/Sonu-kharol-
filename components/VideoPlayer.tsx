import React from 'react';

interface VideoPlayerProps {
  videoUrl: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl }) => {
  return (
    <div className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Your Generated Reel</h2>
      {videoUrl ? (
        <>
          <video
            src={videoUrl}
            controls
            loop
            className="w-full h-auto max-h-[60vh] rounded-lg border border-gray-300 dark:border-gray-600 mb-4 bg-black"
          >
            Your browser does not support the video tag.
          </video>
          <a
            href={videoUrl}
            download="ai_reel.mp4"
            className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 11.586V3a1 1 0 112 0v8.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download Reel
          </a>
        </>
      ) : (
        <p className="text-gray-600 dark:text-gray-400">No video generated yet.</p>
      )}
    </div>
  );
};

export default VideoPlayer;
