import { DocumentData } from '@/types/document';
import { getOpenAIClient } from './config';
import { createHeaderPrompt, createDetailsPrompt } from './prompt';
import { validateDocumentData } from '../documentValidator';
import { processAIResponse } from './responseProcessor';
import { handleAIError } from './errorHandler';
import { validateInput, validateAIResponse } from './validator';
import { extractJSONFromResponse } from './responseParser';
import { AIResponse } from './types';

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry if it's not a timeout or rate limit error
      if (!error.message?.includes('timeout') && error.status !== 429) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

async function processHeaderSection(
  text: string,
  openai: any,
  addLog?: (type: 'request' | 'response' | 'error', data: any) => void
) {
  const headerPrompt = createHeaderPrompt(text);
  const headerRequest = {
    model: "gpt-3.5-turbo-1106",
    messages: [
      {
        role: "system",
        content: "You are a specialized document parser focusing on extracting header information. Your response MUST be a single, valid JSON object."
      },
      {
        role: "user",
        content: headerPrompt
      }
    ],
    temperature: 0.1,
    max_tokens: 500,
    response_format: { type: "json_object" }
  };

  addLog?.('request', {
    endpoint: 'chat.completions',
    type: 'header',
    ...headerRequest
  });

  const response = await retryWithBackoff(() => 
    openai.chat.completions.create(headerRequest)
  );

  const content = response.choices[0].message.content;

  addLog?.('response', {
    type: 'header',
    content,
    usage: response.usage,
    model: response.model
  });

  return extractJSONFromResponse(content);
}

async function processDetailsSection(
  text: string,
  openai: any,
  addLog?: (type: 'request' | 'response' | 'error', data: any) => void
) {
  // Find the start of the details section
  const detailsStartIndex = text.toLowerCase().indexOf('descripcion');
  const detailsText = detailsStartIndex > -1 ? text.slice(detailsStartIndex) : text;

  const detailsPrompt = createDetailsPrompt(detailsText);
  const detailsRequest = {
    model: "gpt-4-1106-preview",
    messages: [
      {
        role: "system",
        content: "You are a specialized document parser focusing on extracting detailed line items. Process ALL items without limit. Your response MUST be a single, valid JSON object."
      },
      {
        role: "user",
        content: detailsPrompt
      }
    ],
    temperature: 0.1,
    max_tokens: 4000,
    response_format: { type: "json_object" }
  };

  addLog?.('request', {
    endpoint: 'chat.completions',
    type: 'details',
    ...detailsRequest
  });

  const response = await retryWithBackoff(() => 
    openai.chat.completions.create(detailsRequest)
  );

  const content = response.choices[0].message.content;

  addLog?.('response', {
    type: 'details',
    content,
    usage: response.usage,
    model: response.model
  });

  return extractJSONFromResponse(content);
}

export async function interpretText(
  text: string,
  addLog?: (type: 'request' | 'response' | 'error', data: any) => void
): Promise<{
  interpretedData: Partial<DocumentData>;
  confidence: number;
}> {
  try {
    validateInput(text);
    const openai = getOpenAIClient();

    // Process header and details sequentially with retries
    const headerResponse = await processHeaderSection(text, openai, addLog);
    const detailsResponse = await processDetailsSection(text, openai, addLog);

    // Combine responses
    const combinedResponse = {
      header: headerResponse.header,
      details: detailsResponse.details
    };

    validateAIResponse(combinedResponse);

    const { interpretedData, confidence } = processAIResponse(combinedResponse as AIResponse);
    const validatedData = validateDocumentData(interpretedData);

    return {
      interpretedData: validatedData,
      confidence
    };
  } catch (error: any) {
    return handleAIError(error, addLog);
  }
}