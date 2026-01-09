import {useEffect, useState} from 'react';
import {ChatMessage} from '@/lib/types';

const STORAGE_KEY = 'doc-vision-session';

export function useSession() {
    const [result, setResult] = useState<any>(null);
    const [statusLog, setStatusLog] = useState<{ message: string, isDebug?: boolean, timestamp: string }[]>([]);
    const [debugMode, setDebugMode] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        const savedSession = localStorage.getItem(STORAGE_KEY);
        if (savedSession) {
            try {
                const {result, statusLog, debugMode, chatMessages, elapsedTime} = JSON.parse(savedSession);
                setResult(result);
                setStatusLog(statusLog);
                setDebugMode(debugMode);
                setChatMessages(chatMessages || []);
                if (elapsedTime) setElapsedTime(elapsedTime);
            } catch (e) {
                // Failed to load saved session
            }
        }
    }, []);

    const saveSession = (data: {
        result: any;
        statusLog: any[];
        debugMode: boolean;
        chatMessages: ChatMessage[];
        elapsedTime: number;
    }) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    const clearSession = () => {
        localStorage.removeItem(STORAGE_KEY);
        setResult(null);
        setStatusLog([]);
        setChatMessages([]);
        setElapsedTime(0);
    };

    return {
        result,
        setResult,
        statusLog,
        setStatusLog,
        debugMode,
        setDebugMode,
        chatMessages,
        setChatMessages,
        elapsedTime,
        setElapsedTime,
        saveSession,
        clearSession,
        STORAGE_KEY
    };
}
