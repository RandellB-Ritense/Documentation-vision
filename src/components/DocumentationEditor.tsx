'use client';

import React from 'react';
import Editor from '@monaco-editor/react';

interface DocumentationEditorProps {
    content: string;
    isChatLoading: boolean;
}

export function DocumentationEditor({
                                        content,
                                        isChatLoading
                                    }: DocumentationEditorProps) {
    return (
        <div style={{flex: '1', minWidth: '0'}}>
            <h3>Generated Documentation</h3>
            <div style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '2rem',
                opacity: isChatLoading ? 0.6 : 1,
                transition: 'opacity 0.2s ease-in-out',
                backgroundColor: isChatLoading ? '#f5f5f5' : 'transparent'
            }}>
                <Editor
                    height="700px"
                    defaultLanguage="markdown"
                    value={content}
                    options={{
                        readOnly: isChatLoading,
                        minimap: {enabled: false},
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                    }}
                />
            </div>
        </div>
    );
}
