import { useState, useCallback, useEffect } from 'react';
import { DocumentData, Zone } from '@/types/document';
import { processDocument, processZone } from '@/utils/documentProcessor';
import { cleanupOCRWorkers } from '@/utils/ocrProcessor';
import { ProgressState } from '@/components/ProgressBar';

interface UseDocumentProcessingProps {
  addLog?: (type: 'request' | 'response' | 'error', data: any) => void;
}

export function useDocumentProcessing({ addLog }: UseDocumentProcessingProps = {}) {
  const [processing, setProcessing] = useState(false);
  const [processingState, setProcessingState] = useState<ProgressState>({
    progress: 0,
    status: '',
    variant: 'default',
    shouldPersist: false
  });

  useEffect(() => {
    return () => {
      cleanupOCRWorkers();
    };
  }, []);

  const updateProgress = useCallback((
    progress: number,
    status: string,
    command?: string,
    output?: string,
    variant: ProgressState['variant'] = 'default',
    shouldPersist: boolean = false
  ) => {
    setProcessingState({ progress, status, command, output, variant, shouldPersist });
  }, []);

  const processFile = useCallback(async (file: File) => {
    setProcessing(true);
    updateProgress(5, 'Iniciando procesamiento del documento...',
      'initialize_processing',
      '> Initializing document processing...'
    );

    try {
      updateProgress(20, 'Extrayendo texto del documento...',
        'extract_text',
        '> Extracting text content...\n> Analyzing document structure...'
      );

      updateProgress(40, 'Preparando interpretación con LLM...',
        'prepare_llm',
        '> Initializing LLM engine...\n> Preparing prompt...'
      );

      updateProgress(60, 'Interpretando Documento...',
        'process_llm',
        '> Processing document with AI...\n> Please wait...'
      );

      const result = await processDocument(file, addLog);

      updateProgress(80, 'Procesando respuesta del LLM...',
        'process_response',
        '> Processing LLM response...\n> Validating extracted data...'
      );

      if (!result.data.header.name && !result.data.details.length) {
        throw new Error('No se pudo extraer información del documento. Por favor, use la selección manual de zonas.');
      }

      updateProgress(100,
        'Documento procesado exitosamente',
        'process_complete',
        '✓ Document processed successfully\n✓ All validations passed',
        'success',
        true
      );

      return result;
    } catch (error: any) {
      console.error('Error processing document:', error);
      updateProgress(100,
        error.message || 'Error en el procesamiento automático',
        'process_error',
        `✘ Processing failed\n✘ ${error.message || 'Unknown error occurred'}`,
        'error',
        true
      );
      throw error;
    } finally {
      setProcessing(false);
    }
  }, [updateProgress, addLog]);

  const processSelectedZone = useCallback(async (
    file: File,
    zone: Zone,
    type: 'header' | 'details'
  ) => {
    setProcessing(true);
    const zoneType = type === 'header' ? 'encabezado' : 'detalles';

    updateProgress(10, `Procesando zona de ${zoneType}...`,
      'process_zone',
      `> Processing ${type} zone...`
    );

    try {
      updateProgress(30, 'Extrayendo texto de la zona...',
        'extract_zone',
        '> Extracting text from selected zone...'
      );

      updateProgress(50, 'Preparando interpretación con LLM...',
        'prepare_llm',
        '> Initializing LLM engine...\n> Preparing zone text...'
      );

      updateProgress(70, 'Interpretando Documento...',
        'process_llm',
        '> Processing with AI...\n> Please wait...'
      );

      const result = await processZone(file, zone, type, addLog);

      updateProgress(90, 'Procesando respuesta del LLM...',
        'process_response',
        '> Processing LLM response...\n> Validating extracted data...'
      );

      updateProgress(100,
        `Zona de ${zoneType} procesada exitosamente`,
        'process_complete',
        '✓ Zone processed successfully\n✓ All validations passed',
        'success',
        true
      );

      return result;
    } catch (error: any) {
      console.error('Error processing zone:', error);
      updateProgress(100,
        `Error al procesar la zona de ${zoneType}: ${error.message}`,
        'process_error',
        `✘ Zone processing failed\n✘ ${error.message || 'Unknown error occurred'}`,
        'error',
        true
      );
      throw error;
    } finally {
      setProcessing(false);
    }
  }, [updateProgress, addLog]);

  return {
    processing,
    processingState,
    processFile,
    processSelectedZone,
  };
}