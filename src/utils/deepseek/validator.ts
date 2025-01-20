import { AIResponse } from './types';

export function validateInput(text: string): void {
  if (!text?.trim()) {
    throw new Error('No se proporcionó texto para interpretar');
  }

  if (text.length > 100000) {
    throw new Error('El documento es demasiado grande para procesar');
  }
}

export function validateAIResponse(response: any): response is AIResponse {
  if (!response || typeof response !== 'object') {
    throw new Error('Formato de respuesta inválido');
  }

  // Initialize header with default values if fields are missing
  response.header = {
    name: String(response.header?.name || '').trim(),
    date: String(response.header?.date || '').trim(),
    documentNumber: String(response.header?.documentNumber || '').trim(),
  };

  // Initialize details array if missing
  if (!Array.isArray(response.details)) {
    response.details = [];
  }

  // Ensure each detail item has all required fields
  response.details = response.details.map((detail, index) => {
    if (!detail || typeof detail !== 'object') {
      throw new Error(`Elemento de detalle inválido en el índice ${index}`);
    }

    return {
      description: String(detail.description || '').trim(),
      quantity: typeof detail.quantity === 'number' ? detail.quantity : 0,
      unitOfMeasure: String(detail.unitOfMeasure || 'UND').trim(),
      unitPrice: typeof detail.unitPrice === 'number' ? detail.unitPrice : 0,
      tax: typeof detail.tax === 'number' ? detail.tax : 0,
      total: typeof detail.total === 'number' ? detail.total : 0,
    };
  });

  // Validate that we have at least some details
  if (response.details.length === 0) {
    throw new Error('No se encontraron detalles en el documento');
  }

  return true;
}