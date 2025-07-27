import { NextRequest, NextResponse } from 'next/server'
import { SprintMetrics, HistoricalSprintData } from '@/components/sprint-context'
import { validateSprintMetrics, enhanceSprintMetrics } from '@/lib/sprint-comparison-utils'

// In-memory storage for demo purposes
// In production, this would be a database
let historicalSprints: HistoricalSprintData[] = []

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sprintId = searchParams.get('sprintId')
    const boardId = searchParams.get('boardId')

    if (sprintId) {
      // Get specific sprint metrics
      const sprint = historicalSprints.find(s => s.sprintId === sprintId)
      if (!sprint) {
        return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
      }
      return NextResponse.json(sprint)
    }

    if (boardId) {
      // Get all sprints for a board
      const boardSprints = historicalSprints.filter(s => s.metrics.boardId === boardId)
      return NextResponse.json(boardSprints)
    }

    // Return all historical sprints
    return NextResponse.json(historicalSprints)
  } catch (error) {
    console.error('Error fetching sprint metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sprint metrics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sprintId, sprintName, sprintNumber, startDate, endDate, metrics, boardId } = body

    // Validate required fields
    if (!sprintId || !sprintName || !sprintNumber || !metrics) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate metrics data
    const validation = validateSprintMetrics(metrics)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid metrics data', details: validation.errors },
        { status: 400 }
      )
    }

    // Enhance metrics with calculated values
    const enhancedMetrics = enhanceSprintMetrics(metrics)

    // Create or update historical sprint data
    const historicalSprint: HistoricalSprintData = {
      sprintId,
      sprintName,
      sprintNumber,
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || new Date().toISOString(),
      metrics: enhancedMetrics,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Remove existing sprint if it exists
    historicalSprints = historicalSprints.filter(s => s.sprintId !== sprintId)
    
    // Add new sprint
    historicalSprints.push(historicalSprint)

    return NextResponse.json(historicalSprint, { status: 201 })
  } catch (error) {
    console.error('Error saving sprint metrics:', error)
    return NextResponse.json(
      { error: 'Failed to save sprint metrics' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sprintId = searchParams.get('sprintId')

    if (!sprintId) {
      return NextResponse.json(
        { error: 'Sprint ID is required' },
        { status: 400 }
      )
    }

    // Remove sprint from storage
    const initialLength = historicalSprints.length
    historicalSprints = historicalSprints.filter(s => s.sprintId !== sprintId)

    if (historicalSprints.length === initialLength) {
      return NextResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Sprint metrics deleted successfully' })
  } catch (error) {
    console.error('Error deleting sprint metrics:', error)
    return NextResponse.json(
      { error: 'Failed to delete sprint metrics' },
      { status: 500 }
    )
  }
} 