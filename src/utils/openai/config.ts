import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
    }

    openaiClient = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
      maxRetries: 3,
      timeout: 90000, // 90 seconds
    });
  }

  return openaiClient;
}