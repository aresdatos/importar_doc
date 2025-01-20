import { DocumentData, Zone } from '@/types/document';
import { extractTextFromPdf } from './pdfWorker';
import { parseHeaderData } from './headerParser';
import { parseTableData } from './tableParser';
import { interpretText } from './aiProcessor';

export interface ProcessingResult {
  data: DocumentData;
  rawText: string;
  interpretedText: string;
  confidence: number;
}

export async function processDocument(file: File): Promise<ProcessingResult> {
  try {
    // Extract text from PDF
    const rawText = await extractTextFromPdf(file);
    
    // Try AI interpretation first
    let interpretedData: Partial<DocumentData> = {};
    let confidence = 0;
    let interpretedText = '';
    
    try {
      const aiResult = await interpretText(rawText);
      interpretedData = aiResult.interpretedData;
      confidence = aiResult.confidence;
      interpretedText = JSON.stringify(interpretedData, null, 2);
    } catch (error) {
      console.warn('AI interpretation failed, falling back to rule-based parsing:', error);
    }

    // Fall back to rule-based parsing if AI interpretation failed or returned empty data
    if (!interpretedData.header?.name && !interpretedData.details?.length) {
      const header = parseHeaderData(rawText);
      const details = parseTableData(rawText);
      
      interpretedData = {
        header,
        details,
      };
    }

    return {
      data: {
        header: {
          name: interpretedData.header?.name || '',
          taxId: interpretedData.header?.taxId || '',
          date: interpretedData.header?.date || '',
          documentNumber: interpretedData.header?.documentNumber || '',
        },
        details: interpretedData.details || [],
      },
      rawText,
      interpretedText,
      confidence,
    };
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

export async function processZone(
  file: File,
  zone: Zone,
  type: 'header' | 'details'
): Promise<ProcessingResult> {
  try {
    // Extract text from the selected zone
    const rawText = await extractTextFromPdf(file, zone);
    
    // Try AI interpretation first
    let interpretedData: Partial<DocumentData> = {};
    let confidence = 0;
    let interpretedText = '';
    
    try {
      const aiResult = await interpretText(rawText);
      interpretedData = aiResult.interpretedData;
      confidence = aiResult.confidence;
      interpretedText = JSON.stringify(interpretedData, null, 2);
    } catch (error) {
      console.warn('AI interpretation failed, falling back to rule-based parsing:', error);
    }

    // Fall back to rule-based parsing if AI interpretation failed
    if (!interpretedData.header?.name && !interpretedData.details?.length) {
      if (type === 'header') {
        interpretedData.header = parseHeaderData(rawText);
      } else {
        interpretedData.details = parseTableData(rawText);
      }
    }

    // Return only the processed zone type
    return {
      data: {
        header: type === 'header' ? {
          name: interpretedData.header?.name || '',
          taxId: interpretedData.header?.taxId || '',
          date: interpretedData.header?.date || '',
          documentNumber: interpretedData.header?.documentNumber || '',
        } : {
          name: '',
          taxId: '',
          date: '',
          documentNumber: '',
        },
        details: type === 'details' ? (interpretedData.details || []) : [],
      },
      rawText,
      interpretedText,
      confidence,
    };
  } catch (error) {
    console.error('Error processing zone:', error);
    throw error;
  }
}