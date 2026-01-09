import fs from 'fs';
import {mistralClient} from '../utils/mistralClient';
import {debug} from '../utils/debug';

export interface AudioTranscriptionOptions {
    model?: string;
    language?: string;
}

/**
 * Transcribe audio file using Mistral's audio transcription API
 * @param audioPath - Path to the audio file (optional)
 * @param options - Transcription options including model and language
 * @returns Transcription text or empty string if no audio path provided
 */
export async function transcribeAudio(
    audioPath: string | undefined,
    options: AudioTranscriptionOptions = {}
): Promise<string> {
    if (!audioPath) {
        debug('No audio file provided, skipping transcription');
        return '';
    }

    debug('Starting audio transcription...');

    const audio_file = fs.readFileSync(audioPath);
    const transcriptionResponse = await mistralClient.audio.transcriptions.complete({
        model: options.model || "voxtral-mini-latest",
        file: {
            fileName: "audio.mp3",
            content: audio_file,
        },
        language: options.language || "en"
    });

    const transcriptionText = transcriptionResponse.text || '';
    debug('✓ Audio transcription complete');

    return transcriptionText;
}
