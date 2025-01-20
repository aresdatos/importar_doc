import { DocumentData, Zone } from '@/types/document';
import { extractTextFromPdf } from '../pdfProcessor';
import { interpretText } from '../deepseek/processor';
import { validateDocumentData } from '../documentValidator';

export interface ProcessingResult {
  data: DocumentData;
  rawText: string;
  interpretedText: string;
  confidence: number;
}

export async function processDocument(
  file: File,
  addLog?: (type: 'request' | 'response' | 'error', data: any) => void
): Promise<ProcessingResult> {
  try {
    // Extract text from PDF
    const rawText = await extractTextFromPdf(file);
    if (!rawText.trim()) {
      throw new Error('No se pudo extraer texto del documento');
    }

    // Process with DeepSeek
    const { interpretedData, confidence } = await interpretText(rawText, addLog);
    
    // Validate the extracted data
    const validatedData = validateDocumentData(interpretedData);

    return {
      data: {
        header: validatedData.header || {
          name: '',
          taxId: '',
          date: '',
          documentNumber: ''
        },
        details: validatedData.details || []
      },
      rawText,
      interpretedText: JSON.stringify(interpretedData, null, 2),
      confidence
    };
  } catch (error: any) {
    console.error('Error processing document:', error);
    throw new Error(error.message || 'Error al procesar el documento');
  }
}

export async function processZone(
  file: File,
  zone: Zone,
  type: 'header' | 'details',
  addLog?: (type: 'request' | 'response' | 'error', data: any) => void
): Promise<ProcessingResult> {
  try {
    // Extract text from the selected zone
    const rawText = await extractTextFromPdf(file, zone);
    if (!rawText.trim()) {
      throw new Error('No se pudo extraer texto de la zona seleccionada');
    }

    // Process with DeepSeek
    const { interpretedData, confidence } = await interpretText(rawText, addLog);
    
    // Validate the extracted data
    const validatedData = validateDocumentData(interpretedData);

    // Return the processed zone type
    const data: DocumentData = {
      header: type === 'header' 
        ? (validatedData.header || { name: '', taxId: '', date: '', documentNumber: '' })
        : { name: '', taxId: '', date: '', documentNumber: '' },
      details: type === 'details' 
        ? (validatedData.details || [])
        : []
    };

    return {
      data,
      rawText,
      interpretedText: JSON.stringify(
        type === 'header' ? { header: data.header } : { details: data.details },
        null,
        2
      ),
      confidence
    };
  } catch (error: any) {
    console.error('Error processing zone:', error);
    throw new Error(error.message || 'Error al procesar la zona seleccionada');
  }
}