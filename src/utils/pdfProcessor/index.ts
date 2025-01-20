import * as pdfjsLib from 'pdfjs-dist';
import { Zone } from '@/types/document';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractTextFromPdf(file: File, zone?: Zone): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: true,
      isEvalSupported: true,
      useSystemFonts: true,
    });
    
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent({
      normalizeWhitespace: true,
      disableCombineTextItems: false,
    });

    if (!zone) {
      // Return all text if no zone specified
      return textContent.items
        .map(item => 'str' in item ? item.str : '')
        .join(' ');
    }

    // Filter text items within the selected zone
    const viewport = page.getViewport({ scale: 1.0 });
    const textItems = textContent.items.filter(item => {
      if (!('str' in item) || !item.str.trim()) return false;
      
      const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
      return (
        x >= zone.x &&
        x <= zone.x + zone.width &&
        y >= zone.y &&
        y <= zone.y + zone.height
      );
    });

    return textItems
      .map(item => 'str' in item ? item.str : '')
      .join(' ');
  } catch (error: any) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Error al extraer texto del PDF. Por favor, asegúrese de que el documento no esté protegido por contraseña y contenga texto seleccionable.');
  }
}