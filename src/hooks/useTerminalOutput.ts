import { useState, useCallback } from 'react';

interface TerminalEntry {
  command?: string;
  output?: string;
  timestamp: string;
  type: 'info' | 'error' | 'success';
}

export function useTerminalOutput() {
  const [entries, setEntries] = useState<TerminalEntry[]>([]);

  const addEntry = useCallback((entry: Omit<TerminalEntry, 'timestamp'>) => {
    setEntries(prev => [...prev, {
      ...entry,
      timestamp: new Date().toISOString()
    }]);
  }, []);

  const clearEntries = useCallback(() => {
    setEntries([]);
  }, []);

  return {
    entries,
    addEntry,
    clearEntries
  };
}