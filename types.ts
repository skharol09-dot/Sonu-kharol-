import { VideoGenerationOperation, GenerateContentResponse } from "@google/genai";

export enum VeoAspectRatio {
  ASPECT_RATIO_16_9 = '16:9', // Landscape
  ASPECT_RATIO_9_16 = '9:16', // Portrait (typical for Reels)
  ASPECT_RATIO_1_1 = '1:1', // Square
}

export enum VeoResolution {
  RESOLUTION_720P = '720p',
  RESOLUTION_1080P = '1080p',
}

export enum VideoInputMode {
  TEXT_ONLY = 'text-only',
  IMAGE_UPLOAD = 'image-upload',
  VIDEO_UPLOAD = 'video-upload', // For contextual prompt, not directly sent to Veo API
}

export interface GeneratedContent {
  videoOperation: VideoGenerationOperation | null;
  videoUrl: string | null;
  captionSuggestions: string | null;
  musicMoodSuggestions: string | null;
  groundingUrls: { uri: string; title: string }[] | null;
}

export interface ApiKeyState {
  hasKey: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface VideoFile {
  base64: string;
  mimeType: string;
  name: string;
}

export interface ImageData {
  base64: string;
  mimeType: string;
}

export interface SuggestionResult {
  content: string;
  groundingUrls: { uri: string; title: string }[] | null;
}
