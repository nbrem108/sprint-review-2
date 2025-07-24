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

    // Generate executive metrics using the export service
    const metricsBlob = await exportService.exportExecutiveMetrics(
      sprintMetrics,
      allIssues || [],
      { ...options, format: 'metrics', executiveFormat: true }
    )

    // Convert blob to buffer for response
    const arrayBuffer = await metricsBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate filename
    const fileName = exportService.generateFileName(
      { title: `Sprint_${sprintMetrics.sprintNumber}_Metrics` } as any, 
      'html', 
      true
    )

    // Return executive metrics as downloadable file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${fileName}"`,
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