import * as pdfjsLib from 'pdfjs-dist';
import { Zone } from '@/types/document';

// Configure PDF.js worker
const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Initialize worker only once
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export async function getPdfDocument(file: File) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: true,
      isEvalSupported: true,
      useSystemFonts: true,
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    });
    
    return loadingTask.promise;
  } catch (error) {
    console.error('Error loading PDF document:', error);
    throw new Error('Error al cargar el documento PDF');
  }
}

export function getPageViewport(page: pdfjsLib.PDFPageProxy, scale: number = 2.0) {
  return page.getViewport({ scale });
}

export async function extractTextFromPdf(file: File, zone?: Zone): Promise<string> {
  try {
    const pdf = await getPdfDocument(file);
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
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Error al extraer texto del PDF. Por favor, asegúrese de que el documento no esté protegido y contenga texto seleccionable.');
  }
}