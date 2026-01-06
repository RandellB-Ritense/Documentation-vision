export interface FrameExtractionConfig {
  /**
   * Frames per second to extract
   * @example 1 = 1 frame per second, 0.5 = 1 frame every 2 seconds
   */
  fps?: number;
  
  /**
   * Extract one frame every N seconds
   * Alternative to fps setting
   */
  interval?: number;
  
  /**
   * Image format for extracted frames
   * @default 'png'
   */
  format?: 'png';
  
  /**
   * Custom temporary directory path
   * If not provided, a system temp directory will be created
   */
  tempDir?: string;

  /**
   * Extract audio from video
   * @default false
   */
  extractAudio?: boolean;
}

export interface FrameExtractionResult {
  /**
   * Path to the temporary directory containing frames
   */
  outputDir: string;
  
  /**
   * Array of paths to extracted frame files
   */
  framePaths: string[];
  
  /**
   * Array of base64 encoded frames with data URI prefix
   * Format: data:image/png;base64,iVBORw0KGgo...
   */
  framesBase64: string[];
  
  /**
   * Total number of frames extracted
   */
  frameCount: number;

  /**
   * Path to extracted audio file (if extractAudio is true)
   */
  audioPath?: string;
  
  /**
   * Frames per second used for extraction
   */
  fps?: number;
}
