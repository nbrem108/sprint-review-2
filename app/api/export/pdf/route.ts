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

    // Generate PDF using the export service
    const pdfBlob = await exportService.exportToPDF(
      presentation,
      allIssues || [],
      upcomingIssues || [],
      sprintMetrics,
      { ...options, format: 'pdf' }
    )

    // Convert blob to buffer for response
    const arrayBuffer = await pdfBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate filename
    const fileName = exportService.generateFileName(presentation, 'pdf')

    // Return PDF as downloadable file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF export' },
      { status: 500 }
    )
  }
} 