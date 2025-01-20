import React, { useState } from 'react';
import { Eye, EyeOff, AlertTriangle, RefreshCw, Terminal } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Modal } from './Modal';
import { ApiModal } from './ApiModal';

interface ParserDetailsProps {
  rawText: string;
  interpretedText: string;
  confidence: number;
  isOpen: boolean;
  onToggle: () => void;
  onRetry?: () => void;
  logs?: Array<{
    timestamp: string;
    type: 'request' | 'response' | 'error';
    data: any;
  }>;
}

export function ParserDetails({
  rawText,
  interpretedText,
  confidence,
  isOpen,
  onToggle,
  onRetry,
  logs = []
}: ParserDetailsProps) {
  const [showApiModal, setShowApiModal] = useState(false);
  const showAIWarning = !import.meta.env.VITE_DEEPSEEK_API_KEY || 
    import.meta.env.VITE_DEEPSEEK_API_KEY === 'your_deepseek_api_key_here';

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-4">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-700">Detalles del Procesamiento</h3>
            {showAIWarning ? (
              <div className="flex items-center gap-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                LLM deshabilitado
              </div>
            ) : (
              <div
                className={cn(
                  "px-2 py-0.5 text-xs rounded-full",
                  confidence >= 80 ? "bg-green-100 text-green-800" :
                  confidence >= 50 ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                )}
              >
                {confidence}% confianza
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowApiModal(true)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-gray-200",
                logs.length > 0 
                  ? "bg-gray-100 text-gray-700" 
                  : "bg-gray-50 text-gray-500"
              )}
            >
              <Terminal className="w-3 h-3" />
              Ver API Logs
              {logs.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
                  {logs.length}
                </span>
              )}
            </button>
            {onRetry && (
              <button
                onClick={onRetry}
                className="p-1 hover:bg-gray-100 rounded-full"
                title="Reintentar procesamiento"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              {isOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {isOpen && (
          <div className="divide-y">
            {showAIWarning && (
              <div className="p-4">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm">
                  La interpretación LLM está deshabilitada. Para habilitarla:
                  <ol className="list-decimal ml-4 mt-2">
                    <li>Copie el archivo .env.example a .env</li>
                    <li>Agregue su clave de API de DeepSeek en el archivo .env</li>
                    <li>Reinicie la aplicación</li>
                  </ol>
                </div>
              </div>
            )}
            
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Texto Extraído</h4>
              <pre className="bg-gray-50 p-3 rounded-md text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                {rawText || 'No se ha extraído texto aún'}
              </pre>
            </div>
            
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Interpretación</h4>
              <pre className="bg-gray-50 p-3 rounded-md text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                {interpretedText || 'No hay interpretación disponible'}
              </pre>
            </div>
          </div>
        )}
      </div>

      <ApiModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        logs={logs}
      />
    </>
  );
}