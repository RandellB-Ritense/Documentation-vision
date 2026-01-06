import ffmpeg from 'fluent-ffmpeg';
import {promises as fs} from 'fs';
import path from 'path';
import os from 'os';
import type {FrameExtractionConfig, FrameExtractionResult} from '../types.js';

/**
 * Extracts audio from a video file
 *
 * @param videoPath - Path to the input video file
 * @param outputPath - Path where audio file should be saved
 * @param audioFormat - Audio format (mp3, wav, aac)
 * @returns Promise that resolves when extraction is complete
 */
async function extractAudio(
    videoPath: string,
    outputPath: string,
    audioFormat: 'mp3' | 'wav' | 'aac' = 'mp3'
): Promise<void> {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .noVideo()
            .audioCodec(audioFormat === 'mp3' ? 'libmp3lame' : audioFormat === 'wav' ? 'pcm_s16le' : 'aac')
            .audioBitrate('192k')
            .output(outputPath)
            .on('start', (commandLine) => {
                console.log('Extracting audio:', commandLine);
            })
            .on('end', () => {
                console.log('Audio extraction complete');
                resolve();
            })
            .on('error', (err) => {
                reject(new Error(`Audio extraction failed: ${err.message}`));
            })
            .run();
    });
}

/**
 * Extracts frames from a video file and saves them to a temporary directory
 *
 * @param videoPath - Path to the input video file
 * @param config - Configuration options for frame extraction
 * @returns Promise containing the output directory path, frame paths, and frame count
 *
 * @example
 * ```typescript
 * const result = await extractFrames('video.mp4', {
 *   fps: 1,
 *   format: 'png',
 *   extractAudio: true
 * });
 * console.log(`Extracted ${result.frameCount} frames to ${result.outputDir}`);
 * ```
 */
export async function extractFrames(
    videoPath: string,
    config: FrameExtractionConfig = {}
): Promise<FrameExtractionResult> {
    // Set default values
    const {
        fps = 1,
        interval,
        format = 'png',
        tempDir,
        filenamePrefix = 'frame',
        quality = 90,
        extractAudio: shouldExtractAudio = false,
        audioFormat = 'mp3'
    } = config;

    // Validate video file exists
    try {
        await fs.access(videoPath);
    } catch (error) {
        throw new Error(`Video file not found: ${videoPath}`);
    }

    // Create temporary directory
    const outputDir = tempDir || await fs.mkdtemp(
        path.join(os.tmpdir(), 'video-frames-')
    );

    // Ensure output directory exists
    await fs.mkdir(outputDir, {recursive: true});

    // Extract audio if requested
    let audioPath: string | undefined;
    if (shouldExtractAudio) {
        audioPath = path.join(outputDir, `audio.${audioFormat}`);
        console.log('Extracting audio...');
        await extractAudio(videoPath, audioPath, audioFormat);
    }

    // Build output filename pattern
    const outputPattern = path.join(outputDir, `${filenamePrefix}-%04d.${format}`);

    return new Promise((resolve, reject) => {
        let command = ffmpeg(videoPath);

        // Set FPS or interval
        if (interval) {
            // Extract one frame every N seconds
            command = command.fps(1 / interval);
        } else {
            command = command.fps(fps);
        }

        // Set quality for JPEG
        if (format === 'jpg' || format === 'jpeg') {
            command = command.outputOptions([`-q:v ${Math.round((100 - quality) / 10)}`]);
        }

        command
            .output(outputPattern)
            .on('start', (commandLine) => {
                console.log('FFmpeg command:', commandLine);
            })
            .on('progress', (progress) => {
                if (progress.percent) {
                    console.log(`Processing: ${Math.round(progress.percent)}% done`);
                }
            })
            .on('end', async () => {
                try {
                    // Read all extracted frames
                    const files = await fs.readdir(outputDir);
                    const framePaths = files
                        .filter(file => file.startsWith(filenamePrefix))
                        .sort()
                        .map(file => path.join(outputDir, file));

                    // Convert frames to base64
                    console.log('Converting frames to base64...');
                    const framesBase64: string[] = [];

                    for (const framePath of framePaths) {
                        const fileBuffer = await fs.readFile(framePath);
                        const base64String = fileBuffer.toString('base64');
                        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
                        const dataUri = `data:${mimeType};base64,${base64String}`;
                        framesBase64.push(dataUri);
                    }

                    console.log(`Converted ${framesBase64.length} frames to base64`);

                    // Clean up temp frame files (but keep audio if extracted)
                    console.log('Cleaning up temporary frame files...');
                    for (const framePath of framePaths) {
                        await fs.unlink(framePath);
                    }


                    console.log('Temporary frame files cleaned up');

                    const result: FrameExtractionResult = {
                        outputDir,
                        framePaths,
                        framesBase64,
                        frameCount: framePaths.length,
                        fps
                    };

                    if (audioPath) {
                        result.audioPath = audioPath;
                    }

                    resolve(result);
                } catch (error) {
                    reject(new Error(`Failed to read extracted frames: ${error}`));
                }
            })
            .on('error', (err) => {
                reject(new Error(`Frame extraction failed: ${err.message}`));
            })
            .run();
    });
}

