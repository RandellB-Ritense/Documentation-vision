import {promises as fs} from "fs";

/**
 * Cleanup only the audio file
 *
 * @param audioPath - Path to the audio file to clean up
 *
 * @example
 * ```typescript
 * if (result.audioPath) {
 *   await cleanupAudio(result.audioPath);
 * }
 * ```
 */
export async function cleanupAudio(audioPath: string): Promise<void> {
    try {
        await fs.unlink(audioPath);
        console.log(`Cleaned up audio file: ${audioPath}`);
    } catch (error) {
        console.error(`Failed to cleanup audio: ${error}`);
        throw error;
    }
}