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

    // Generate Markdown using the export service
    const markdownBlob = await exportService.exportToMarkdown(
      presentation,
      allIssues || [],
      upcomingIssues || [],
      sprintMetrics,
      { ...options, format: 'markdown' }
    )

    // Convert blob to buffer for response
    const arrayBuffer = await markdownBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate filename
    const fileName = exportService.generateFileName(presentation, 'md')

    // Return Markdown as downloadable file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Markdown export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Markdown export' },
      { status: 500 }
    )
  }
} 