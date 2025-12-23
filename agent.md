# Documentation Vision Agent

## Overview

Documentation Vision is an AI-powered CLI tool that automatically generates end-user documentation from screen recordings. It uses Mistral AI's vision and audio transcription capabilities to analyze video content and produce clear, practical user documentation.

## Architecture

### Pipeline Stages

The tool processes videos through a five-stage pipeline:

1. **Frame & Audio Extraction** (`src/utils/frameExtractor.ts`)
   - Extracts frames at 1 FPS using FFmpeg
   - Extracts audio track as MP3
   - Converts frames to base64-encoded PNG images

2. **Visual Analysis** (`src/services/frameProcessor.ts`)
   - Processes frames in batches of 8 using Mistral's vision API
   - Analyzes visible UI elements and user actions frame-by-frame
   - Generates structured bullet-point analysis per frame
   - Model: `mistral-small-latest` (temperature: 0.2)

3. **Audio Transcription** (`src/services/audioProcessor.ts`)
   - Transcribes audio using Mistral's Voxtral API
   - Extracts spoken narration and commentary
   - Model: `voxtral-mini-latest`

4. **Analysis Merging** (`src/services/documentationGenerator.ts#mergeAnalysisAndTranscription`)
   - Combines batch responses into coherent documentation
   - Transforms technical analysis into user-friendly instructions
   - Model: `mistral-small-latest` (temperature: 0.7)

5. **Final Documentation Generation** (`src/services/documentationGenerator.ts#generateFinalDocumentation`)
   - Cross-references visual analysis with audio transcription
   - Removes inferred or unverified information
   - Produces final documentation with transcript as source of truth
   - Model: `mistral-small-latest` (temperature: 0.7)

## Key Components

### Core Services

- **Frame Processor** (`src/services/frameProcessor.ts`)
  - Chunks frames into batches for efficient API usage
  - Sends batches to Mistral vision API with analysis prompt
  - Collects and formats responses

- **Audio Processor** (`src/services/audioProcessor.ts`)
  - Handles audio file transcription
  - Manages file I/O for audio processing

- **Documentation Generator** (`src/services/documentationGenerator.ts`)
  - Merges frame analysis into coherent documentation
  - Cross-validates analysis against transcription
  - Produces final polished documentation

### Utilities

- **Frame Extractor** (`src/utils/frameExtractor.ts`)
  - FFmpeg integration for video processing
  - Frame extraction with configurable FPS
  - Audio extraction and format conversion
  - Base64 encoding for API transmission

- **Chunker** (`src/utils/chunker.ts`)
  - Splits arrays into batches for processing

- **Mistral Client** (`src/utils/mistralClient.ts`)
  - Configured Mistral AI SDK client
  - Handles API authentication

### Prompts

The tool uses three specialized system prompts (`src/prompts.ts`):

1. **ANALYSIS_SYSTEM_PROMPT**
   - Instructs vision model to analyze frames objectively
   - Enforces frame-by-frame description without inference
   - Ensures neutral, present-tense descriptions

2. **DOCUMENTATION_WRITER_SYSTEM_PROMPT**
   - Guides transformation of technical analysis into user documentation
   - Enforces plain language, clear instructions
   - Avoids technical jargon and implementation details
   - Uses passive voice and formal tone

3. **FINAL_WRITER_SYSTEM_PROMPT**
   - Ensures transcript serves as source of truth
   - Removes unverified or inferred content
   - Preserves documentation style while maintaining accuracy

## CLI Interface

### Command

```bash
doc-vision -i <video> -o <output-dir> -n <name-prefix>
```

### Options

- `-i, --input <video>` - Input video file path (required)
- `-o, --output-dir <directory>` - Output directory for generated files (required)
- `-n, --name <prefix>` - Name prefix for output files (required)

### Output Files

1. `<prefix>_analysis.md` - Raw frame-by-frame analysis from vision model
2. `<prefix>_output.md` - Final polished end-user documentation

## Configuration

### Environment Variables

Create a `.env` file with:

```
MISTRAL_API_KEY=your_api_key_here
```

### Processing Parameters

**Frame Extraction** (configurable in `src/pipeline.ts:15-20`):
- FPS: 1 frame per second
- Format: PNG
- Audio format: MP3

**Vision Analysis** (configurable in `src/pipeline.ts:34-37`):
- Model: `mistral-small-latest`
- Temperature: 0.2 (deterministic analysis)
- Batch size: 8 frames per request

**Audio Transcription** (configurable in `src/pipeline.ts:44-46`):
- Model: `voxtral-mini-latest`
- Language: English

**Documentation Generation** (configurable in `src/pipeline.ts:56-58`, `62-68`):
- Model: `mistral-small-latest`
- Temperature: 0.7 (creative writing)

## Design Principles

### Documentation Philosophy

The tool follows strict documentation principles:

1. **User-Centric**: Focuses on what users do, not how systems work
2. **Accuracy First**: Transcript validation prevents hallucination
3. **Plain Language**: Avoids technical jargon and implementation details
4. **Task-Oriented**: Describes workflows, not UI components
5. **Non-Prescriptive**: Narrative flow over rigid step-by-step instructions

### Quality Assurance

- **Three-Stage Validation**:
  1. Vision analysis (objective observation)
  2. Initial documentation (user-friendly transformation)
  3. Transcript validation (accuracy verification)

- **Conservative Output**: Removes uncertain or unverified information
- **No Inference**: Only documents what is explicitly visible or spoken

## Development

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev:pipeline
```

### Project Structure

```
src/
├── services/
│   ├── audioProcessor.ts       # Audio transcription
│   ├── documentationGenerator.ts # Documentation merging and generation
│   └── frameProcessor.ts       # Vision-based frame analysis
├── utils/
│   ├── chunker.ts             # Array batching utility
│   ├── cleanUpAudio.ts        # Audio file cleanup
│   ├── frameExtractor.ts      # Video processing with FFmpeg
│   └── mistralClient.ts       # Mistral AI SDK configuration
├── index.ts                   # Public API exports
├── pipeline.ts                # CLI entry point and orchestration
├── prompts.ts                 # System prompts for AI models
└── types.ts                   # TypeScript type definitions
```

## Dependencies

### Core

- `@mistralai/mistralai`: AI model integration (vision, chat, transcription)
- `fluent-ffmpeg`: Video and audio processing
- `commander`: CLI argument parsing
- `dotenv`: Environment variable management

### Development

- `typescript`: Type safety and compilation
- `tsx`: TypeScript execution for development
- `@types/node`: Node.js type definitions
- `@types/fluent-ffmpeg`: FFmpeg type definitions

## Use Cases

- Generating user guides from product demo videos
- Creating training documentation from walkthrough recordings
- Documenting software workflows from screen captures
- Producing support documentation from tutorial videos

## Limitations

- Requires clear audio narration for best results
- English language only (configurable)
- 1 FPS frame rate (may miss rapid UI changes)
- Depends on Mistral AI API availability
- Processing time scales with video length
- Batch size limited by API constraints

## Future Enhancements

Potential improvements:

- Support for multiple languages
- Configurable FPS from CLI
- Screenshot annotation in output
- HTML/PDF output formats
- Concurrent batch processing
- Custom prompt templates
- Video preview with timestamp mapping
