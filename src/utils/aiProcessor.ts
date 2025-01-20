import { DocumentData } from '@/types/document';
import { interpretText as interpretWithDeepSeek } from './deepseek/processor';
import { parseHeaderData } from './documentProcessor/headerParser';
import { parseTableData } from './documentProcessor/tableParser';

export async function interpretText(text: string): Promise<{
  interpretedData: Partial<DocumentData>;
  confidence: number;
}> {
  try {
    // Use DeepSeek interpretation
    return await interpretWithDeepSeek(text);
  } catch (error: any) {
    console.warn('AI interpretation failed:', error);

    // Fall back to rule-based parsing
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const detailStartIndex = lines.findIndex(line => 
      /\b(?:DESCRIPCION|DESCRIPCIÓN|DETALLE|MATERIAL|PRODUCTO)\b/i.test(line)
    );

    const headerText = detailStartIndex > -1 
      ? lines.slice(0, detailStartIndex).join('\n')
      : lines.slice(0, Math.min(5, lines.length)).join('\n');
    
    const detailsText = detailStartIndex > -1
      ? lines.slice(detailStartIndex).join('\n')
      : lines.slice(Math.min(5, lines.length)).join('\n');

    const header = parseHeaderData(headerText);
    const details = parseTableData(detailsText);

    // Calculate confidence based on field completeness
    const headerFields = Object.values(header).filter(Boolean).length;
    const detailsConfidence = details.length ? 
      details.reduce((acc, item) => 
        acc + Object.values(item).filter(v => v !== 0 && v !== '').length, 0
      ) / (details.length * 8) * 100 : 0;

    const confidence = Math.round(
      ((headerFields / 4) * 100 + detailsConfidence) / 2
    );

    return {
      interpretedData: { header, details },
      confidence
    };
  }
}