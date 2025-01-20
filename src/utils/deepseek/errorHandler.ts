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
  console.error('DeepSeek Processing Error:', {
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
  if (aiError.status === 401) {
    throw new Error('Clave de API de DeepSeek inválida. Por favor, verifique su configuración.');
  }

  if (aiError.status === 429) {
    throw new Error('Se excedió el límite de la API de DeepSeek. Por favor, intente más tarde.');
  }

  if (aiError.status === 500) {
    throw new Error('Error interno del servidor DeepSeek. Por favor, intente más tarde.');
  }

  if (aiError.message.includes('Could not connect')) {
    throw new Error('No se pudo conectar a la API de DeepSeek. Por favor, verifique su conexión a internet.');
  }

  // Generic error fallback
  throw new Error('Error al procesar el documento. Por favor, intente usar la selección manual de zonas.');
}