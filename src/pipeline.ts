import {cleanupAudio, extractFrames} from './index.js';
import { promises as fspromise } from 'fs';
import { processFramesInBatches } from './services/frameProcessor.js';
import { transcribeAudio } from './services/audioProcessor.js';
import { mergeAnalysisAndTranscription, generateFinalDocumentation } from './services/documentationGenerator.js';

async function main() {
    const videoPath = './testData/sample-video.mov';

    // Stage 1: Extract frames and audio from video
    console.log('Starting frame extraction...');

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

    // Stage 2: Process frames in batches using vision LLM
    const { batchResponses } = await processFramesInBatches(result.framesBase64, {
        model: "mistral-small-latest",
        temperature: 0.2,
        batchSize: 8
    });

    // Write analysis response to file
    await fspromise.writeFile('./analysis.md', batchResponses.join(''), 'utf8');

    // Stage 3: Transcribe audio
    const transcriptionText = await transcribeAudio(result.audioPath, {
        model: "voxtral-mini-latest",
        language: "en"
    });

    const audioPath = String(result.audioPath);
    console.log(typeof audioPath)
    await cleanupAudio(audioPath)

    // Stage 4: Merge analysis with transcription
    const mergedContent = await mergeAnalysisAndTranscription(
        batchResponses,
        {
            model: "mistral-small-latest",
            temperature: 0.7
        }
    );

    // Stage 5: Generate final documentation
    const finalDocumentation = await generateFinalDocumentation(
        mergedContent,
        transcriptionText,
        {
            model: "mistral-small-latest",
            temperature: 0.7
        }
    );

    // Write final documentation to file
    await fspromise.writeFile('./output.md', finalDocumentation, 'utf8');

    console.log('\n✓ Pipeline complete! Documentation written to output.md');
}

// Run if executed directly
main();
