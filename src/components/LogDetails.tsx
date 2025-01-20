import React from 'react';
import { Terminal, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/utils/cn';

interface LogEntry {
  timestamp: string;
  type: 'request' | 'response' | 'error';
  data: any;
}

interface LogDetailsProps {
  logs: LogEntry[];
  className?: string;
}

export function LogDetails({ logs, className }: LogDetailsProps) {
  if (logs.length === 0) return null;

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
              {log.type === 'request' ? 'API Request' :
               log.type === 'response' ? 'API Response' : 'Error'}
            </span>
            
            <span className="text-xs text-gray-500 ml-auto">
              {new Date(log.timestamp).toLocaleString()}
            </span>
          </div>
          
          <div className="p-4 bg-white">
            <pre className="text-xs font-mono bg-gray-50 p-3 rounded-md overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(log.data, null, 2)}
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
}