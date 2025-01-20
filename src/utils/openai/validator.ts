import { AIResponse } from './types';

export function validateInput(text: string): void {
  if (!text?.trim()) {
    throw new Error('No text provided for interpretation');
  }

  if (text.length > 100000) {
    throw new Error('Document is too large for processing');
  }
}

export function validateAIResponse(response: any): response is AIResponse {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid response format from AI');
  }

  // Validate header section
  if (!response.header || typeof response.header !== 'object') {
    throw new Error('Missing or invalid header section in AI response');
  }

  // Initialize header with default values if fields are missing
  response.header = {
    name: String(response.header.name || '').trim(),
    taxId: String(response.header.taxId || '').trim(),
    date: String(response.header.date || '').trim(),
    documentNumber: String(response.header.documentNumber || '').trim(),
    confidence: response.header.confidence || {}
  };

  // Validate details section
  if (!Array.isArray(response.details)) {
    response.details = []; // Initialize empty array if missing
  }

  // Ensure each detail item has all required fields
  response.details = response.details.map((detail, index) => {
    if (!detail || typeof detail !== 'object') {
      throw new Error(`Invalid detail item at index ${index}`);
    }

    return {
      itemCode: String(detail.itemCode || '').trim(),
      description: String(detail.description || '').trim(),
      unitOfMeasure: String(detail.unitOfMeasure || 'UND').trim(),
      quantity: typeof detail.quantity === 'number' ? detail.quantity : 0,
      grossPrice: typeof detail.grossPrice === 'number' ? detail.grossPrice : 0,
      discount: typeof detail.discount === 'number' ? detail.discount : 0,
      tax: typeof detail.tax === 'number' ? detail.tax : 0,
      netValue: typeof detail.netValue === 'number' ? detail.netValue : 0,
      confidence: detail.confidence || {}
    };
  });

  return true;
}