import { NextRequest, NextResponse } from 'next/server';
import { refineDocumentation } from '@/lib/services/documentationGenerator';
import { RefineDocumentationRequest } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { currentDocument, messages } = await req.json() as RefineDocumentationRequest;

    if (!currentDocument) {
      return NextResponse.json({ error: 'Missing current document' }, { status: 400 });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Missing or empty messages' }, { status: 400 });
    }

    const refinedDocument = await refineDocumentation(currentDocument, messages);

    return NextResponse.json({ refinedDocument });
  } catch (error: any) {
    console.error('Error in chat API route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
