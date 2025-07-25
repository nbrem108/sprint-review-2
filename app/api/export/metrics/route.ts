import { NextRequest, NextResponse } from 'next/server'
import { exportService } from '@/lib/export-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      sprintMetrics, 
      allIssues, 
      options = {} 
    } = body

    if (!sprintMetrics) {
      return NextResponse.json(
        { error: 'Sprint metrics data is required' },
        { status: 400 }
      )
    }

    // Create a mock presentation for metrics export
    const mockPresentation = {
      id: 'metrics-export',
      title: `Sprint ${sprintMetrics.sprintNumber} Metrics`,
      slides: [],
      createdAt: new Date().toISOString(),
      metadata: {
        sprintName: `Sprint ${sprintMetrics.sprintNumber}`,
        totalSlides: 0,
        hasMetrics: true,
        demoStoriesCount: 0,
        customSlidesCount: 0
      }
    }

    // Generate executive metrics using the export service
    const result = await exportService.export(
      mockPresentation,
      allIssues || [],
      [],
      sprintMetrics,
      { ...options, format: 'executive' }
    )

    // Convert blob to buffer for response
    const arrayBuffer = await result.blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Return executive metrics as downloadable file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Executive metrics export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate executive metrics export' },
      { status: 500 }
    )
  }
} 