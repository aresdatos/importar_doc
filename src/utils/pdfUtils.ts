import * as pdfjsLib from 'pdfjs-dist';
import { createCanvas } from 'canvas';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function convertPDFPageToImage(file: File, pageNumber: number = 1): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  const page = await pdf.getPage(pageNumber);
  
  const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d');

  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise;

  return canvas.toDataURL('image/png');
}

export async function extractPDFText(file: File): Promise<string | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    
    return textContent.items
      .map(item => 'str' in item ? item.str : '')
      .join(' ')
      .replace(/\s+/g, ' ');
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return null;
  }
}