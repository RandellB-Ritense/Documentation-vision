import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/lib/pipeline';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const videoFile = formData.get('video') as File;
    const outputDir = formData.get('outputDir') as string | null;
    const fileName = formData.get('fileName') as string | null;
    const debugMode = formData.get('debugMode') === 'true';

    if (!videoFile) {
      return NextResponse.json({ error: 'Missing required video file' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendUpdate = async (data: any) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    // Run the pipeline in the "background" of the stream
    (async () => {
      try {
        // Save uploaded file to a temporary location
        const bytes = await videoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const tempDir = await mkdir(join(tmpdir(), 'doc-vision-upload-'), { recursive: true }) || join(tmpdir(), 'doc-vision-upload-' + Date.now());
        await mkdir(tempDir, { recursive: true });
        
        const videoPath = join(tempDir, videoFile.name);
        await writeFile(videoPath, buffer);

        // Run the pipeline
        const result = await runPipeline(
          videoPath, 
          outputDir || undefined, 
          fileName || undefined, 
          debugMode,
          (update) => {
            sendUpdate({ type: 'progress', ...update });
          }
        );

        await sendUpdate({ type: 'complete', result });
        await writer.close();
      } catch (error: any) {
        console.error('Error in pipeline:', error);
        await sendUpdate({ type: 'error', message: error.message || 'Internal Server Error' });
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
