'use client';

import React from 'react';

interface StatusLogProps {
  isLoading: boolean;
  progress: number;
  elapsedTime: number;
  statusLog: {message: string, isDebug?: boolean, timestamp: string}[];
  formatTime: (ms: number) => string;
}

export function StatusLog({
  isLoading,
  progress,
  elapsedTime,
  statusLog,
  formatTime
}: StatusLogProps) {
  if (!isLoading && progress === 0) return null;

  return (
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
          backgroundColor: '#1f5391', 
          height: '100%', 
          transition: 'width 0.3s ease' 
        }} />
      </div>
      <div style={{ 
        maxHeight: isLoading ? '300px' : '0px', 
        overflowY: 'auto', 
        backgroundColor: '#f8f9fa', 
        padding: isLoading ? '1rem' : '0', 
        borderRadius: '4px',
        fontSize: '0.9rem',
        border: isLoading ? '1px solid #ddd' : 'none',
        fontFamily: 'monospace',
        transition: 'all 0.3s ease',
        opacity: isLoading ? 1 : 0,
        pointerEvents: isLoading ? 'auto' : 'none'
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
  );
}
