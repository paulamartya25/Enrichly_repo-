import { useEffect } from 'react';
import { Execution } from './types';

export function useExecutionStream(onUpdate: (execution: Execution) => void) {
  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const es = new EventSource(`${API_URL}/api/executions/stream`, { withCredentials: true });
    
    es.onmessage = (e) => {
      try {
        const update = JSON.parse(e.data);
        onUpdate(update);
      } catch (err) {
        console.error('Failed to parse SSE message', err);
      }
    };
    
    return () => es.close();
  }, [onUpdate]);
}
