import { PDFPageProxy } from 'pdfjs-dist';
import { getPageViewport } from './pdfWorker';

export async function renderPageToImage(page: PDFPageProxy): Promise<string> {
  if (!page) {
    throw new Error('Invalid PDF page');
  }

  try {
    const viewport = getPageViewport(page);
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    // Clear the canvas
    context.fillStyle = 'white';
    context.fillRect(0, 0, viewport.width, viewport.height);

    // Set render parameters
    const renderContext = {
      canvasContext: context,
      viewport,
      background: 'white',
      intent: 'print' as const,
    };

    await page.render(renderContext).promise;
    return canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    console.error('Error rendering PDF page to image:', error);
    throw new Error('Failed to convert PDF page to image');
  }
}