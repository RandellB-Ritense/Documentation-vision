'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusLog, setStatusLog] = useState<{message: string, isDebug?: boolean, timestamp: string}[]>([]);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a video file');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setStatusLog([{ message: 'Starting...', timestamp: new Date().toLocaleTimeString() }]);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('debugMode', debugMode.toString());

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
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
              setStatusLog(prev => [...prev, { 
                message: data.message, 
                isDebug: data.isDebug, 
                timestamp: new Date().toLocaleTimeString() 
              }]);
            } else if (data.type === 'complete') {
              setResult(data.result);
              setProgress(100);
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
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
          disabled={isLoading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: isLoading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Processing...' : 'Run Pipeline'}
        </button>
      </form>

      {isLoading && (
        <div style={{ marginBottom: '2rem' }}>
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
          <h3>Generated Documentation</h3>
          <div style={{ border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden', marginBottom: '2rem' }}>
            <Editor
              height="600px"
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
