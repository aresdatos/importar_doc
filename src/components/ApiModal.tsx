import React from 'react';
import { Modal } from './Modal';
import { Terminal, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ApiLog {
  timestamp: string;
  type: 'request' | 'response' | 'error';
  data: any;
}

interface ApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ApiLog[];
}

export function ApiModal({ isOpen, onClose, logs }: ApiModalProps) {
  if (!isOpen) return null;

  const getRequestData = (log: ApiLog) => {
    if (log.type === 'request') {
      return {
        endpoint: log.data.endpoint,
        type: log.data.type,
        request: {
          messages: log.data.request.messages,
          temperature: log.data.request.temperature,
          max_tokens: log.data.request.max_tokens
        }
      };
    }
    return log.data;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="DeepSeek API Interaction Details"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Este registro muestra todas las interacciones con la API de DeepSeek durante el procesamiento del documento.
        </p>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {logs.map((log, index) => (
            <div
              key={index}
              className={cn(
                "border rounded-lg overflow-hidden",
                log.type === 'error' ? "border-red-200" : "border-gray-200"
              )}
            >
              <div className={cn(
                "px-4 py-2 flex items-center gap-2",
                log.type === 'request' && "bg-blue-50",
                log.type === 'response' && "bg-green-50",
                log.type === 'error' && "bg-red-50"
              )}>
                {log.type === 'request' ? (
                  <ArrowUp className="w-4 h-4 text-blue-600" />
                ) : log.type === 'response' ? (
                  <ArrowDown className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                
                <span className={cn(
                  "text-sm font-medium",
                  log.type === 'request' && "text-blue-700",
                  log.type === 'response' && "text-green-700",
                  log.type === 'error' && "text-red-700"
                )}>
                  {log.type === 'request' ? 'Solicitud API' :
                   log.type === 'response' ? 'Respuesta API' : 'Error'}
                  {log.type === 'request' && ` (${log.data.type})`}
                </span>
                
                <span className="text-xs text-gray-500 ml-auto">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              
              <div className="p-4 bg-gray-50">
                <pre className="text-xs font-mono bg-white p-3 rounded-md overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(getRequestData(log), null, 2)}
                </pre>
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Terminal className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>No hay registros de API disponibles</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}