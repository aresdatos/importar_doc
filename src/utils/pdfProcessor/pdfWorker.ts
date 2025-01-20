import * as pdfjsLib from 'pdfjs-dist';
import { Zone } from '@/types/document';

// Configure PDF.js worker
const workerSrc = '/pdf.worker.min.js';
let workerInitialized = false;

async function initializeWorker() {
  if (!workerInitialized) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
      workerInitialized = true;
    } catch (error) {
      console.error('Error initializing PDF worker:', error);
      throw new Error('Failed to initialize PDF worker');
    }
  }
}

export async function getPdfDocument(file: File) {
  try {
    await initializeWorker();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    });
    
    return loadingTask.promise;
  } catch (error) {
    console.error('Error loading PDF document:', error);
    throw new Error('Failed to load PDF document');
  }
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
    throw new Error('Failed to extract text from PDF');
  }
}