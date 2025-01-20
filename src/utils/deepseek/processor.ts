import { DocumentData } from '@/types/document';
import { getDeepSeekClient } from './config';
import { createHeaderPrompt, createDetailsPrompt } from './prompt';
import { validateDocumentData } from '../documentValidator';
import { processAIResponse } from './responseProcessor';
import { handleAIError } from './errorHandler';
import { validateInput, validateAIResponse } from './validator';
import { extractJSONFromResponse } from './responseParser';
import { AIResponse } from './types';

async function processHeaderSection(
  text: string,
  client: any,
  addLog?: (type: 'request' | 'response' | 'error', data: any) => void
) {
  const headerPrompt = createHeaderPrompt(text);
  const headerRequest = {
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
    max_tokens: 1000
  };

  addLog?.('request', {
    endpoint: 'completions',
    type: 'header',
    request: headerRequest
  });

  try {
    const response = await client.createCompletion(headerRequest);
    const content = response.choices[0].message.content;
    const parsedResponse = extractJSONFromResponse(content);

    addLog?.('response', {
      type: 'header',
      content: content,
      parsed: parsedResponse
    });

    return parsedResponse;
  } catch (error) {
    console.error('Error processing header:', error);
    addLog?.('error', {
      type: 'header',
      error: error
    });
    throw error;
  }
}

function findDetailsSection(text: string): string {
  // Common header patterns in Spanish and English
  const headerPatterns = [
    // Spanish patterns with flexible spacing and optional characters
    /\b(?:DESCRIPCION|DESCRIPCIÓN|DETALLE)[\s\W]*(?:CANTIDAD|CANT)[\s\W]*(?:UND|UNIDAD|MEDIDA)[\s\W]*(?:COSTO|PRECIO|VALOR)[\s\W]*(?:ITBS?|IVA|TAX|IMPUESTO)?[\s\W]*(?:TOTAL|NETO|VALOR)?\b/i,
    /\b(?:CANTIDAD|CANT)[\s\W]*(?:DESCRIPCION|DESCRIPCIÓN|DETALLE)[\s\W]*(?:UND|UNIDAD|MEDIDA)[\s\W]*(?:COSTO|PRECIO|VALOR)[\s\W]*(?:ITBS?|IVA|TAX|IMPUESTO)?[\s\W]*(?:TOTAL|NETO|VALOR)?\b/i,
    // Match just the DESCRIPCION header as a fallback
    /\b(?:DESCRIPCION|DESCRIPCIÓN|DETALLE)\b/i,
  ];

  // Try to find the start of details section
  for (const pattern of headerPatterns) {
    const match = text.match(pattern);
    if (match) {
      // Get everything from the start of the line containing the match
      const lineStart = text.lastIndexOf('\n', match.index || 0) + 1;
      return text.slice(lineStart);
    }
  }

  // Fallback: Look for lines with typical detail patterns
  const detailPatterns = [
    // Match lines with quantity and currency
    /^[\w\s-]+\*?\s+\d+(?:[.,]\d+)?\s+(?:UND|UNIDAD|PCS|KG|LB|OZ|ML|LT|FCO|CAJA|LATA|GALON|LITROS?)[\s\W]+[$RD]*[\d,.]+\s*[$RD]*\s*$/mi,
    // Match lines with asterisk marks
    /^[\w\s-]+\*+\s+\d+(?:[.,]\d+)?\s+(?:UND|UNIDAD|PCS|KG|LB|OZ|ML|LT|FCO|CAJA|LATA|GALON|LITROS?)[\s\W]+[$RD]*[\d,.]+\s*[$RD]*\s*$/mi,
    // Match lines with just product and quantity
    /^[\w\s-]+\*?\s+\d+(?:[.,]\d+)?\s+(?:UND|UNIDAD|PCS|KG|LB|OZ|ML|LT|FCO|CAJA|LATA|GALON|LITROS?)\s*$/mi,
  ];

  for (const pattern of detailPatterns) {
    const matches = text.match(new RegExp(pattern, 'gm'));
    if (matches && matches.length > 0) {
      // If we found multiple detail lines, this is likely a valid details section
      return text;
    }
  }

  return text;
}

async function processDetailsSection(
  text: string,
  client: any,
  addLog?: (type: 'request' | 'response' | 'error', data: any) => void
) {
  // Find and extract the details section
  const detailsText = findDetailsSection(text);
  
  // Split into smaller chunks if needed
  const maxChunkLength = 4000;
  const chunks = [];
  let currentChunk = '';
  
  const lines = detailsText.split('\n');
  const headerLine = lines[0]; // Preserve header line for each chunk
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    if ((currentChunk + line).length > maxChunkLength && currentChunk) {
      chunks.push(headerLine + '\n' + currentChunk);
      currentChunk = '';
    }
    currentChunk += line + '\n';
  }
  if (currentChunk) {
    chunks.push(headerLine + '\n' + currentChunk);
  }

  // If no chunks were created, process the entire text as one chunk
  if (chunks.length === 0 && detailsText.trim()) {
    chunks.push(detailsText);
  }

  // Process each chunk
  const allDetails = [];
  let lastError = null;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const detailsPrompt = createDetailsPrompt(chunk);
    const detailsRequest = {
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
      max_tokens: 4000
    };

    addLog?.('request', {
      endpoint: 'completions',
      type: 'details',
      chunk: i + 1,
      totalChunks: chunks.length,
      request: detailsRequest
    });

    try {
      const response = await client.createCompletion(detailsRequest);
      const parsedResponse = extractJSONFromResponse(response.choices[0].message.content);
      
      if (Array.isArray(parsedResponse.details)) {
        allDetails.push(...parsedResponse.details);
      }

      addLog?.('response', {
        type: 'details',
        chunk: i + 1,
        totalChunks: chunks.length,
        itemsProcessed: parsedResponse.details?.length || 0,
        content: response.choices[0].message.content
      });
    } catch (error) {
      console.error(`Error processing chunk ${i + 1}:`, error);
      lastError = error;
      addLog?.('error', {
        type: 'details',
        chunk: i + 1,
        error: error
      });
      // Continue with next chunk instead of failing completely
      continue;
    }
  }

  if (!allDetails.length) {
    throw lastError || new Error('No se encontraron detalles en el documento');
  }

  return { details: allDetails };
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
    const client = await getDeepSeekClient();

    // Process details first to ensure we capture all items
    const detailsResponse = await processDetailsSection(text, client, addLog);
    
    // Only process header if we found details
    let headerResponse = { header: {} };
    if (detailsResponse.details?.length > 0) {
      headerResponse = await processHeaderSection(text, client, addLog);
    }

    // Combine responses
    const combinedResponse = {
      header: headerResponse.header,
      details: detailsResponse.details
    };

    validateAIResponse(combinedResponse);

    const { interpretedData, confidence } = processAIResponse(combinedResponse as AIResponse);
    const validatedData = validateDocumentData(interpretedData);

    if (!validatedData.details?.length) {
      throw new Error('No se encontró la sección de detalles en el documento');
    }

    return {
      interpretedData: validatedData,
      confidence
    };
  } catch (error: any) {
    return handleAIError(error, addLog);
  }
}