import React, { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, XCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface TerminalEntry {
  command?: string;
  output?: string;
  timestamp: string;
  type: 'info' | 'error' | 'success';
}

interface TerminalOutputProps {
  entries: TerminalEntry[];
  className?: string;
  maxHeight?: string;
}

export function TerminalOutput({ entries, className, maxHeight = '300px' }: TerminalOutputProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <TerminalIcon className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p>No hay registros de terminal disponibles</p>
      </div>
    );
  }

  return (
    <div 
      ref={terminalRef}
      className={cn(
        "bg-gray-900 rounded-lg overflow-hidden font-mono text-sm",
        className
      )}
      style={{ maxHeight }}
    >
      <div className="border-b border-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-gray-400 text-xs">Terminal Output</span>
        </div>
      </div>

      <div className="p-4 space-y-2 overflow-y-auto">
        {entries.map((entry, index) => (
          <div key={index} className="space-y-1">
            {entry.command && (
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-green-400">$</span>
                <code>{entry.command}</code>
              </div>
            )}
            {entry.output && (
              <div className={cn(
                "pl-4 whitespace-pre-wrap",
                entry.type === 'error' && "text-red-400",
                entry.type === 'success' && "text-green-400",
                entry.type === 'info' && "text-gray-300"
              )}>
                {entry.output}
              </div>
            )}
            <div className="text-xs text-gray-600 pl-4">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}