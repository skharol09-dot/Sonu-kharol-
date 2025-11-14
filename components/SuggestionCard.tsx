import React from 'react';
import { SuggestionResult } from '../types';

interface SuggestionCardProps {
  title: string;
  suggestionResult: SuggestionResult | null;
  isLoading: boolean;
  onRefresh: () => void;
  loadingMessage: string;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ title, suggestionResult, isLoading, onRefresh, loadingMessage }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={`
            px-4 py-2 rounded-md text-sm font-medium transition-colors
            ${isLoading
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-700 dark:text-indigo-100 dark:hover:bg-indigo-600'
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-700 dark:text-indigo-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.042 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : (
            'Generate New'
          )}
        </button>
      </div>

      {suggestionResult?.content ? (
        <>
          <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
            {suggestionResult.content.split('\n').map((line, index) => (
              <p key={index} className="mb-2 last:mb-0">{line}</p>
            ))}
          </div>
          {suggestionResult.groundingUrls && suggestionResult.groundingUrls.length > 0 && (
            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Sources:</p>
              <ul className="list-disc list-inside text-sm text-gray-500 dark:text-gray-400">
                {suggestionResult.groundingUrls.map((url, index) => (
                  <li key={index} className="mb-1 truncate">
                    <a
                      href={url.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
                      title={url.title || url.uri}
                    >
                      {url.title || url.uri}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 italic">{loadingMessage}</p>
      )}
    </div>
  );
};

export default SuggestionCard;
