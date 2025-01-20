import { DocumentData } from '@/types/document';

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/meta-llama/Llama-2-70b-chat-hf';

async function query(text: string): Promise<any> {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  
  if (!apiKey || apiKey === 'your_huggingface_api_key_here') {
    throw new Error('Hugging Face API key not configured');
  }

  const response = await fetch(HUGGINGFACE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: `<s>[INST] You are a document parser specialized in extracting structured data from business documents. 
      Analyze this text and extract information in a structured format.

Text to analyze:
${text}

Requirements:
1. Extract header information:
   - Business name
   - Tax ID (RNC, RUC, NIT, etc.)
   - Document date
   - Document number

2. Extract details table information:
   - Each line item should include:
     * Item code
     * Full description
     * Unit of measure
     * Quantity
     * Price
     * Discount
     * Tax
     * Total value

Format the response as a valid JSON object with this exact structure:
{
  "header": {
    "name": "extracted name",
    "taxId": "extracted tax ID",
    "date": "extracted date",
    "documentNumber": "extracted document number"
  },
  "details": [
    {
      "itemCode": "code",
      "description": "description",
      "unitOfMeasure": "unit",
      "quantity": number,
      "grossPrice": number,
      "discount": number,
      "tax": number,
      "netValue": number
    }
  ]
}

Important:
- Preserve complete descriptions
- Convert all numeric values to numbers
- Remove currency symbols
- Handle multi-line items
- Start details section from the line containing "DESCRIPCION" or similar
[/INST]</s>`,
      parameters: {
        max_new_tokens: 2048,
        temperature: 0.1,
        top_p: 0.95,
        do_sample: true,
        return_full_text: false,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.statusText}`);
  }

  const result = await response.json();
  return result[0].generated_text;
}

export async function interpretText(text: string): Promise<{
  interpretedData: Partial<DocumentData>;
  confidence: number;
}> {
  try {
    const aiResponse = await query(text);
    
    // Extract JSON from response (it might be wrapped in markdown or other text)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse;
    
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.warn('Failed to parse AI response as JSON:', e);
      return { interpretedData: {}, confidence: 0 };
    }

    // Clean and validate the data
    const interpretedData: Partial<DocumentData> = {
      header: parsed.header ? {
        name: String(parsed.header.name || ''),
        taxId: String(parsed.header.taxId || ''),
        date: String(parsed.header.date || ''),
        documentNumber: String(parsed.header.documentNumber || ''),
      } : undefined,
      details: Array.isArray(parsed.details) ? parsed.details.map(item => ({
        itemCode: String(item.itemCode || ''),
        description: String(item.description || ''),
        unitOfMeasure: String(item.unitOfMeasure || 'UND'),
        quantity: Number(item.quantity) || 0,
        grossPrice: Number(item.grossPrice) || 0,
        discount: Number(item.discount) || 0,
        tax: Number(item.tax) || 0,
        netValue: Number(item.netValue) || 0,
      })) : [],
    };

    // Calculate confidence based on field completeness
    const headerFields = interpretedData.header ? 
      Object.values(interpretedData.header).filter(Boolean).length : 0;
    
    const detailsConfidence = interpretedData.details?.length ? 
      interpretedData.details.reduce((acc, item) => 
        acc + Object.values(item).filter(v => v !== 0 && v !== '').length, 0
      ) / (interpretedData.details.length * 8) * 100 : 0;

    const confidence = Math.round(
      ((headerFields / 4) * 100 + detailsConfidence) / 2
    );

    return {
      interpretedData,
      confidence,
    };
  } catch (error) {
    console.error('Error interpreting text with Hugging Face:', error);
    return {
      interpretedData: {},
      confidence: 0,
    };
  }
}