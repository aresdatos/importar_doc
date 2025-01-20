import { Zone } from '@/types/document';
import { extractTextFromPdf } from './pdfProcessor';

export async function performOCR(file: File, zone?: Zone): Promise<string> {
  try {
    return await extractTextFromPdf(file, zone);
  } catch (error) {
    console.error('Error performing OCR:', error);
    throw new Error('Failed to perform text recognition');
  }
}

export const cleanupOCRWorkers = async () => {
  // No cleanup needed as we're using PDF text extraction directly
};