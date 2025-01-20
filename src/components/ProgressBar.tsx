import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ProgressState {
  progress: number;
  status: string;
  variant: 'default' | 'success' | 'error';
  command?: string;
  output?: string;
  shouldPersist?: boolean;
}

interface ProgressBarProps {
  state: ProgressState;
  className?: string;
}

export function ProgressBar({ state, className }: ProgressBarProps) {
  const [currentProgress, setCurrentProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Smoothly animate progress changes
    const interval = setInterval(() => {
      setCurrentProgress(prev => {
        if (prev < state.progress) {
          return Math.min(prev + 2, state.progress);
        }
        return prev;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [state.progress]);

  useEffect(() => {
    // Keep visible if shouldPersist is true or progress is not complete
    if (state.shouldPersist || currentProgress < 100) {
      setVisible(true);
    }
  }, [state.shouldPersist, currentProgress]);

  if (!visible) return null;

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {state.variant === 'success' && currentProgress >= 100 ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : state.variant === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          ) : currentProgress >= 100 ? (
            <CheckCircle className="w-5 h-5 text-blue-500" />
          ) : (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          )}
          <span className={cn(
            "text-sm font-medium",
            state.variant === 'success' && "text-green-700",
            state.variant === 'error' && "text-red-700",
            state.variant === 'default' && "text-gray-700"
          )}>
            {state.status}
          </span>
        </div>
        <span className="text-sm font-medium text-gray-700">
          {Math.round(currentProgress)}%
        </span>
      </div>
      
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300 rounded-full",
            state.variant === 'success' && "bg-green-500",
            state.variant === 'error' && "bg-red-500",
            state.variant === 'default' && "bg-blue-500"
          )}
          style={{ width: `${currentProgress}%` }}
        />
      </div>

      {state.variant === 'error' && (
        <div className="flex items-start gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              {state.status}
            </p>
            <p className="text-sm text-red-700 mt-1">
              Por favor, intente usar la selección manual de zonas para mejores resultados.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}