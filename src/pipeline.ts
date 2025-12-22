import {extractFrames} from './index.js';
import {Mistral} from '@mistralai/mistralai';
import 'dotenv/config';
import { promises as fspromise} from 'fs';
import fs from "fs";
import {chunkArray} from "./chunker.js";
import {
    ANALYSIS_PROMPT,
    DOCUMENTATION_WRITER_PROMPT,
    FINAL_WRITER_PROMPT,
} from './prompts.js';

const apiKey = process.env.MISTRAL_API_KEY;

const client = new Mistral({apiKey: apiKey});

async function main() {
    const videoPath = './testData/sample-video.mov';

    console.log('Starting frame extraction...');
    console.log('');

    const result = await extractFrames(videoPath, {
        fps: 1,
        format: 'png',
        filenamePrefix: 'frame',
        extractAudio: true,
        audioFormat: 'mp3'
    });

    console.log(`\nExtraction complete!`);
    console.log(`Total frames extracted: ${result.frameCount}`);

    if (result.audioPath) {
        console.log(`Audio extracted to: ${result.audioPath}`);
    }

    // Split frames into batches of 8
    const BATCH_SIZE = 8;
    const frameBatches = chunkArray(result.framesBase64, BATCH_SIZE);

    console.log(`\nProcessing ${frameBatches.length} batches of up to ${BATCH_SIZE} frames each...`);

    // Process each batch and collect responses
    const batchResponses: string[] = [];

    // Send LLM request for each batch
    for (let i = 0; i < frameBatches.length; i++) {
        const batch = frameBatches[i];
        if (!batch) continue;

        const batchNumber = i + 1;

        console.log(`\nProcessing batch ${batchNumber}/${frameBatches.length} `);

        /*
        * First stage LLM (Analysis)
        * */

        // Send request to Mistral API
        const imageProcessResponse = await client.chat.complete({
            model: 'mistral-small-latest',
            temperature: 0.2,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text' as const,
                            text: ANALYSIS_PROMPT
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

    // Write analysis response to file
    await fspromise.writeFile('./analysis.md', String(batchResponses), 'utf8');

    console.log(`\nAll batches processed!`);


    /*
    * Second stage LLM (Transcription)
    * */

    let transcriptionText = '';
    
    if (result.audioPath) {
        const audio_file = fs.readFileSync(result.audioPath);
        const transcriptionResponse = await client.audio.transcriptions.complete({
            model: "voxtral-mini-latest",
            file: {
                fileName: "audio.mp3",
                content: audio_file,
            },
            language: "en"
        });
        transcriptionText = transcriptionResponse.text || '';
    }

    /*
    * Third stage LLM (Merging)
    * */

    // Join responses into single string so it can be sent to the LLM
    const flattenResponses = batchResponses.join('\n\n');

    const chatMergResponse = await client.chat.complete({
        model: "mistral-small-latest",
        temperature: 0.7,
        messages: [
            {
                role: 'system', content: DOCUMENTATION_WRITER_PROMPT
            },
            {role: 'user', content: `Rewrite this UI analysis into a documentation: ${flattenResponses} taken this transcript as the main story: ${transcriptionText}`}
        ]
    });

    if (!chatMergResponse || !chatMergResponse.choices[0]?.message?.content) throw new Error(
        `No response from Mistral API`
    )

    /*
    * Forth stage LLM (final formatting)
    * */

    const chatResponse = await client.chat.complete({
        model: "mistral-small-latest",
        temperature: 0.7,
        messages: [
            {
                role: 'system', content: FINAL_WRITER_PROMPT
            },
            {role: 'user', content: `Rewrite this documentation: ${flattenResponses} and keep ony the parts that are discused in this transcript: ${transcriptionText} to write a final version`}
        ]
    });

    if (!chatResponse || !chatResponse.choices[0]?.message?.content) throw new Error(
        `No response from Mistral API`
    )


    // Write response to file
    const mdContent = chatResponse.choices[0].message.content;
    await fspromise.writeFile('./output.md', String(mdContent), 'utf8');

    console.log('Done!');

}

// Run if executed directly
main();
