'use client';

import React from 'react';
import Editor from '@monaco-editor/react';

interface DebugSectionProps {
  debugData: {
    analysis: string;
    versions: string[];
  };
  openAccordions: Record<string, boolean>;
  toggleAccordion: (key: string) => void;
  outputPath?: string;
}

export function DebugSection({
  debugData,
  openAccordions,
  toggleAccordion,
  outputPath
}: DebugSectionProps) {
  return (
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
              value={debugData.analysis}
              options={{ readOnly: true, minimap: { enabled: false }, wordWrap: 'on' }}
            />
          </div>
        )}
      </div>

      {debugData.versions.map((version: string, i: number) => (
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

      {outputPath && (
        <p style={{ marginTop: '1rem' }}>
          Also saved to: <code>{outputPath}</code>
        </p>
      )}
    </div>
  );
}
