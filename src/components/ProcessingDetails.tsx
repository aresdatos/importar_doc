import React from 'react';
import { ProgressBar, ProgressState } from './ProgressBar';
import { ApiLogViewer } from './ApiLogViewer';
import { cn } from '@/utils/cn';

interface ProcessingDetailsProps {
  state: ProgressState;
  apiLogs: Array<{
    timestamp: string;
    type: 'request' | 'response' | 'error';
    data: any;
  }>;
  className?: string;
}

export function ProcessingDetails({
  state,
  apiLogs,
  className
}: ProcessingDetailsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <ProgressBar state={state} />

      {apiLogs.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">API Logs</h4>
          <ApiLogViewer logs={apiLogs} />
        </div>
      )}
    </div>
  );
}