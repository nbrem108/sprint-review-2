import { NextRequest, NextResponse } from 'next/server';
import { ExecutiveExportRenderer } from '@/lib/executive-export-renderer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      presentation, 
      allIssues, 
      upcomingIssues, 
      sprintMetrics, 
      options = {},
      additionalData = {}
    } = body;

    if (!presentation) {
      return NextResponse.json(
        { error: 'Presentation data is required' },
        { status: 400 }
      );
    }

    console.log('🚀 Starting executive export...');

    // Create executive renderer directly (server-side only)
    const executiveRenderer = new ExecutiveExportRenderer();

    // Generate executive export directly without going through the export service
    const result = await executiveRenderer.render(
      presentation,
      allIssues || [],
      upcomingIssues || [],
      sprintMetrics,
      { ...options, format: 'executive' },
      undefined, // onProgress callback
      additionalData // additional context data including summaries
    );

    console.log(`✅ Executive export completed: ${result.fileName} (${result.fileSize} bytes)`);

    // Return the file as a downloadable response
    return new NextResponse(result.blob, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'Content-Length': result.fileSize.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Executive export failed:', error);
    return NextResponse.json(
      { 
        error: 'Executive export failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 