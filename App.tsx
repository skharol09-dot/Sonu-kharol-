import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, VideoGenerationOperation } from '@google/genai';
import { fileToBase64, generateVideo, pollVideoGenerationStatus, suggestContent } from './services/geminiService';
import {
  VeoAspectRatio,
  VeoResolution,
  VideoInputMode,
  ApiKeyState,
  ImageData,
  VideoFile,
  GeneratedContent,
  SuggestionResult,
} from './types';
import {
  BILLING_DOCUMENTATION_URL,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_RESOLUTION,
  VIDEO_GENERATION_POLL_INTERVAL_MS,
} from './constants';
import ApiKeyPrompt from './components/ApiKeyPrompt';
import VideoUploader from './components/VideoUploader';
import VideoPlayer from './components/VideoPlayer';
import Loader from './components/Loader';
import SuggestionCard from './components/SuggestionCard';

// Fix: Removed the redundant 'declare global' block as 'window.aistudio'
// is assumed to be pre-configured and globally accessible by the runtime environment.
// Declaring it here again could cause type conflicts.

function App() {
  const [apiKeyState, setApiKeyState] = useState<ApiKeyState>({
    hasKey: false,
    isLoading: false,
    error: null,
  });

  const [prompt, setPrompt] = useState<string>('');
  const [videoInputMode, setVideoInputMode] = useState<VideoInputMode>(VideoInputMode.TEXT_ONLY);
  const [startingImage, setStartingImage] = useState<ImageData | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<VideoFile | null>(null); // For preview, not sent to Veo
  const [aspectRatio, setAspectRatio] = useState<VeoAspectRatio>(DEFAULT_ASPECT_RATIO);
  const [resolution, setResolution] = useState<VeoResolution>(DEFAULT_RESOLUTION);

  const [generatedContent, setGeneratedContent] = useState<GeneratedContent>({
    videoOperation: null,
    videoUrl: null,
    captionSuggestions: null,
    musicMoodSuggestions: null,
    groundingUrls: null,
  });

  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [videoGenerationError, setVideoGenerationError] = useState<string | null>(null);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState<boolean>(false);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState<boolean>(false);

  const pollIntervalRef = useRef<number | null>(null);

  const checkApiKey = useCallback(async () => {
    try {
      setApiKeyState(prevState => ({ ...prevState, isLoading: true, error: null }));
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setApiKeyState({ hasKey, isLoading: false, error: null });
    } catch (e: any) {
      console.error('Error checking API key:', e);
      setApiKeyState({ hasKey: false, isLoading: false, error: 'Failed to check API key.' });
    }
  }, []);

  useEffect(() => {
    // Only run checkApiKey if window.aistudio is defined. This is a platform-specific check.
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      checkApiKey();
    } else {
      // If running outside the specific AISTUDIO environment, assume key is present via env var.
      // This is a fallback for local development without the studio's key management.
      setApiKeyState({ hasKey: true, isLoading: false, error: null });
    }
  }, [checkApiKey]);

  const handleSelectApiKey = async () => {
    try {
      setApiKeyState(prevState => ({ ...prevState, isLoading: true, error: null }));
      await window.aistudio.openSelectKey();
      // Assume selection was successful to avoid race condition with hasSelectedApiKey
      setApiKeyState({ hasKey: true, isLoading: false, error: null });
    } catch (e: any) {
      console.error('Error opening API key selector:', e);
      setApiKeyState({ hasKey: false, isLoading: false, error: 'Failed to open API key selector.' });
    }
  };

  const handleVideoGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    setVideoGenerationError(null);
    setGeneratedContent({
      videoOperation: null,
      videoUrl: null,
      captionSuggestions: null,
      musicMoodSuggestions: null,
      groundingUrls: null,
    });
    setIsGeneratingVideo(true);

    if (!apiKeyState.hasKey && window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      setVideoGenerationError("API key not selected. Please select your API key before generating.");
      setIsGeneratingVideo(false);
      return;
    }

    try {
      const operation = await generateVideo({
        prompt,
        startingImage: startingImage || undefined,
        aspectRatio,
        resolution,
      });
      setGeneratedContent(prev => ({ ...prev, videoOperation: operation }));
      startPollingVideoStatus(operation);
    } catch (error: any) {
      console.error("Video generation failed:", error);
      // Check for API key related errors from Veo specifically.
      if (error.message && error.message.includes("Requested entity was not found.")) {
        setVideoGenerationError("API key might be invalid or not properly configured for Veo. Please select your API key again.");
        // Prompt user to re-select key.
        setApiKeyState({ hasKey: false, isLoading: false, error: 'API key might be invalid or expired.' });
      } else {
        setVideoGenerationError(`Failed to generate video: ${error.message || 'Unknown error'}`);
      }
      setIsGeneratingVideo(false);
    }
  };

  const startPollingVideoStatus = useCallback((initialOperation: VideoGenerationOperation) => {
    let currentOperation = initialOperation;

    if (pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = window.setInterval(async () => {
      try {
        currentOperation = await pollVideoGenerationStatus(currentOperation);
        if (currentOperation.done) {
          window.clearInterval(pollIntervalRef.current!);
          pollIntervalRef.current = null;
          setIsGeneratingVideo(false);

          if (currentOperation.response?.generatedVideos?.[0]?.video?.uri) {
            const videoUri = currentOperation.response.generatedVideos[0].video.uri;
            const fullVideoUrl = `${videoUri}&key=${process.env.API_KEY}`;
            setGeneratedContent(prev => ({ ...prev, videoUrl: fullVideoUrl, videoOperation: currentOperation }));
          } else {
            setVideoGenerationError("Video generation completed, but no video URI was found.");
          }
        }
      } catch (error: any) {
        window.clearInterval(pollIntervalRef.current!);
        pollIntervalRef.current = null;
        setIsGeneratingVideo(false);
        console.error("Error polling video status:", error);
        setVideoGenerationError(`Error during video processing: ${error.message || 'Unknown error'}`);
        // Consider resetting API key if there's a specific "not found" error during polling.
      }
    }, VIDEO_GENERATION_POLL_INTERVAL_MS);
  }, []);

  const handleCaptionSuggestion = useCallback(async () => {
    setIsGeneratingCaption(true);
    setGeneratedContent(prev => ({ ...prev, captionSuggestions: null }));
    try {
      const result = await suggestContent(prompt, 'caption');
      setGeneratedContent(prev => ({ ...prev, captionSuggestions: result.content, groundingUrls: result.groundingUrls }));
    } catch (error: any) {
      console.error("Caption suggestion failed:", error);
      setGeneratedContent(prev => ({ ...prev, captionSuggestions: `Failed to generate captions: ${error.message || 'Unknown error'}` }));
    } finally {
      setIsGeneratingCaption(false);
    }
  }, [prompt]);

  const handleMusicMoodSuggestion = useCallback(async () => {
    setIsGeneratingMusic(true);
    setGeneratedContent(prev => ({ ...prev, musicMoodSuggestions: null }));
    try {
      const result = await suggestContent(prompt, 'music-mood');
      setGeneratedContent(prev => ({ ...prev, musicMoodSuggestions: result.content, groundingUrls: result.groundingUrls }));
    } catch (error: any) {
      console.error("Music mood suggestion failed:", error);
      setGeneratedContent(prev => ({ ...prev, musicMoodSuggestions: `Failed to generate music moods: ${error.message || 'Unknown error'}` }));
    } finally {
      setIsGeneratingMusic(false);
    }
  }, [prompt]);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Conditional rendering based on API key status
  if (!apiKeyState.hasKey) {
    return (
      <ApiKeyPrompt apiKeyState={apiKeyState} onSelectKey={handleSelectApiKey} />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <h1 className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-400 mb-8 text-center drop-shadow-md">
        AI Reels Studio
      </h1>

      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleVideoGeneration} className="space-y-6">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reel Prompt <span className="text-red-500">*</span>
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              required
              placeholder="Describe your ideal Instagram Reel: e.g., 'A vibrant time-lapse of a sunset over a bustling city with a futuristic filter' or 'A short motivational clip with dynamic text overlays.' For editing, describe how you want to transform your uploaded content."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 p-3"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Input Mode
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="videoInputMode"
                  value={VideoInputMode.TEXT_ONLY}
                  checked={videoInputMode === VideoInputMode.TEXT_ONLY}
                  onChange={() => {
                    setVideoInputMode(VideoInputMode.TEXT_ONLY);
                    setStartingImage(null);
                    setUploadedVideo(null);
                  }}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Text-to-Video</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="videoInputMode"
                  value={VideoInputMode.IMAGE_UPLOAD}
                  checked={videoInputMode === VideoInputMode.IMAGE_UPLOAD}
                  onChange={() => {
                    setVideoInputMode(VideoInputMode.IMAGE_UPLOAD);
                    setUploadedVideo(null);
                  }}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Image-to-Video</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="videoInputMode"
                  value={VideoInputMode.VIDEO_UPLOAD}
                  checked={videoInputMode === VideoInputMode.VIDEO_UPLOAD}
                  onChange={() => {
                    setVideoInputMode(VideoInputMode.VIDEO_UPLOAD);
                    setStartingImage(null);
                  }}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Video for Context</span>
              </label>
            </div>
          </div>

          {videoInputMode === VideoInputMode.IMAGE_UPLOAD && (
            <VideoUploader
              label="Upload Starting Image (Optional)"
              accept="image/*"
              onFileChange={(file) => setStartingImage(file as ImageData | null)}
              currentFile={startingImage}
              fileType="image"
            />
          )}

          {videoInputMode === VideoInputMode.VIDEO_UPLOAD && (
            <VideoUploader
              label="Upload Video for Context (Optional)"
              accept="video/mp4,video/quicktime,video/webm"
              onFileChange={(file) => setUploadedVideo(file as VideoFile | null)}
              currentFile={uploadedVideo}
              fileType="video"
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Aspect Ratio
              </label>
              <select
                id="aspectRatio"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as VeoAspectRatio)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 p-3"
              >
                <option value={VeoAspectRatio.ASPECT_RATIO_9_16}>9:16 (Portrait - Ideal for Reels)</option>
                <option value={VeoAspectRatio.ASPECT_RATIO_16_9}>16:9 (Landscape)</option>
                <option value={VeoAspectRatio.ASPECT_RATIO_1_1}>1:1 (Square)</option>
              </select>
            </div>
            <div>
              <label htmlFor="resolution" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Resolution
              </label>
              <select
                id="resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value as VeoResolution)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 p-3"
              >
                <option value={VeoResolution.RESOLUTION_720P}>720p</option>
                <option value={VeoResolution.RESOLUTION_1080P}>1080p</option>
              </select>
            </div>
          </div>

          {videoGenerationError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{videoGenerationError}</span>
            </div>
          )}

          <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-4 -mx-6 -mb-6 mt-6 border-t border-gray-200 dark:border-gray-700 flex justify-center">
            <button
              type="submit"
              disabled={isGeneratingVideo || !prompt.trim()}
              className={`
                w-full md:w-auto px-8 py-3 rounded-md text-lg font-semibold text-white transition-all duration-300
                ${isGeneratingVideo || !prompt.trim()
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50'
                }
              `}
            >
              {isGeneratingVideo ? 'Generating Reel...' : 'Generate Reel'}
            </button>
          </div>
        </form>
      </div>

      {isGeneratingVideo && (
        <div className="w-full max-w-xl mb-8">
          <Loader />
        </div>
      )}

      {generatedContent.videoUrl && (
        <div className="w-full max-w-4xl mb-8 space-y-8">
          <VideoPlayer videoUrl={generatedContent.videoUrl} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SuggestionCard
              title="Caption Ideas"
              suggestionResult={{ content: generatedContent.captionSuggestions, groundingUrls: generatedContent.groundingUrls }}
              isLoading={isGeneratingCaption}
              onRefresh={handleCaptionSuggestion}
              loadingMessage="Click 'Generate New' for caption ideas!"
            />
            <SuggestionCard
              title="Music Moods"
              suggestionResult={{ content: generatedContent.musicMoodSuggestions, groundingUrls: generatedContent.groundingUrls }}
              isLoading={isGeneratingMusic}
              onRefresh={handleMusicMoodSuggestion}
              loadingMessage="Click 'Generate New' for music mood suggestions!"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;