#!/usr/bin/env node

import {cleanupAudio, extractFrames} from './index.js';
import { promises as fspromise } from 'fs';
import { processFramesInBatches } from './services/frameProcessor.js';
import { transcribeAudio } from './services/audioProcessor.js';
import { mergeAnalysisAndTranscription, generateFinalDocumentation } from './services/documentationGenerator.js';
import { Command } from 'commander';
import { join } from 'path';

async function runPipeline(videoPath: string, outputDir: string, namePrefix: string) {
    // Stage 1: Extract frames and audio from video
    console.log('Starting frame extraction...');

    const result = await extractFrames(videoPath, {
        fps: 1,
        format: 'png',
        filenamePrefix: 'frame',
        extractAudio: true,
        audioFormat: 'mp3'
    });

    console.log(`
                        \nExtraction complete!
                        \nTotal frames extracted: ${result.frameCount}
                       `);


    if (result.audioPath) {
        console.log(`Audio extracted to: ${result.audioPath}`);
    }

    // Stage 2: Process frames in batches using vision LLM
    const { batchResponses } = await processFramesInBatches(result.framesBase64, {
        model: "mistral-small-latest",
        temperature: 0.2,
        batchSize: 8
    });

    const analysisPath = join(outputDir, `${namePrefix}_analysis.md`);
    await fspromise.writeFile(analysisPath, batchResponses.join(''), 'utf8');

    // Stage 3: Transcribe audio
    const transcriptionText = await transcribeAudio(result.audioPath, {
        model: "voxtral-mini-latest",
        language: "en"
    });

    const audioPath = String(result.audioPath);
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
    const outputPath = join(outputDir, `${namePrefix}_output.md`);
    await fspromise.writeFile(outputPath, finalDocumentation, 'utf8');

    console.log(`\n✓ Pipeline complete!`);
    console.log(`  Analysis written to: ${analysisPath}`);
    console.log(`  Documentation written to: ${outputPath}`);
}

async function main() {
    const program = new Command();

    program
        .name('doc-vision')
        .description('Generate documentation from video using AI vision and transcription')
        .version('1.0.0')
        .requiredOption('-i, --input <video>', 'Input video file path')
        .requiredOption('-o, --output-dir <directory>', 'Output directory for generated files')
        .requiredOption('-n, --name <prefix>', 'Name prefix for output files')
        .action(async (options) => {
            try {
                await runPipeline(options.input, options.outputDir, options.name);
            } catch (error) {
                console.error('Error running pipeline:', error);
                process.exit(1);
            }
        });

    await program.parseAsync(process.argv);
}

// Run if executed directly
main();
