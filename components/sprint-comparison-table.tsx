"use client"

import { SprintComparison, SprintMetrics } from '@/components/sprint-context'
import { formatTrendPercentage, getTrendColor, getTrendIcon } from '@/lib/sprint-comparison-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface SprintComparisonTableProps {
  comparison: SprintComparison
  className?: string
}

export function SprintComparisonTable({ comparison, className = "" }: SprintComparisonTableProps) {
  const { currentSprint, previousSprint1, previousSprint2, comparisonMetrics } = comparison

  if (!currentSprint) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            No sprint data available for comparison
          </div>
        </CardContent>
      </Card>
    )
  }

  const sprints = [
    { 
      name: currentSprint.sprintNumber, 
      data: currentSprint, 
      isCurrent: true,
      label: "Current Sprint",
      key: "current"
    },
    { 
      name: previousSprint1?.sprintNumber || "N/A", 
      data: previousSprint1, 
      isCurrent: false,
      label: "Previous Sprint 1",
      key: "previous1"
    },
    { 
      name: previousSprint2?.sprintNumber || "N/A", 
      data: previousSprint2, 
      isCurrent: false,
      label: "Previous Sprint 2",
      key: "previous2"
    }
  ]

  const getMetricValue = (sprint: SprintMetrics | null, field: keyof SprintMetrics): string | number => {
    if (!sprint) return "N/A"
    
    // Handle specific fields that might be objects
    if (field === 'qualityChecklist') return "N/A"
    
    const value = sprint[field]
    return value !== undefined ? value : "N/A"
  }

  const getMetricDisplayValue = (sprint: SprintMetrics | null, field: keyof SprintMetrics): string => {
    const value = getMetricValue(sprint, field)
    if (value === "N/A") return "N/A"
    
    // Format based on field type
    switch (field) {
      case 'testCoverage':
        return `${value}%`
      case 'completedTotalPoints':
      case 'estimatedPoints':
      case 'plannedItems':
        return value.toString()
      default:
        return value.toString()
    }
  }

  const getRowClassName = (sprint: SprintMetrics | null, isCurrent: boolean): string => {
    if (!sprint) return "text-gray-400"
    if (isCurrent) return "font-semibold text-lg"
    return ""
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Sprint Metrics Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-3 bg-blue-600 text-white font-semibold rounded-tl-lg">
                  Sprint
                </th>
                <th className="text-center p-3 bg-gray-700 text-white font-semibold">
                  Committed Total Points
                </th>
                <th className="text-center p-3 bg-gray-700 text-white font-semibold">
                  Planned Work Items Committed Points
                </th>
                <th className="text-center p-3 bg-gray-700 text-white font-semibold">
                  Committed Buffer Points
                </th>
                <th className="text-center p-3 bg-green-700 text-white font-semibold">
                  Completed Total Points
                </th>
                <th className="text-center p-3 bg-green-700 text-white font-semibold">
                  Completed Planned Work Items Points
                </th>
                <th className="text-center p-3 bg-green-700 text-white font-semibold">
                  Completed Buffer Points
                </th>
                <th className="text-center p-3 bg-red-600 text-white font-semibold rounded-tr-lg">
                  Carry Forward
                </th>
              </tr>
            </thead>
            <tbody>
              {sprints.map((sprint, index) => (
                <tr 
                  key={sprint.key} 
                  className={`border-b border-gray-200 ${sprint.isCurrent ? 'bg-blue-50' : ''}`}
                >
                  <td className={`p-3 font-medium ${getRowClassName(sprint.data, sprint.isCurrent)}`}>
                    <div className="flex items-center gap-2">
                      <span>{sprint.name}</span>
                      {sprint.isCurrent && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className={`text-center p-3 ${getRowClassName(sprint.data, sprint.isCurrent)}`}>
                    {getMetricDisplayValue(sprint.data, 'estimatedPoints')}
                  </td>
                  <td className={`text-center p-3 ${getRowClassName(sprint.data, sprint.isCurrent)}`}>
                    {getMetricDisplayValue(sprint.data, 'plannedItems')}
                  </td>
                  <td className={`text-center p-3 ${getRowClassName(sprint.data, sprint.isCurrent)}`}>
                    {getMetricDisplayValue(sprint.data, 'committedBufferPoints')}
                  </td>
                  <td className={`text-center p-3 ${getRowClassName(sprint.data, sprint.isCurrent)}`}>
                    {getMetricDisplayValue(sprint.data, 'completedTotalPoints')}
                  </td>
                  <td className={`text-center p-3 ${getRowClassName(sprint.data, sprint.isCurrent)}`}>
                    {sprint.data ? 
                      (sprint.data.completedTotalPoints - sprint.data.completedBufferPoints).toString() 
                      : "N/A"
                    }
                  </td>
                  <td className={`text-center p-3 ${getRowClassName(sprint.data, sprint.isCurrent)}`}>
                    {getMetricDisplayValue(sprint.data, 'completedBufferPoints')}
                  </td>
                  <td className={`text-center p-3 ${getRowClassName(sprint.data, sprint.isCurrent)}`}>
                    {getMetricDisplayValue(sprint.data, 'carryForwardPoints')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Trend Analysis */}
        {comparisonMetrics && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Trend Analysis</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-lg font-semibold ${getTrendColor(comparisonMetrics.velocityTrend)}`}>
                  {formatTrendPercentage(comparisonMetrics.velocityTrend)}
                </div>
                <div className="text-sm text-gray-600">Velocity Trend</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-semibold ${getTrendColor(comparisonMetrics.qualityTrend)}`}>
                  {formatTrendPercentage(comparisonMetrics.qualityTrend)}
                </div>
                <div className="text-sm text-gray-600">Quality Trend</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-semibold ${getTrendColor(comparisonMetrics.completionRateTrend)}`}>
                  {formatTrendPercentage(comparisonMetrics.completionRateTrend)}
                </div>
                <div className="text-sm text-gray-600">Completion Trend</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-semibold ${getTrendColor(comparisonMetrics.teamPerformanceTrend)}`}>
                  {formatTrendPercentage(comparisonMetrics.teamPerformanceTrend)}
                </div>
                <div className="text-sm text-gray-600">Team Performance</div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Metrics Summary */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {currentSprint.testCoverage}%
            </div>
            <div className="text-sm text-blue-700">Test Coverage</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {currentSprint.qualityScore || 0}%
            </div>
            <div className="text-sm text-green-700">Quality Score</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {currentSprint.efficiencyScore || 0}%
            </div>
            <div className="text-sm text-purple-700">Efficiency Score</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 