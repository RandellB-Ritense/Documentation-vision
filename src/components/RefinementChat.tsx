'use client';

import React from 'react';
import {ChatMessage} from '@/lib/types';

interface RefinementChatProps {
    chatMessages: ChatMessage[];
    chatInput: string;
    setChatInput: (input: string) => void;
    isChatLoading: boolean;
    handleChatSubmit: (e: React.FormEvent) => void;
}

export function RefinementChat({
                                   chatMessages,
                                   chatInput,
                                   setChatInput,
                                   isChatLoading,
                                   handleChatSubmit
                               }: RefinementChatProps) {
    return (
        <div className="chat-section" style={{
            flex: '0 0 450px',
            border: '1px solid #eee',
            borderRadius: '8px',
            padding: '1.5rem',
            backgroundColor: '#fafafa',
            position: 'sticky',
            top: '2rem'
        }}>
            <h3>Refine Documentation</h3>
            <p style={{color: '#666', fontSize: '0.9rem', marginBottom: '1rem'}}>
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
                    <div style={{textAlign: 'center', color: '#999', padding: '2rem', fontStyle: 'italic'}}>
                        No refinement requests yet.
                    </div>
                )}
                {chatMessages.map((msg, i) => (
                    <div key={i} style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        backgroundColor: msg.role === 'user' ? '#1f5391' : '#e9ecef',
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
                    <div style={{
                        alignSelf: 'flex-start',
                        backgroundColor: '#e9ecef',
                        color: '#666',
                        padding: '0.6rem 1rem',
                        borderRadius: '12px',
                        fontSize: '0.9rem'
                    }}>
                        Updating documentation...
                    </div>
                )}
            </div>

            <form onSubmit={handleChatSubmit}
                  style={{display: 'flex', gap: '10px', width: '100%', alignItems: 'center', flexDirection: 'column'}}>
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
    );
}
