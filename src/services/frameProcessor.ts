import { mistralClient } from '../utils/mistralClient.js';
import { chunkArray } from '../utils/chunker.js';
import { ANALYSIS_SYSTEM_PROMPT } from '../prompts.js';

export interface FrameProcessingOptions {
    batchSize?: number;
    model?: string;
    temperature?: number;
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

    const batchResponses: string[] = [];

    for (let i = 0; i < frameBatches.length; i++) {
        const batch = frameBatches[i];
        if (!batch) continue;

        const batchNumber = i + 1;
        console.log(`\nProcessing batch ${batchNumber}/${frameBatches.length}`);

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
            continue;
        }

        // Collect responses
        const content = imageProcessResponse.choices[0].message.content;
        batchResponses.push(`Batch ${batchNumber}:\n${content}\n\n`);

        console.log(`✓ Batch ${batchNumber} complete`);
    }

    console.log(`\nAll batches processed!`);

    return {
        batchResponses,
        totalBatches: frameBatches.length
    };
}
