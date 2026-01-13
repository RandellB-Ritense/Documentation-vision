'use client';

import React from 'react';

interface UploadFormProps {
    file: File | null;
    setFile: (file: File | null) => void;
    debugMode: boolean;
    setDebugMode: (enabled: boolean) => void;
    isLoading: boolean;
    handleSubmit: (e: React.FormEvent) => void;
    handleAbort: () => void;
    handleClear: () => void;
    showClear: boolean;
}

export function UploadForm({
                               file,
                               setFile,
                               debugMode,
                               setDebugMode,
                               isLoading,
                               handleSubmit,
                               handleAbort,
                               handleClear,
                               showClear
                           }: UploadFormProps) {
    return (
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', maxWidth: "30%", gap: "1rem", marginBottom: '2rem', justifySelf: 'center'}}>
            <div style={{display: 'flex', flexDirection: 'column'}}>
                <div className="form-group" style={{marginBottom: '1rem'}}>
                    <label htmlFor="video" style={{display: 'block', marginBottom: '0.5rem'}}>Video File</label>
                    <input
                        type="file"
                        id="video"
                        accept="video/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        required
                    />
                </div>

                <div className="form-group toggle-group" style={{marginBottom: '1rem'}}>
                    <input
                        type="checkbox"
                        id="debugMode"
                        checked={debugMode}
                        onChange={(e) => setDebugMode(e.target.checked)}
                    />
                    <label htmlFor="debugMode" style={{marginLeft: '0.5rem'}}>Enable Debug Mode</label>
                </div>
            </div>
            <div style={{display: 'flex', flexDirection: "column"}}>
                <button
                    type="submit"
                    disabled={isLoading || !file}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: isLoading || !file ? '#ccc' : '#1f5391',
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

                {!isLoading && showClear && (
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
            </div>
        </form>
    );
}
