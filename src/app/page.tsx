'use client';

import {useState} from 'react';
import {UploadForm} from '@/components/UploadForm';
import {StatusLog} from '@/components/StatusLog';
import {DocumentationEditor} from '@/components/DocumentationEditor';
import {RefinementChat} from '@/components/RefinementChat';
import {DebugSection} from '@/components/DebugSection';
import {useSession} from '@/hooks/useSession';
import {usePipeline} from '@/hooks/usePipeline';
import {useChat} from '@/hooks/useChat';

export default function Home() {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

    const {
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
    } = useSession();

    const {
        isLoading,
        handleAbort,
        handleSubmit
    } = usePipeline({
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
    });

    const {
        chatInput,
        setChatInput,
        isChatLoading,
        handleChatSubmit
    } = useChat({
        result,
        chatMessages,
        statusLog,
        debugMode,
        elapsedTime,
        setChatMessages,
        setResult,
        setError,
        saveSession
    });

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const toggleAccordion = (key: string) => {
        setOpenAccordions(prev => ({...prev, [key]: !prev[key]}));
    };

    const onClear = () => {
        setFile(null);
        setError(null);
        setProgress(0);
        clearSession();
        const fileInput = document.getElementById('video') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    return (
        <main style={{padding: '2rem', maxWidth: '1600px', margin: '15px auto'}}>
            <h1>Documentation Vision</h1>

            <UploadForm
                file={file}
                setFile={setFile}
                debugMode={debugMode}
                setDebugMode={setDebugMode}
                isLoading={isLoading}
                handleSubmit={handleSubmit}
                handleAbort={handleAbort}
                handleClear={onClear}
                showClear={result !== null || statusLog.length > 0}
            />

            <StatusLog
                isLoading={isLoading}
                progress={progress}
                elapsedTime={elapsedTime}
                statusLog={statusLog}
                formatTime={formatTime}
            />

            {error && (
                <div className="error" style={{color: 'red', marginBottom: '1rem'}}>
                    <h3>Error</h3>
                    <p>{error}</p>
                </div>
            )}

            {result && (
                <div className="result">
                    <div style={{display: 'flex', gap: '2rem', alignItems: 'flex-start'}}>
                        <DocumentationEditor
                            content={result.finalDocumentation}
                            isChatLoading={isChatLoading}
                        />

                        <RefinementChat
                            chatMessages={chatMessages}
                            chatInput={chatInput}
                            setChatInput={setChatInput}
                            isChatLoading={isChatLoading}
                            handleChatSubmit={handleChatSubmit}
                        />
                    </div>

                    {result.debugData && (
                        <DebugSection
                            debugData={result.debugData}
                            openAccordions={openAccordions}
                            toggleAccordion={toggleAccordion}
                            outputPath={result.outputPath}
                        />
                    )}
                </div>
            )}
        </main>
    );
}
