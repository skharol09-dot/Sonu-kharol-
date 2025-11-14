import React from 'react';
import { BILLING_DOCUMENTATION_URL } from '../constants';
import { ApiKeyState } from '../types';

interface ApiKeyPromptProps {
  apiKeyState: ApiKeyState;
  onSelectKey: () => void;
}

const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ apiKeyState, onSelectKey }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-indigo-800 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to AI Reels Studio!</h1>
        <p className="text-lg text-gray-700 mb-6">
          Before we can start generating amazing Reels, you need to select a Gemini API key.
          This ensures secure access to Google's powerful generative AI models.
        </p>

        {apiKeyState.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{apiKeyState.error} Please try selecting your API key again.</span>
          </div>
        )}

        <button
          onClick={onSelectKey}
          disabled={apiKeyState.isLoading}
          className={`
            w-full py-3 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-300
            ${apiKeyState.isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50'
            }
          `}
        >
          {apiKeyState.isLoading ? 'Opening Selector...' : 'Select Your API Key'}
        </button>

        <p className="text-sm text-gray-500 mt-6">
          Your API key is managed securely and not stored by the application.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Learn more about billing for Gemini API usage:{" "}
          <a
            href={BILLING_DOCUMENTATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline"
          >
            Google AI Studio Billing
          </a>
        </p>
      </div>
    </div>
  );
};

export default ApiKeyPrompt;
