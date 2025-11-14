import { VeoAspectRatio, VeoResolution } from './types';

export const VEO_FAST_MODEL = 'veo-3.1-fast-generate-preview';
export const VEO_MODEL = 'veo-3.1-generate-preview';
export const GEMINI_FLASH_MODEL = 'gemini-2.5-flash';

export const VIDEO_GENERATION_POLL_INTERVAL_MS = 5000; // 5 seconds

export const BILLING_DOCUMENTATION_URL = 'https://ai.google.dev/gemini-api/docs/billing';

export const DEFAULT_ASPECT_RATIO = VeoAspectRatio.ASPECT_RATIO_9_16; // Reels default to portrait
export const DEFAULT_RESOLUTION = VeoResolution.RESOLUTION_720P;

export const VIDEO_GENERATION_LOADING_MESSAGES = [
  "Crafting your cinematic masterpiece...",
  "Generating frames with AI magic...",
  "Synthesizing your vision into motion...",
  "Adding a touch of AI brilliance...",
  "Polishing pixels for perfection...",
  "Almost there! Your reel is brewing...",
  "Infusing creativity into every second...",
  "Bringing your prompt to life, frame by frame...",
  "Our AI director is hard at work...",
  "Expect cinematic quality, delivered by AI.",
];
