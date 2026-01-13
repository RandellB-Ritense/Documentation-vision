# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Documentation Vision is a Next.js web application that automatically generates end-user documentation from screen recording videos. It uses Mistral AI's multimodal capabilities to analyze video frames and transcribe audio, then synthesizes this into structured documentation with real-time chat-based refinement.

## Required Environment Variables

Create a `.env` file in the root directory:
```env
MISTRAL_API_KEY=your_mistral_api_key
```

## Common Commands

### Development
```bash
npm install              # Install dependencies
npm run dev             # Start development server (http://localhost:3000)
npm run build           # Build for production
npm start               # Start production server
npm run lint            # Run Next.js linting
```

### Legacy CLI Pipeline (Still Available)
```bash
npm run dev:pipeline    # Run the pipeline directly via tsx
```

### Docker
```bash
docker build -t documentation-vision .                        # Build Docker image
docker run -p 3000:3000 --env-file .env documentation-vision  # Run container
```

Note: The Docker image includes FFmpeg which is required for video processing.

## Architecture Overview

### Core Pipeline (src/lib/pipeline.ts)

The documentation generation follows a 5-stage pipeline:

1. **Frame Extraction** (0-25%): Uses FFmpeg via fluent-ffmpeg to extract frames at 1 FPS and audio from uploaded video
2. **Frame Analysis** (25-55%): Processes frames in batches (default: 8) using Mistral's vision model with strict frame-by-frame analysis prompts
3. **Audio Transcription** (55-75%): Transcribes audio using Mistral's voxtral-mini-latest model
4. **Documentation Generation** (75-90%): Generates 3 documentation versions with higher temperature (0.7) for variety, using transcript as source of truth
5. **Aggregation** (90-100%): Merges the 3 versions into final documentation with lower temperature (0.2)

### Service Layer (src/lib/services/)

- **frameProcessor.ts**: Batches base64-encoded frames and sends to Mistral vision API
- **audioProcessor.ts**: Handles audio transcription via Mistral audio API
- **documentationGenerator.ts**: Contains three key functions:
  - `generateFinalDocumentation()`: Creates individual doc versions (transcript is authoritative)
  - `aggregateDocumentation()`: Merges multiple versions into final output
  - `refineDocumentation()`: Handles chat-based refinement requests

### Prompt Engineering (src/lib/prompts.ts)

Three specialized system prompts define documentation quality:

- **ANALYSIS_SYSTEM_PROMPT**: Enforces strict frame-by-frame analysis (what is visible, not what is inferred)
- **FINAL_WRITER_SYSTEM_PROMPT**: Comprehensive rules for end-user documentation (transcript as source of truth, context preservation, procedural vs contextual classification)
- **AGGREGATOR_SYSTEM_PROMPT**: Merges multiple documentation versions
- **REFINEMENT_SYSTEM_PROMPT**: Guides chat-based documentation refinement

### API Routes (src/app/api/)

- **POST /api/process**: Server-sent events (SSE) stream for pipeline progress and results
- **POST /api/chat**: Synchronous refinement endpoint accepting current document and chat messages

### React Hooks (src/hooks/)

- **usePipeline.ts**: Manages pipeline execution, SSE streaming, progress tracking, and abort handling
- **useChat.ts**: Manages chat interface for documentation refinement
- **useSession.ts**: Handles localStorage persistence for sessions

### Components (src/components/)

- **UploadForm.tsx**: File upload, debug toggle, pipeline trigger
- **StatusLog.tsx**: Real-time progress messages with debug filtering
- **DocumentationEditor.tsx**: Monaco editor for viewing/editing documentation
- **RefinementChat.tsx**: Chat interface for iterative documentation improvements
- **DebugSection.tsx**: Displays raw analysis and documentation versions in debug mode

## Key Technical Details

### Video Processing
- FFmpeg is required (installed in Docker image, must be available locally for dev)
- Frames are extracted at 1 FPS by default
- Frames are converted to base64 data URIs for API transmission
- Audio is extracted as MP3 and cleaned up after transcription

### Mistral AI Integration
- Uses `@mistralai/mistralai` SDK
- Vision model: `mistral-small-latest` (frame analysis and doc generation)
- Audio model: `voxtral-mini-latest` (transcription)
- Client initialized in `src/lib/utils/mistralClient.ts`

### State Management
- React state for UI interactions
- localStorage for session persistence (results, chat history, debug data)
- No global state library (Context API only)

### Debug Mode
- When enabled, writes intermediate files: `{namePrefix}_analysis.md`, `{namePrefix}_v1.md`, `{namePrefix}_v2.md`, `{namePrefix}_v3.md`
- Exposes raw analysis and individual documentation versions in UI
- Debug logs are filtered in StatusLog component

### Documentation Philosophy
The system enforces strict rules about transcript authority:
- Transcript defines factual accuracy and explanatory meaning
- Analysis provides visual/structural support only
- Context from transcript (UI explanations, behavioral rules) must be preserved
- Procedural actions require presence in both transcript AND analysis
- Contextual explanations (UI context, behavioral context) from transcript are mandatory

## Path Aliases

Uses TypeScript path alias `@/*` mapped to `./src/*` (configured in tsconfig.json).

## Important File Locations

- Pipeline orchestration: `src/lib/pipeline.ts`
- Type definitions: `src/lib/types.ts`
- Prompt definitions: `src/lib/prompts.ts`
- Frame extraction: `src/lib/utils/extractor.ts`
- Cleanup utilities: `src/lib/utils/cleanUpAudio.ts`
- Debug utilities: `src/lib/utils/debug.ts`

## Common Development Patterns

### Adding a New Pipeline Stage
1. Add stage logic in appropriate service file or create new service
2. Update `runPipeline()` in `src/lib/pipeline.ts`
3. Add progress notifications with appropriate percentage ranges
4. Update `ProgressUpdate` type if needed in `src/lib/pipeline.ts`

### Modifying Documentation Generation Behavior
1. Adjust system prompts in `src/lib/prompts.ts`
2. Temperature and model can be configured in service function calls
3. Test with debug mode enabled to inspect intermediate outputs

### Adding New API Endpoints
1. Create route.ts in `src/app/api/{endpoint}/`
2. Export async POST/GET functions
3. Use `NextRequest` and `NextResponse` from next/server
4. Handle errors with appropriate HTTP status codes
