import {cleanupAudio, extractFrames} from './index';
import {promises as fspromise} from 'fs';
import {processFramesInBatches} from './services/frameProcessor';
import {transcribeAudio} from './services/audioProcessor';
import {generateFinalDocumentation, aggregateDocumentation} from './services/documentationGenerator';
import {Command} from 'commander';
import {join} from 'path';
import {debug, isDebugEnabled, setDebugMode, setLogCallback} from './utils/debug';

export type ProgressUpdate = {
    stage: string;
    progress: number;
    message: string;
    isDebug?: boolean;
};

export async function runPipeline(
    videoPath: string, 
    outputDir?: string, 
    namePrefix?: string, 
    debugMode: boolean = false,
    onProgress?: (update: ProgressUpdate) => void
) {
    if (debugMode) {
        setDebugMode(true);
        setLogCallback((...args: any[]) => {
            if (onProgress) {
                const message = args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                onProgress({ stage: 'DEBUG', progress: -1, message, isDebug: true });
            }
        });
    } else {
        setLogCallback(null);
    }
    
    const notify = (progress: number, message: string) => {
        if (onProgress) {
            onProgress({ stage: message, progress, message });
        }
        console.log(message);
    };

    // Stage 1: Extract frames and audio from video
    notify(10, 'Starting frame extraction...');
    debug('Running pipeline with options:', {videoPath, outputDir, namePrefix});

    const result = await extractFrames(videoPath, {
        fps: 1,
        extractAudio: true
    });

    notify(25, `Extraction complete! Total frames: ${result.frameCount}`);

    if (result.audioPath) {
        debug(`Audio extracted to: ${result.audioPath}`);
    }

    // Stage 2: Process frames in batches using vision LLM
    notify(30, 'Processing frames with Vision LLM...');
    const {batchResponses} = await processFramesInBatches(result.framesBase64, {
        model: "mistral-small-latest",
        temperature: 0.2,
        batchSize: 8,
        onProgress: (current, total) => {
            // Map progress to 30% - 55% range
            const startProgress = 30;
            const endProgress = 55;
            const range = endProgress - startProgress;
            const incrementalProgress = Math.round(startProgress + (current / total) * range);
            notify(incrementalProgress, `Processing batch ${current}/${total}...`);
        }
    });

    // Only write analysis file if debug mode is enabled and outputDir is provided
    if (isDebugEnabled() && outputDir && namePrefix) {
        const analysisPath = join(outputDir, `${namePrefix}_analysis.md`);
        await fspromise.writeFile(analysisPath, batchResponses.join(''), 'utf8');
        debug('Analysis file written to:', analysisPath);
    }

    // Stage 3: Transcribe audio
    notify(55, 'Transcribing audio...');
    const transcriptionText = await transcribeAudio(result.audioPath, {
        model: "voxtral-mini-latest",
        language: "en"
    });

    // Clean up audio files from temporary directory
    const audioPath = String(result.audioPath);
    await cleanupAudio(audioPath)

    // Stage 4: Generate final documentation
    notify(75, 'Generating documentation versions...');
    const docPromises = Array(3).fill(null).map(() =>
        generateFinalDocumentation(
            batchResponses.join(''),
            transcriptionText,
            {
                model: "mistral-small-latest",
                temperature: 0.7 // Higher temperature for variety
            }
        )
    );

    const docVersions = await Promise.all(docPromises);

    // Stage 5: Aggregate documentation versions
    notify(90, 'Aggregating documentation...');
    const finalDocumentation = await aggregateDocumentation(
        docVersions,
        {
            model: "mistral-small-latest",
            temperature: 0.2
        }
    );

    // Write final documentation to file if outputDir is provided
    let outputPath = '';
    if (outputDir && namePrefix) {
        outputPath = join(outputDir, `${namePrefix}_output.md`);
        await fspromise.writeFile(outputPath, finalDocumentation, 'utf8');
    }

    // Also write individual versions if debug mode is enabled and outputDir is provided
    if (isDebugEnabled() && outputDir && namePrefix) {
        for (let i = 0; i < docVersions.length; i++) {
            const versionPath = join(outputDir, `${namePrefix}_v${i + 1}.md`);
            const content = docVersions[i];
            if (content) {
                await fspromise.writeFile(versionPath, content, 'utf8');
            }
        }
    }

    notify(100, 'Pipeline complete!');
    return {
        finalDocumentation,
        outputPath,
        debugData: debugMode ? {
            analysis: batchResponses.join(''),
            versions: docVersions
        } : undefined
    };
}
