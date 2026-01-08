import { mistralClient } from '../utils/mistralClient';
import { chunkArray } from '../utils/chunker';
import { ANALYSIS_SYSTEM_PROMPT } from '../prompts';
import { debug, debugTime, debugTimeEnd } from '../utils/debug';

export interface FrameProcessingOptions {
    batchSize?: number;
    model?: string;
    temperature?: number;
    onProgress?: (current: number, total: number) => void;
}

export interface FrameProcessingResult {
    batchResponses: string[];
    totalBatches: number;
}

/**
 * Process frames in batches using Mistral's vision API
 * @param framesBase64 - Array of base64 encoded frame images
 * @param options - Processing options including batch size
 * @returns Array of analysis responses from the LLM
 */
export async function processFramesInBatches(
    framesBase64: string[],
    options: FrameProcessingOptions = {}
): Promise<FrameProcessingResult> {
    const BATCH_SIZE = options.batchSize || 8;
    const frameBatches = chunkArray(framesBase64, BATCH_SIZE);

    console.log(`\nProcessing ${frameBatches.length} batches of up to ${BATCH_SIZE} frames each...`);
    debug('Frame processing options:', options);
    debug('Total frames:', framesBase64.length);
    debug('Batch size:', BATCH_SIZE);
    debug('Number of batches:', frameBatches.length);

    const batchResponses: string[] = [];

    for (let i = 0; i < frameBatches.length; i++) {
        const batch = frameBatches[i];
        if (!batch) continue;
        
        const batchNumber = i + 1;
        console.log(`\nProcessing batch ${batchNumber}/${frameBatches.length}`);
        debug(`Batch ${batchNumber} contains ${batch.length} frames`);
        debugTime(`Batch ${batchNumber} processing`);

        // Send request to Mistral API
        const imageProcessResponse = await mistralClient.chat.complete({
            model: options.model || 'mistral-small-latest',
            temperature: options.temperature || 0.2,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text' as const,
                            text: ANALYSIS_SYSTEM_PROMPT
                        },
                        ...batch.map(base64Image => ({
                            type: 'image_url' as const,
                            imageUrl: base64Image,
                        })),
                    ],
                },
            ],
        });

        if (!imageProcessResponse || !imageProcessResponse.choices[0]?.message?.content) {
            console.warn(`Warning: No response for batch ${batchNumber}`);
            debugTimeEnd(`Batch ${batchNumber} processing`);
            continue;
        }

        // Collect responses
        const content = imageProcessResponse.choices[0].message.content;
        batchResponses.push(`Batch ${batchNumber}:\n${content}\n\n`);
        debug(`Batch ${batchNumber} response length:`, content.length, 'characters');

        if (options.onProgress) {
            options.onProgress(batchNumber, frameBatches.length);
        }

        debugTimeEnd(`Batch ${batchNumber} processing`);
        console.log(`✓ Batch ${batchNumber} complete`);
    }

    console.log(`\nAll batches processed!`);

    return {
        batchResponses,
        totalBatches: frameBatches.length
    };
}
