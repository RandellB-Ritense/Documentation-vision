import {useState} from 'react';
import {ChatMessage} from '@/lib/types';

interface UseChatProps {
    result: any;
    chatMessages: ChatMessage[];
    statusLog: any[];
    debugMode: boolean;
    elapsedTime: number;
    setChatMessages: (messages: ChatMessage[]) => void;
    setResult: (result: any) => void;
    setError: (error: string | null) => void;
    saveSession: (data: any) => void;
}

export function useChat({
                            result,
                            chatMessages,
                            statusLog,
                            debugMode,
                            elapsedTime,
                            setChatMessages,
                            setResult,
                            setError,
                            saveSession
                        }: UseChatProps) {
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !result || isChatLoading) return;

        const newUserMessage: ChatMessage = {role: 'user', content: chatInput};
        const updatedMessages = [...chatMessages, newUserMessage];

        setChatMessages(updatedMessages);
        setChatInput('');
        setIsChatLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
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

                saveSession({
                    result: newResult,
                    statusLog,
                    debugMode,
                    chatMessages: finalMessages,
                    elapsedTime
                });

                return newResult;
            });

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsChatLoading(false);
        }
    };

    return {
        chatInput,
        setChatInput,
        isChatLoading,
        handleChatSubmit
    };
}
