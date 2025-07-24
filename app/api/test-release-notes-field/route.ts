import { NextRequest, NextResponse } from 'next/server'
import { analyzeJiraFields } from '@/lib/jira-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sprintId } = body

    if (!sprintId) {
      return NextResponse.json(
        { error: 'Sprint ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Testing release notes field for sprint ${sprintId}...`)

    // Use the existing field analysis function
    const fieldAnalysis = await analyzeJiraFields(sprintId)

    // Look for potential release notes fields
    interface ReleaseNotesField {
      fieldName: string
      fieldValue: string
      type: string
      count: number
      reason: string
    }

    const potentialReleaseNotesFields: ReleaseNotesField[] = []

    // Check all custom fields for potential release notes
    Object.entries(fieldAnalysis.allCustomFields || {}).forEach(([fieldName, fieldInfo]: [string, any]) => {
      const fieldValue = fieldInfo.value
      
      // Look for fields that might contain release notes
      if (typeof fieldValue === 'string' && fieldValue.length > 0) {
        const lowerValue = fieldValue.toLowerCase()
        
        // Check if the field value contains release note indicators
        if (lowerValue.includes('release') || 
            lowerValue.includes('note') || 
            lowerValue.includes('description') ||
            lowerValue.includes('summary') ||
            lowerValue.includes('details')) {
          
          potentialReleaseNotesFields.push({
            fieldName,
            fieldValue: fieldValue.substring(0, 200) + (fieldValue.length > 200 ? '...' : ''),
            type: fieldInfo.type,
            count: fieldInfo.count,
            reason: 'Contains release note keywords'
          })
        }
      }
    })

    // Also check for fields with names that suggest release notes
    Object.entries(fieldAnalysis.allCustomFields || {}).forEach(([fieldName, fieldInfo]: [string, any]) => {
      const fieldValue = fieldInfo.value
      
      // Check if the field name suggests it might be release notes
      if (fieldName.toLowerCase().includes('release') || 
          fieldName.toLowerCase().includes('note') ||
          fieldName.toLowerCase().includes('description')) {
        
        // Avoid duplicates
        if (!potentialReleaseNotesFields.find(f => f.fieldName === fieldName)) {
          potentialReleaseNotesFields.push({
            fieldName,
            fieldValue: typeof fieldValue === 'string' ? (fieldValue.substring(0, 200) + (fieldValue.length > 200 ? '...' : '')) : String(fieldValue),
            type: fieldInfo.type,
            count: fieldInfo.count,
            reason: 'Field name suggests release notes'
          })
        }
      }
    })

    // Sort by relevance (count and reason)
    potentialReleaseNotesFields.sort((a, b) => {
      // Prioritize fields with content
      if (a.fieldValue && !b.fieldValue) return -1
      if (!a.fieldValue && b.fieldValue) return 1
      
      // Then by count
      if (a.count !== b.count) return b.count - a.count
      
      // Then by reason priority
      const reasonPriority: Record<string, number> = {
        'Field name suggests release notes': 1,
        'Contains release note keywords': 2
      }
      return (reasonPriority[a.reason] || 0) - (reasonPriority[b.reason] || 0)
    })

    return NextResponse.json({
      success: true,
      sprintId,
      potentialReleaseNotesFields,
      totalCustomFields: Object.keys(fieldAnalysis.allCustomFields || {}).length,
      currentMapping: 'customfield_10113',
      recommendation: potentialReleaseNotesFields.length > 0 ? potentialReleaseNotesFields[0] : null
    })

  } catch (error) {
    console.error('❌ Failed to test release notes field:', error)
    return NextResponse.json(
      { error: 'Failed to analyze release notes fields' },
      { status: 500 }
    )
  }
} 