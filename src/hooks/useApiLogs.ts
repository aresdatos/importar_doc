import { useState, useCallback } from 'react';

interface LogEntry {
  timestamp: string;
  type: 'request' | 'response' | 'error';
  data: any;
}

export function useApiLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((type: LogEntry['type'], data: any) => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      type,
      data,
    }]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    addLog,
    clearLogs,
  };
}