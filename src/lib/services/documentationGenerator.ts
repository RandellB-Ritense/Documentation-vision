import { mistralClient } from '../utils/mistralClient';
import { FINAL_WRITER_SYSTEM_PROMPT, AGGREGATOR_SYSTEM_PROMPT } from '../prompts';

export interface DocumentationGenerationOptions {
    model?: string;
    temperature?: number;
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
    console.log('Generating documentation version...');

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
        throw new Error('No response from Mistral API during documentation generation stage');
    }

    const content = chatResponse.choices[0].message.content;
    return typeof content === 'string' ? content : JSON.stringify(content);
}

/**
 * Aggregate multiple documentation versions into a single final document
 * @param documentationVersions - Array of documentation strings
 * @param options - Generation options
 * @returns Merged final documentation
 */
export async function aggregateDocumentation(
    documentationVersions: string[],
    options: DocumentationGenerationOptions = {}
): Promise<string> {
    console.log('\nAggregating documentation versions...');

    const versionsText = documentationVersions
        .map((doc, index) => `--- DOCUMENT VERSION ${index + 1} ---\n${doc}`)
        .join('\n\n');

    const chatResponse = await mistralClient.chat.complete({
        model: options.model || "mistral-small-latest",
        temperature: options.temperature || 0.2,
        messages: [
            {
                role: 'system',
                content: AGGREGATOR_SYSTEM_PROMPT
            },
            {
                role: 'user',
                content: `Please merge the following three documentation versions into a single final document:\n\n${versionsText}`
            }
        ]
    });

    if (!chatResponse || !chatResponse.choices[0]?.message?.content) {
        throw new Error('No response from Mistral API during aggregation stage');
    }

    console.log('✓ Final aggregated documentation complete');

    const content = chatResponse.choices[0].message.content;
    return typeof content === 'string' ? content : JSON.stringify(content);
}
