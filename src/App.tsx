import React, { useState, useCallback } from 'react';
import { Upload, FileText, ArrowLeftCircle, Zap } from 'lucide-react';
import { PDFViewer } from './components/PDFViewer';
import { DataPreview } from './components/DataPreview';
import { ParserDetails } from './components/ParserDetails';
import { ProcessingDetails } from './components/ProcessingDetails';
import { Modal } from './components/Modal';
import { ChatAgent } from './components/ChatAgent';
import { useDocumentProcessing } from './hooks/useDocumentProcessing';
import { useApiLogs } from './hooks/useApiLogs';
import { DocumentData, Zone } from './types/document';
import { testDeepSeekConnection } from './utils/deepseek/test';
import { cn } from './utils/cn';
import { featureFlags } from './utils/featureFlags';

interface AppProps {
  onReturn?: (data: DocumentData) => void;
}

function App({ onReturn }: AppProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentData, setDocumentData] = useState<DocumentData>({
    header: { name: '', date: '', documentNumber: '', taxId: '' },
    details: [],
  });
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [showParserDetails, setShowParserDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parserInfo, setParserInfo] = useState({
    rawText: '',
    interpretedText: '',
    confidence: 0
  });
  const [testingApi, setTestingApi] = useState(false);

  const { logs, addLog, clearLogs } = useApiLogs();
  const {
    processing,
    processingState,
    processFile,
    processSelectedZone,
  } = useDocumentProcessing({ addLog });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError(null);
    clearLogs();

    try {
      const result = await processFile(uploadedFile);
      setDocumentData(result.data);
      setParserInfo({
        rawText: result.rawText,
        interpretedText: result.interpretedText,
        confidence: result.confidence
      });
    } catch (err: any) {
      setError(err.message || 'No se pudo procesar el documento automáticamente. Por favor, use la selección manual de zonas.');
      setShowPDFModal(true);
    }
  };

  const handleZoneSelect = async (zone: Zone, type: 'header' | 'details') => {
    if (!file || !featureFlags.isEnabled('enableManualZoneSelection')) return;

    try {
      const result = await processSelectedZone(file, zone, type);
      setDocumentData(prev => ({
        ...prev,
        ...(type === 'header' ? { header: result.data.header } : { details: result.data.details }),
      }));
      setParserInfo({
        rawText: result.rawText,
        interpretedText: result.interpretedText,
        confidence: result.confidence
      });
    } catch (err: any) {
      const errorMessage = `Error al procesar la zona de ${type === 'header' ? 'encabezado' : 'detalles'}: ${err.message}`;
      setError(errorMessage);
    }
  };

  const handleTestApi = async () => {
    if (!featureFlags.isEnabled('enableDeepSeek')) {
      setError('La integración con DeepSeek está temporalmente deshabilitada');
      return;
    }

    setTestingApi(true);
    setError(null);
    try {
      await testDeepSeekConnection();
      setError('Conexión exitosa con la API de DeepSeek');
    } catch (err: any) {
      setError(err.message || 'Error al probar la conexión con DeepSeek');
    } finally {
      setTestingApi(false);
    }
  };

  const handleRetry = useCallback(() => {
    if (!featureFlags.isEnabled('enableRetry')) return;

    setFile(null);
    setError(null);
    setDocumentData({
      header: { name: '', date: '', documentNumber: '', taxId: '' },
      details: [],
    });
    setParserInfo({
      rawText: '',
      interpretedText: '',
      confidence: 0
    });
    clearLogs();
  }, [clearLogs]);

  const handleReturn = useCallback(() => {
    if (onReturn) {
      const formattedData: DocumentData = {
        header: { ...documentData.header },
        details: documentData.details.map(item => ({
          ...item,
          quantity: Number(item.quantity) || 0,
          grossPrice: Number(item.grossPrice) || 0,
          discount: Number(item.discount) || 0,
          tax: Number(item.tax) || 0,
          netValue: Number(item.netValue) || 0,
        }))
      };
      onReturn(formattedData);
    }
  }, [documentData, onReturn]);

  const handleDocumentDataUpdate = useCallback((updates: Partial<DocumentData>) => {
    setDocumentData(prev => ({
      header: {
        ...prev.header,
        ...(updates.header || {})
      },
      details: updates.details || prev.details
    }));
  }, []);

  const handleNewDocument = useCallback(() => {
    handleRetry();
    setError(null);
  }, [handleRetry]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="w-8 h-8" />
              Importador de Documentos
            </h1>
            <div className="flex gap-4">
              {featureFlags.isEnabled('enableDeepSeek') && (
                <button
                  onClick={handleTestApi}
                  disabled={testingApi}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-white",
                    testingApi 
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-indigo-500 hover:bg-indigo-600"
                  )}
                >
                  <Zap className="w-4 h-4" />
                  {testingApi ? 'Probando API...' : 'Probar API'}
                </button>
              )}
              {file && (
                <>
                  <button
                    onClick={() => setShowPDFModal(true)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Ver Documento
                  </button>
                  <button
                    onClick={handleReturn}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <ArrowLeftCircle className="w-4 h-4" />
                    Enviar Datos
                  </button>
                </>
              )}
            </div>
          </div>

          {processing && (
            <ProcessingDetails
              state={processingState}
              apiLogs={logs}
              className="mb-6"
            />
          )}

          {error && (
            <div className={cn(
              "mb-6 px-4 py-3 rounded-lg",
              error.includes('exitosa') 
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            )}>
              {error}
            </div>
          )}

          <div className="space-y-6">
            <ChatAgent
              documentData={documentData}
              onUpdateDocumentData={handleDocumentDataUpdate}
              onNewDocument={handleNewDocument}
            />

            {!file ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-4">
                    <Upload className="w-12 h-12 text-gray-400" />
                    <span className="text-gray-600">
                      Haga clic para cargar o arrastre un archivo PDF
                    </span>
                  </div>
                </label>
              </div>
            ) : (
              <div className="space-y-6">
                <DataPreview
                  data={documentData}
                  onDataUpdate={setDocumentData}
                  readOnly={!featureFlags.isEnabled('enableDataEditing')}
                />
                <ParserDetails
                  rawText={parserInfo.rawText}
                  interpretedText={parserInfo.interpretedText}
                  confidence={parserInfo.confidence}
                  isOpen={showParserDetails}
                  onToggle={() => setShowParserDetails(!showParserDetails)}
                  onRetry={featureFlags.isEnabled('enableRetry') ? handleRetry : undefined}
                  logs={featureFlags.isEnabled('enableApiLogs') ? logs : []}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        title="Documento PDF"
      >
        {file && (
          <PDFViewer
            file={file}
            onZoneSelect={handleZoneSelect}
            onClose={() => setShowPDFModal(false)}
          />
        )}
      </Modal>
    </div>
  );
}

export default App;