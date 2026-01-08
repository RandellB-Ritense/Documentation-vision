'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { ChatMessage } from '@/lib/types';

const STORAGE_KEY = 'doc-vision-session';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusLog, setStatusLog] = useState<{message: string, isDebug?: boolean, timestamp: string}[]>([]);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      const startTime = Date.now();
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  useEffect(() => {
    const savedSession = localStorage.getItem(STORAGE_KEY);
    if (savedSession) {
      try {
        const { result, statusLog, debugMode, chatMessages, elapsedTime } = JSON.parse(savedSession);
        setResult(result);
        setStatusLog(statusLog);
        setDebugMode(debugMode);
        setChatMessages(chatMessages || []);
        setProgress(100);
        if (elapsedTime) setElapsedTime(elapsedTime);
      } catch (e) {
        console.error('Failed to load saved session', e);
      }
    }
  }, []);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setStatusLog([]);
    setChatMessages([]);
    setChatInput('');
    setElapsedTime(0);
    localStorage.removeItem(STORAGE_KEY);
    // Reset file input manually since it's uncontrolled for the value
    const fileInput = document.getElementById('video') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

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
    setChatMessages([]);
    setChatInput('');
    const initialLog = [{ message: 'Starting...', timestamp: new Date().toLocaleTimeString() }];
    setStatusLog(initialLog);
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
              setStatusLog(prev => {
                const newLog = [...prev, { 
                  message: data.message, 
                  isDebug: data.isDebug, 
                  timestamp: new Date().toLocaleTimeString() 
                }];
                return newLog;
              });
            } else if (data.type === 'complete') {
              setResult(data.result);
              setProgress(100);
              // Save to local storage after completion
              setStatusLog(currentLog => {
                // We need to capture the elapsed time at this moment
                // Since this is inside setStatusLog, we use a trick or just use the current elapsedTime
                // but elapsedTime state might be updated by the interval.
                // Actually, isLoading is set to false in finally block, which stops the interval.
                // So at 'complete' time, elapsedTime should be the total time.
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                  result: data.result,
                  statusLog: currentLog,
                  debugMode,
                  chatMessages: [],
                  elapsedTime: Date.now() - (controller.signal as any).startTime // We'll add startTime to controller
                }));
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
        console.log('Fetch aborted');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !result || isChatLoading) return;

    const newUserMessage: ChatMessage = { role: 'user', content: chatInput };
    const updatedMessages = [...chatMessages, newUserMessage];
    
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsChatLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentDocument: result.finalDocumentation,
          messages: updatedMessages
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to refine documentation');
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: 'I have updated the documentation based on your request.' 
      };
      const finalMessages = [...updatedMessages, assistantMessage];
      
      setChatMessages(finalMessages);
      setResult((prev: any) => {
        const newResult = {
          ...prev,
          finalDocumentation: data.refinedDocument
        };

        // Update local storage
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          result: newResult,
          statusLog,
          debugMode,
          chatMessages: finalMessages,
          elapsedTime
        }));

        return newResult;
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '1600px', margin: '15px auto' }}>
      <h1>Documentation Vision</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label htmlFor="video" style={{ display: 'block', marginBottom: '0.5rem' }}>Video File</label>
          <input
            type="file"
            id="video"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </div>

        <div className="form-group toggle-group" style={{ marginBottom: '1rem' }}>
          <input
            type="checkbox"
            id="debugMode"
            checked={debugMode}
            onChange={(e) => setDebugMode(e.target.checked)}
          />
          <label htmlFor="debugMode" style={{ marginLeft: '0.5rem' }}>Enable Debug Mode</label>
        </div>

        <button 
          type="submit" 
          disabled={isLoading || !file}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: isLoading || !file ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading || !file ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {isLoading ? 'Processing...' : 'Run Pipeline'}
        </button>

        {isLoading && (
          <button 
            type="button" 
            onClick={handleAbort}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ff4d4f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Abort
          </button>
        )}

        {!isLoading && (result || statusLog.length > 0) && (
          <button 
            type="button" 
            onClick={handleClear}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Start New
          </button>
        )}
      </form>

      {(isLoading || progress > 0) && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold' }}>Progress: {progress}%</span>
            <span style={{ fontFamily: 'monospace', backgroundColor: '#333', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
              {formatTime(elapsedTime)}
            </span>
          </div>
          <div style={{ 
            width: '100%', 
            backgroundColor: '#eee', 
            borderRadius: '10px', 
            height: '20px', 
            marginBottom: '1rem',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${progress}%`, 
              backgroundColor: '#0070f3', 
              height: '100%', 
              transition: 'width 0.3s ease' 
            }} />
          </div>
          <div style={{ 
            maxHeight: '300px', 
            overflowY: 'auto', 
            backgroundColor: '#f8f9fa', 
            padding: '1rem', 
            borderRadius: '4px',
            fontSize: '0.9rem',
            border: '1px solid #ddd',
            fontFamily: 'monospace'
          }}>
            {statusLog.map((log, i) => (
              <div key={i} style={{ 
                marginBottom: '0.2rem', 
                color: log.isDebug ? '#0066cc' : 'inherit',
                fontStyle: log.isDebug ? 'italic' : 'normal'
              }}>
                <span style={{ color: '#666' }}>[{log.timestamp}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="error" style={{ color: 'red', marginBottom: '1rem' }}>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="result">
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            <div style={{ flex: '1', minWidth: '0' }}>
              <h3>Generated Documentation</h3>
              <div style={{ border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden', marginBottom: '2rem' }}>
                <Editor
                  height="700px"
                  defaultLanguage="markdown"
                  value={result.finalDocumentation}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            </div>

            <div className="chat-section" style={{ flex: '0 0 450px', border: '1px solid #eee', borderRadius: '8px', padding: '1.5rem', backgroundColor: '#fafafa', position: 'sticky', top: '2rem' }}>
              <h3>Refine Documentation</h3>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Ask to update the summary, add specific details, or reformat sections.
              </p>
              
              <div style={{ 
                height: '400px', 
                overflowY: 'auto', 
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8rem',
                border: '1px solid #eee',
                padding: '0.5rem',
                backgroundColor: 'white',
                borderRadius: '4px'
              }}>
                {chatMessages.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#999', padding: '2rem', fontStyle: 'italic' }}>
                    No refinement requests yet.
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{ 
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.role === 'user' ? '#0070f3' : '#e9ecef',
                    color: msg.role === 'user' ? 'white' : '#333',
                    padding: '0.6rem 1rem',
                    borderRadius: '12px',
                    maxWidth: '85%',
                    fontSize: '0.9rem',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    {msg.content}
                  </div>
                ))}
                {isChatLoading && (
                  <div style={{ alignSelf: 'flex-start', backgroundColor: '#e9ecef', color: '#666', padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.9rem' }}>
                    Updating documentation...
                  </div>
                )}
              </div>

              <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '10px', width: '100%', alignItems: 'center', flexDirection: 'column' }}>
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="e.g., 'Update the summary to emphasize security'..."
                  disabled={isChatLoading}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    outline: 'none',
                    fontSize: '0.95rem',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
                <button 
                  type="submit" 
                  disabled={isChatLoading || !chatInput.trim()}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    backgroundColor: isChatLoading || !chatInput.trim() ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isChatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    fontSize: '0.9rem'
                  }}
                >
                  Refine
                </button>
              </form>
            </div>
          </div>

          {result.debugData && (
            <div className="debug-section" style={{ marginTop: '2rem' }}>
              <h3>Debug Documents</h3>
              
              <div style={{ border: '1px solid #ddd', borderRadius: '4px', marginBottom: '1rem' }}>
                <button 
                  onClick={() => toggleAccordion('analysis')}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    textAlign: 'left',
                    background: '#f8f9fa',
                    color: '#333',
                    border: 'none',
                    borderBottom: openAccordions['analysis'] ? '1px solid #ddd' : 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>Vision Analysis</span>
                  <span>{openAccordions['analysis'] ? '−' : '+'}</span>
                </button>
                {openAccordions['analysis'] && (
                  <div style={{ height: '400px' }}>
                    <Editor
                      height="100%"
                      defaultLanguage="markdown"
                      value={result.debugData.analysis}
                      options={{ readOnly: true, minimap: { enabled: false }, wordWrap: 'on' }}
                    />
                  </div>
                )}
              </div>

              {result.debugData.versions.map((version: string, i: number) => (
                <div key={i} style={{ border: '1px solid #ddd', borderRadius: '4px', marginBottom: '1rem' }}>
                  <button 
                    onClick={() => toggleAccordion(`version-${i}`)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      textAlign: 'left',
                      background: '#f8f9fa',
                      color: '#333',
                      border: 'none',
                      borderBottom: openAccordions[`version-${i}`] ? '1px solid #ddd' : 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>Documentation Version {i + 1}</span>
                    <span>{openAccordions[`version-${i}`] ? '−' : '+'}</span>
                  </button>
                  {openAccordions[`version-${i}`] && (
                    <div style={{ height: '400px' }}>
                      <Editor
                        height="100%"
                        defaultLanguage="markdown"
                        value={version}
                        options={{ readOnly: true, minimap: { enabled: false }, wordWrap: 'on' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {result.outputPath && (
            <p style={{ marginTop: '1rem' }}>
              Also saved to: <code>{result.outputPath}</code>
            </p>
          )}
        </div>
      )}
    </main>
  );
}
