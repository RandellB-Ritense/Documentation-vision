import { mistralClient } from '../utils/mistralClient.js';
import { DOCUMENTATION_WRITER_SYSTEM_PROMPT, FINAL_WRITER_SYSTEM_PROMPT } from '../prompts.js';

export interface DocumentationGenerationOptions {
    model?: string;
    temperature?: number;
}

/**
 * Merge frame analysis with transcription to create initial documentation
 * @param batchResponses - Array of analysis responses from frame processing
 * @param options - Generation options including model and temperature
 * @returns Merged documentation content
 */
export async function mergeAnalysisAndTranscription(
    batchResponses: string[],
    options: DocumentationGenerationOptions = {}
): Promise<string> {
    console.log('\nMerging frame analysis with transcription...');

    const flattenResponses = batchResponses.join('\n\n');

    const chatMergeResponse = await mistralClient.chat.complete({
        model: options.model || "mistral-small-latest",
        temperature: options.temperature || 0.7,
        messages: [
            {
                role: 'system',
                content: DOCUMENTATION_WRITER_SYSTEM_PROMPT
            },
            {
                role: 'user',
                content: `Rewrite this UI analysis into a documentation: ${flattenResponses}`
            }
        ]
    });

    if (!chatMergeResponse || !chatMergeResponse.choices[0]?.message?.content) {
        throw new Error('No response from Mistral API during merge stage');
    }

    console.log('✓ Merge complete');

    const content = chatMergeResponse.choices[0].message.content;
    return typeof content === 'string' ? content : JSON.stringify(content);
}

/**
 * Generate final formatted documentation
 * @param analysisContent - Merged analysis content
 * @param transcriptionText - Transcribed audio text
 * @param options - Generation options including model and temperature
 * @returns Final formatted documentation
 */
export async function generateFinalDocumentation(
    analysisContent: string,
    transcriptionText: string,
    options: DocumentationGenerationOptions = {}
): Promise<string> {
    console.log('\nGenerating final documentation...');

    const chatResponse = await mistralClient.chat.complete({
        model: options.model || "mistral-small-latest",
        temperature: options.temperature || 0.7,
        messages: [
            {
                role: 'system',
                content: FINAL_WRITER_SYSTEM_PROMPT
            },
            {
                role: 'user',
                content:
                    `
                        You are given two inputs:
                        1. An analysis generated from a screen recording. This analysis may contain assumptions, inferred actions, or extra details.
                        2. A transcript generated from the same recording. The transcript is the source of truth and describes exactly what happens in the UI.
                        
                        Rewrite the analysis into final documentation using the following rules:
                        - Keep only information that is explicitly supported by the transcript.
                        - Remove any steps, actions, UI elements, or descriptions that do not appear in the transcript.
                        - If the analysis mentions something that is not confirmed by the transcript, it must be discarded.
                        - Do not add new information or assumptions.
                        
                        Input analysis:
                        ${analysisContent}
                        
                        Input transcript:
                        ${transcriptionText}
                    `
            }
        ]
    });

    if (!chatResponse || !chatResponse.choices[0]?.message?.content) {
        throw new Error('No response from Mistral API during final generation stage');
    }

    console.log('✓ Final documentation complete');

    const content = chatResponse.choices[0].message.content;
    return typeof content === 'string' ? content : JSON.stringify(content);
}
