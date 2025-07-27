import { NextRequest, NextResponse } from 'next/server';
import { AdvancedDigestExportRenderer } from '../../../lib/advanced-digest-renderer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      presentation, 
      allIssues, 
      upcomingIssues, 
      sprintMetrics, 
      options, 
      demoStoryScreenshots,
      additionalData 
    } = body;

    // Validate required data
    if (!presentation || !allIssues) {
      return NextResponse.json(
        { error: 'Missing required data: presentation and allIssues are required' },
        { status: 400 }
      );
    }

    // Create advanced digest renderer directly (server-side only)
    const advancedDigestRenderer = new AdvancedDigestExportRenderer();

    // Generate Advanced Digest directly without going through the export service
    const result = await advancedDigestRenderer.render(
      presentation,
      allIssues,
      upcomingIssues || [],
      sprintMetrics,
      options || {},
      undefined, // onProgress callback
      demoStoryScreenshots || {}, // demo story screenshots
      additionalData || {} // additional context data
    );

    // Return the PDF blob
    return new NextResponse(result.blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'Content-Length': result.fileSize.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Advanced Digest generation failed:', error);
    return NextResponse.json(
      { error: `Advanced Digest generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 