import { NextRequest, NextResponse } from 'next/server'
import { DigestExportRenderer } from '@/lib/digest-export-renderer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      presentation, 
      allIssues, 
      upcomingIssues, 
      sprintMetrics, 
      options = {} 
    } = body

    if (!presentation) {
      return NextResponse.json(
        { error: 'Presentation data is required' },
        { status: 400 }
      )
    }

    // Create digest renderer directly (server-side only)
    const digestRenderer = new DigestExportRenderer()

    // Generate Digest directly without going through the export service
    const result = await digestRenderer.render(
      presentation,
      allIssues || [],
      upcomingIssues || [],
      sprintMetrics,
      { ...options, format: 'digest' }
    )

    // Convert blob to buffer for response
    const arrayBuffer = await result.blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Return Digest as downloadable file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Digest export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Digest export' },
      { status: 500 }
    )
  }
} 