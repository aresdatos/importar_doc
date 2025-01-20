import { createWorker, createScheduler, Worker } from 'tesseract.js';

class TesseractWorkerManager {
  private static instance: TesseractWorkerManager;
  private scheduler = createScheduler();
  private initialized = false;

  private constructor() {}

  static getInstance(): TesseractWorkerManager {
    if (!TesseractWorkerManager.instance) {
      TesseractWorkerManager.instance = new TesseractWorkerManager();
    }
    return TesseractWorkerManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    await this.scheduler.addWorker(worker);
    this.initialized = true;
  }

  async recognize(imageUrl: string, rectangle?: { left: number; top: number; width: number; height: number }) {
    await this.initialize();
    return this.scheduler.addJob('recognize', imageUrl, { rectangle });
  }

  async terminate(): Promise<void> {
    await this.scheduler.terminate();
    this.initialized = false;
  }
}

export const tesseractWorker = TesseractWorkerManager.getInstance();