import React, { useState } from 'react';
import { Terminal, Clock, ArrowUp, ArrowDown, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ApiLog {
  timestamp: string;
  type: 'request' | 'response' | 'error';
  data: any;
}

interface ApiLogViewerProps {
  logs: ApiLog[];
  className?: string;
}

export function ApiLogViewer({ logs, className }: ApiLogViewerProps) {
  const [expandedLogs, setExpandedLogs] = useState<number[]>([]);

  const toggleExpand = (index: number) => {
    setExpandedLogs(prev => 
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  if (!logs.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Terminal className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p>No hay registros de API disponibles</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {logs.map((log, index) => (
        <div
          key={index}
          className={cn(
            "border rounded-lg overflow-hidden",
            log.type === 'error' ? "border-red-200" : "border-gray-200"
          )}
        >
          <button
            onClick={() => toggleExpand(index)}
            className={cn(
              "w-full px-4 py-2 flex items-center gap-2 text-left",
              log.type === 'request' ? "bg-blue-50" :
              log.type === 'response' ? "bg-green-50" :
              "bg-red-50"
            )}
          >
            {log.type === 'request' ? (
              <ArrowUp className="w-4 h-4 text-blue-600" />
            ) : log.type === 'response' ? (
              <ArrowDown className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            
            <span className={cn(
              "text-sm font-medium",
              log.type === 'request' ? "text-blue-700" :
              log.type === 'response' ? "text-green-700" :
              "text-red-700"
            )}>
              {log.type === 'request' ? 'Solicitud API' :
               log.type === 'response' ? 'Respuesta API' :
               'Error'}
            </span>
            
            <div className="flex items-center gap-1 ml-auto text-gray-500">
              <Clock className="w-3 h-3" />
              <span className="text-xs">
                {new Date(log.timestamp).toLocaleString()}
              </span>
              {expandedLogs.includes(index) ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>
          
          {expandedLogs.includes(index) && (
            <div className="p-4 bg-gray-50">
              <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}