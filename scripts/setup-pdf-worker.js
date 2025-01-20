import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function setupPdfWorker() {
  try {
    const publicDir = path.resolve(__dirname, '../public');
    const distDir = path.resolve(__dirname, '../dist');

    // Ensure directories exist
    await fs.mkdir(publicDir, { recursive: true });
    await fs.mkdir(distDir, { recursive: true });

    // Path to pdf.worker.min.js in node_modules
    const workerSrc = path.resolve(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.js');

    // Copy to public directory for development
    const publicWorkerDest = path.resolve(publicDir, 'pdf.worker.min.js');
    try {
      await fs.unlink(publicWorkerDest);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await fs.copyFile(workerSrc, publicWorkerDest);

    // Copy to dist directory for production
    const distWorkerDest = path.resolve(distDir, 'pdf.worker.min.js');
    try {
      await fs.unlink(distWorkerDest);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await fs.copyFile(workerSrc, distWorkerDest);

    console.log('✓ PDF.js worker files copied successfully');
  } catch (error) {
    console.error('Error setting up PDF worker:', error);
    process.exit(1);
  }
}

setupPdfWorker();