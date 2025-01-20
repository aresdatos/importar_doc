interface AIProcessingError extends Error {
  code?: string;
  status?: number;
  type?: string;
}

export function handleAIError(
  error: any,
  addLog?: (type: 'request' | 'response' | 'error', data: any) => void
): never {
  const aiError: AIProcessingError = error;
  console.error('OpenAI Processing Error:', {
    message: aiError.message,
    code: aiError.code,
    status: aiError.status,
    type: aiError.type
  });

  addLog?.('error', {
    message: aiError.message,
    code: aiError.code,
    status: aiError.status,
    type: aiError.type,
    stack: aiError.stack
  });

  // Handle specific error cases
  if (aiError.message?.includes('timeout') || aiError.message?.includes('ETIMEDOUT')) {
    throw new Error('La solicitud tardó demasiado tiempo. Reintentando automáticamente...');
  }

  if (aiError.message?.includes('Missing or invalid header section')) {
    throw new Error('No se pudo extraer la información del encabezado. Por favor, seleccione manualmente la zona del encabezado.');
  }

  if (aiError.message?.includes('No valid JSON structure found')) {
    throw new Error('Error al procesar la respuesta. Por favor, intente nuevamente o use la selección manual.');
  }

  if (aiError.message?.includes('Tax ID is required')) {
    throw new Error('No se encontró un RNC/NIT válido en el documento. Por favor, verifique o seleccione manualmente la zona del encabezado.');
  }

  if (aiError.status === 429 || aiError.type === 'rate_limit_exceeded') {
    throw new Error('Se excedió el límite de la API. Reintentando automáticamente...');
  }

  if (aiError.status === 500 || aiError.type === 'server_error') {
    throw new Error('El servicio está experimentando problemas. Por favor, intente más tarde.');
  }

  // Generic error fallback
  throw new Error('Error al procesar el documento. Por favor, intente usar la selección manual de zonas.');
}