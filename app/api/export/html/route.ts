import { NextRequest, NextResponse } from 'next/server'
import { exportService } from '@/lib/export-service'

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

    // Generate HTML using the export service
    const htmlBlob = await exportService.exportToHTML(
      presentation,
      allIssues || [],
      upcomingIssues || [],
      sprintMetrics,
      { ...options, format: 'html' }
    )

    // Convert blob to buffer for response
    const arrayBuffer = await htmlBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate filename
    const fileName = exportService.generateFileName(presentation, 'html')

    // Return HTML as downloadable file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('HTML export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate HTML export' },
      { status: 500 }
    )
  }
} 