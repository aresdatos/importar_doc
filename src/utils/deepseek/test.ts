import { getDeepSeekClient } from './config';

export async function testDeepSeekConnection() {
  try {
    const client = await getDeepSeekClient();
    
    const response = await client.createCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.'
        },
        {
          role: 'user',
          content: 'Test connection with a simple "Hello"'
        }
      ],
      max_tokens: 10,
      temperature: 0.1
    });

    if (!response.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from DeepSeek API');
    }

    return true;
  } catch (error: any) {
    console.error('DeepSeek API Test Error:', error);
    
    // Provide more user-friendly error messages
    if (error.status === 401) {
      throw new Error('La clave de API de DeepSeek es inválida. Por favor, verifique su configuración.');
    } else if (error.status === 429) {
      throw new Error('Se ha excedido el límite de la API de DeepSeek. Por favor, intente más tarde.');
    } else if (error.message.includes('Could not connect')) {
      throw new Error('No se pudo conectar a la API de DeepSeek. Por favor, verifique su conexión a internet.');
    }
    
    throw new Error('Error al probar la conexión con DeepSeek: ' + error.message);
  }
}