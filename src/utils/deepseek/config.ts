// DeepSeek API endpoint configuration
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function getDeepSeekClient() {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error('DeepSeek API key not configured. Please set VITE_DEEPSEEK_API_KEY in your .env file.');
  }

  return {
    async createCompletion(params: any) {
      try {
        const requestBody = {
          model: 'deepseek-chat',  // Using the chat model
          messages: params.messages,
          temperature: params.temperature || 0.7,
          max_tokens: params.max_tokens || 2000,
          stream: false
        };

        const response = await fetch(DEEPSEEK_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const responseData = await response.json().catch(() => ({}));
          let errorMessage = 'DeepSeek API error';
          
          if (response.status === 401) {
            errorMessage = 'Invalid API key. Please check your DeepSeek API key configuration.';
          } else if (response.status === 429) {
            errorMessage = 'Rate limit exceeded. Please try again later.';
          } else if (response.status === 500) {
            errorMessage = 'DeepSeek service error. Please try again later.';
          } else {
            errorMessage = responseData.error?.message || responseData.message || response.statusText;
          }

          const error = new Error(errorMessage);
          (error as any).status = response.status;
          (error as any).requestBody = requestBody;
          (error as any).responseData = responseData;
          throw error;
        }

        const responseData = await response.json();

        return {
          choices: [{
            message: {
              content: responseData.choices[0].message.content
            }
          }],
          usage: responseData.usage,
          model: responseData.model
        };
      } catch (error: any) {
        if (!error.status) {
          if (error.message.includes('Failed to fetch')) {
            error.message = 'Could not connect to DeepSeek API. Please check your internet connection.';
          }
          error.status = 500;
        }
        throw error;
      }
    }
  };
}