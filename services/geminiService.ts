import { GoogleGenAI, VideoGenerationOperation, GenerateContentResponse, VideoGenerationReferenceImage, VideoGenerationReferenceType } from "@google/genai";
import { VeoAspectRatio, VeoResolution, ImageData, SuggestionResult } from '../types';
import { VEO_FAST_MODEL, VEO_MODEL, GEMINI_FLASH_MODEL } from '../constants';

// Helper function to extract base64 data from a File object
export async function fileToBase64(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64Data = reader.result.split(',')[1]; // Remove "data:image/png;base64," part
        resolve({ base64: base64Data, mimeType: file.type });
      } else {
        reject(new Error("Failed to convert file to base64 string."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

interface GenerateVideoOptions {
  prompt: string;
  startingImage?: ImageData;
  aspectRatio: VeoAspectRatio;
  resolution: VeoResolution;
}

export async function generateVideo(options: GenerateVideoOptions): Promise<VideoGenerationOperation> {
  // Create a new GoogleGenAI instance right before making an API call
  // to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let model: string = VEO_FAST_MODEL; // Default model for simpler generations

  let videoParams: {
    model: string;
    prompt: string;
    image?: { imageBytes: string; mimeType: string };
    config: {
      numberOfVideos: 1;
      resolution: VeoResolution;
      aspectRatio: VeoAspectRatio;
    };
  };

  if (options.startingImage) {
    // If a starting image is provided, use it
    videoParams = {
      model: model,
      prompt: options.prompt,
      image: {
        imageBytes: options.startingImage.base64,
        mimeType: options.startingImage.mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: options.resolution,
        aspectRatio: options.aspectRatio,
      },
    };
  } else {
    // Text-to-video generation
    videoParams = {
      model: model,
      prompt: options.prompt,
      config: {
        numberOfVideos: 1,
        resolution: options.resolution,
        aspectRatio: options.aspectRatio,
      },
    };
  }

  const operation = await ai.models.generateVideos(videoParams);
  return operation;
}

export async function pollVideoGenerationStatus(initialOperation: VideoGenerationOperation): Promise<VideoGenerationOperation> {
  // Create a new GoogleGenAI instance right before making an API call
  // to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let operation = initialOperation;
  // Veo generation can take a few minutes. The component will handle the polling interval.
  operation = await ai.operations.getVideosOperation({ operation: operation });
  return operation;
}

export async function suggestContent(prompt: string, type: 'caption' | 'music-mood'): Promise<SuggestionResult> {
  // Create a new GoogleGenAI instance right before making an API call
  // to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = GEMINI_FLASH_MODEL;
  let systemInstruction = '';
  let userPrompt = '';

  if (type === 'caption') {
    systemInstruction = 'You are an Instagram Reels caption writer. Provide short, engaging, and relevant captions, including relevant emojis and hashtags, for a video described by the user. Provide 3 distinct options, each on a new line. Do not include introductory or concluding remarks.';
    userPrompt = `Generate captions for a video about: ${prompt}`;
  } else if (type === 'music-mood') {
    systemInstruction = 'You are a music expert recommending background music moods/genres for Instagram Reels. Suggest 3 music moods/genres and provide a short reason for each, for a video described by the user. Format as a bulleted list. Do not include introductory or concluding remarks.';
    userPrompt = `Suggest music moods/genres for a video about: ${prompt}`;
  }

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: userPrompt,
    config: {
      systemInstruction,
      temperature: 0.8,
      maxOutputTokens: 200,
    },
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  const urls: { uri: string; title: string }[] = [];
  if (groundingChunks) {
    for (const chunk of groundingChunks) {
      if (chunk.web) {
        urls.push({ uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
      }
      if (chunk.maps) {
        urls.push({ uri: chunk.maps.uri, title: chunk.maps.title || chunk.maps.uri });
        if (chunk.maps.placeAnswerSources) {
          chunk.maps.placeAnswerSources.reviewSnippets?.forEach(snippet => {
            if (snippet.uri) {
              urls.push({ uri: snippet.uri, title: snippet.title || snippet.uri });
            }
          });
        }
      }
    }
  }

  return {
    content: response.text,
    groundingUrls: urls.length > 0 ? urls : null,
  };
}
