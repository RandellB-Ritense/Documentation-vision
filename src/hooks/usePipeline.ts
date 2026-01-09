import { useState, useEffect } from 'react';
import { ChatMessage } from '@/lib/types';

interface UsePipelineProps {
  file: File | null;
  debugMode: boolean;
  setResult: (result: any) => void;
  setStatusLog: (updater: (prev: any[]) => any[]) => void;
  setProgress: (progress: number) => void;
  setElapsedTime: (time: number) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  setError: (error: string | null) => void;
  saveSession: (data: any) => void;
  STORAGE_KEY: string;
}

export function usePipeline({
  file,
  debugMode,
  setResult,
  setStatusLog,
  setProgress,
  setElapsedTime,
  setChatMessages,
  setError,
  saveSession,
  STORAGE_KEY
}: UsePipelineProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [currentElapsedTime, setCurrentElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      const startTime = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        setCurrentElapsedTime(now - startTime);
        setElapsedTime(now - startTime);
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, setElapsedTime]);

  const handleAbort = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setStatusLog(prev => [...prev, { 
        message: 'Processing aborted by user', 
        timestamp: new Date().toLocaleTimeString() 
      }]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a video file');
      return;
    }

    const controller = new AbortController();
    (controller.signal as any).startTime = Date.now();
    setAbortController(controller);
    setIsLoading(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setElapsedTime(0);
    setCurrentElapsedTime(0);
    setChatMessages([]);
    
    const initialLog = [{ message: 'Starting...', timestamp: new Date().toLocaleTimeString() }];
    setStatusLog(() => initialLog);
    localStorage.removeItem(STORAGE_KEY);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('debugMode', debugMode.toString());

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Something went wrong');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'progress') {
              if (data.progress !== -1) {
                setProgress(data.progress);
              }
              setStatusLog(prev => [
                ...prev, 
                { 
                  message: data.message, 
                  isDebug: data.isDebug, 
                  timestamp: new Date().toLocaleTimeString() 
                }
              ]);
            } else if (data.type === 'complete') {
              setResult(data.result);
              setProgress(100);
              
              setStatusLog(currentLog => {
                const totalElapsedTime = Date.now() - (controller.signal as any).startTime;
                saveSession({
                  result: data.result,
                  statusLog: currentLog,
                  debugMode,
                  chatMessages: [],
                  elapsedTime: totalElapsedTime
                });
                return currentLog;
              });
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Aborted
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  return {
    isLoading,
    handleAbort,
    handleSubmit
  };
}
