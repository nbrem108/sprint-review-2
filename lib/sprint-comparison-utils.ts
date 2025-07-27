import { SprintMetrics, HistoricalSprintData, SprintComparison, SprintTrends } from "@/components/sprint-context"
import { SafeJiraSprint, SafeJiraIssue } from "@/lib/jira-types"
import { isIssueCompleted } from './utils'

/**
 * Identify previous sprints using Jira API data and chronological ordering
 */
export function identifyPreviousSprintsFromJira(
  currentSprint: SafeJiraSprint,
  allSprints: SafeJiraSprint[]
): SafeJiraSprint[] {
  if (!currentSprint.startDate) {
    console.warn("Current sprint has no start date, cannot identify previous sprints")
    return []
  }

  const currentStartDate = new Date(currentSprint.startDate)
  
  // Filter for completed sprints that started before the current sprint
  const previousSprints = allSprints
    .filter(sprint => 
      sprint.state === "closed" && 
      sprint.startDate && 
      new Date(sprint.startDate) < currentStartDate
    )
    .sort((a, b) => {
      // Sort by start date descending (most recent first)
      const dateA = new Date(a.startDate!)
      const dateB = new Date(b.startDate!)
      return dateB.getTime() - dateA.getTime()
    })
    .slice(0, 2) // Take the 2 most recent

  return previousSprints
}

/**
 * Extracts sprint number from sprint name (e.g., "Sprint 2.6" -> "2.6")
 */
export function extractSprintNumber(sprintName: string): string | null {
  const match = sprintName.match(/sprint\s+(\d+\.\d+)/i)
  return match ? match[1] : null
}

/**
 * Parses sprint number to get major and minor versions
 */
export function parseSprintNumber(sprintNumber: string): { major: number; minor: number } | null {
  const parts = sprintNumber.split('.')
  if (parts.length !== 2) return null
  
  const major = parseInt(parts[0])
  const minor = parseInt(parts[1])
  
  if (isNaN(major) || isNaN(minor)) return null
  
  return { major, minor }
}

/**
 * Identifies the 2 previous sprints based on sprint numbering
 */
export function identifyPreviousSprints(
  currentSprintNumber: string,
  availableSprints: HistoricalSprintData[]
): HistoricalSprintData[] {
  const current = parseSprintNumber(currentSprintNumber)
  if (!current) return []

  // Sort sprints by number for easier comparison
  const sortedSprints = availableSprints
    .filter(sprint => {
      const sprintNum = parseSprintNumber(sprint.sprintNumber)
      return sprintNum && sprintNum.major === current.major && sprintNum.minor < current.minor
    })
    .sort((a, b) => {
      const aNum = parseSprintNumber(a.sprintNumber)!
      const bNum = parseSprintNumber(b.sprintNumber)!
      return bNum.minor - aNum.minor // Descending order
    })

  return sortedSprints.slice(0, 2)
}

/**
 * Calculate sprint metrics from Jira issues
 */
export function calculateSprintMetricsFromIssues(
  sprint: SafeJiraSprint,
  issues: SafeJiraIssue[]
): SprintMetrics {
  // Calculate basic metrics from issues
  const plannedItems = issues.length
  const estimatedPoints = issues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0)
  
  // Determine completed issues using the utility function
  const completedIssues = issues.filter(issue => isIssueCompleted(issue.status))
  
  const completedTotalPoints = completedIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0)
  const completedAdjustedPoints = completedTotalPoints // Could be adjusted for complexity, bugs, etc.
  
  // Calculate completion rate
  const completionRate = plannedItems > 0 ? (completedIssues.length / plannedItems) * 100 : 0
  
  // Extract sprint number from name (e.g., "Sprint 2.6" -> "2.6")
  const sprintNumber = extractSprintNumberFromName(sprint.name)
  
  // Calculate defect metrics from bug issues
  const bugIssues = issues.filter(issue => issue.issueType.toLowerCase() === 'bug')
  const defectCount = bugIssues.length
  
  // Calculate defect resolution rate using the utility function
  const resolvedBugs = bugIssues.filter(issue => isIssueCompleted(issue.status))
  const defectResolutionRate = defectCount > 0 ? (resolvedBugs.length / defectCount) * 100 : 0
  
  // Sprint planning metrics - these would typically come from sprint planning data
  // For now, we'll set reasonable defaults that can be overridden by user input
  const sprintBacklogPlanned = 1 // Usually 1 sprint planned
  const sprintBacklogEstimated = 3 // Typically 3-4 sprints estimated out
  const sprintStoryPointCommitment = estimatedPoints // Default to estimated points, can be overridden
  
  // Create quality checklist (this would need to be filled by user or calculated from other data)
  const qualityChecklist = {
    sprintCommitment: "na" as const,
    velocity: "na" as const,
    testCoverage: "na" as const,
    testAutomation: "na" as const,
    uiUxStandards: "na" as const,
    internationalFirst: "na" as const,
    mobileResponsive: "na" as const,
    featurePermissions: "na" as const,
    releaseNotes: "na" as const,
    howToVideos: "na" as const,
  }

  const baseMetrics: SprintMetrics = {
    // Sprint Planning Metrics
    sprintBacklogPlanned,
    sprintBacklogEstimated,
    sprintStoryPointCommitment,
    
    // Work Item Metrics
    plannedItems,
    estimatedPoints,
    carryForwardPoints: 0, // Would need to be calculated from previous sprint
    committedBufferPoints: 0, // Would need to be calculated from sprint planning
    completedBufferPoints: 0, // Would need to be calculated from actual work
    testCoverage: 0, // Would need to be calculated from test data
    sprintNumber,
    completedTotalPoints,
    completedAdjustedPoints,
    
    // Enhanced metrics fields
    sprintStartDate: sprint.startDate || undefined,
    sprintEndDate: sprint.endDate || undefined,
    teamSize: undefined,
    defectCount, // Automatically calculated from bug issues
    defectResolutionRate, // Automatically calculated from resolved bugs
    averageCycleTime: undefined,
    sprintGoal: sprint.goal,
    retrospectiveNotes: undefined,
    boardId: sprint.boardId,
    qualityChecklist,
  }

  // Enhance with calculated values
  return enhanceSprintMetrics(baseMetrics)
}

/**
 * Extract sprint number from sprint name
 */
export function extractSprintNumberFromName(sprintName: string): string {
  // Common patterns: "Sprint 2.6", "Sprint 2.6.1", "2.6", "Sprint 26"
  const patterns = [
    /sprint\s+(\d+\.\d+(?:\.\d+)?)/i,  // "Sprint 2.6" or "Sprint 2.6.1"
    /(\d+\.\d+(?:\.\d+)?)/,            // "2.6" or "2.6.1"
    /sprint\s+(\d+)/i,                 // "Sprint 26"
    /(\d+)/,                           // "26"
  ]
  
  for (const pattern of patterns) {
    const match = sprintName.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  // Fallback: use the name as is
  return sprintName
}

/**
 * Calculate comparison metrics between sprints
 */
export function calculateComparisonMetrics(
  currentSprint: SprintMetrics,
  previousSprint: SprintMetrics | null
): {
  velocityTrend: number
  qualityTrend: number
  completionRateTrend: number
  teamPerformanceTrend: number
} {
  if (!previousSprint) {
    return {
      velocityTrend: 0,
      qualityTrend: 0,
      completionRateTrend: 0,
      teamPerformanceTrend: 0
    }
  }

  // Calculate velocity trend
  const currentVelocity = currentSprint.completedTotalPoints
  const previousVelocity = previousSprint.completedTotalPoints
  const velocityTrend = previousVelocity > 0 
    ? ((currentVelocity - previousVelocity) / previousVelocity) * 100 
    : 0

  // Calculate quality trend
  const currentQuality = currentSprint.qualityScore || calculateQualityScore(currentSprint.qualityChecklist)
  const previousQuality = previousSprint.qualityScore || calculateQualityScore(previousSprint.qualityChecklist)
  const qualityTrend = previousQuality > 0 
    ? ((currentQuality - previousQuality) / previousQuality) * 100 
    : 0

  // Calculate completion rate trend
  const currentCompletion = currentSprint.plannedItems > 0 
    ? (currentSprint.completedTotalPoints / currentSprint.plannedItems) * 100 
    : 0
  const previousCompletion = previousSprint.plannedItems > 0 
    ? (previousSprint.completedTotalPoints / previousSprint.plannedItems) * 100 
    : 0
  const completionRateTrend = previousCompletion > 0 
    ? ((currentCompletion - previousCompletion) / previousCompletion) * 100 
    : 0

  // Calculate team performance trend (average of velocity and quality)
  const currentPerformance = (currentVelocity + currentQuality) / 2
  const previousPerformance = (previousVelocity + previousQuality) / 2
  const teamPerformanceTrend = previousPerformance > 0 
    ? ((currentPerformance - previousPerformance) / previousPerformance) * 100 
    : 0

  return {
    velocityTrend: Math.round(velocityTrend * 100) / 100,
    qualityTrend: Math.round(qualityTrend * 100) / 100,
    completionRateTrend: Math.round(completionRateTrend * 100) / 100,
    teamPerformanceTrend: Math.round(teamPerformanceTrend * 100) / 100
  }
}

/**
 * Create sprint comparison using Jira API data
 */
export function createSprintComparisonFromJira(
  currentSprint: SafeJiraSprint,
  currentIssues: SafeJiraIssue[],
  allSprints: SafeJiraSprint[],
  allSprintIssues: Record<string, SafeJiraIssue[]>
): SprintComparison | null {
  // Get previous sprints
  const previousSprints = identifyPreviousSprintsFromJira(currentSprint, allSprints)
  
  if (previousSprints.length === 0) {
    console.log("No previous sprints found for comparison")
    return null
  }

  // Calculate metrics for current sprint
  const currentMetrics = calculateSprintMetricsFromIssues(currentSprint, currentIssues)
  
  // Calculate metrics for previous sprints
  const previousSprint1 = previousSprints[0]
  const previousSprint1Issues = allSprintIssues[previousSprints[0].id] || []
  const previousMetrics1 = calculateSprintMetricsFromIssues(previousSprint1, previousSprint1Issues)
  
  const previousSprint2 = previousSprints[1]
  const previousSprint2Issues = allSprintIssues[previousSprints[1].id] || []
  const previousMetrics2 = previousSprint2 ? calculateSprintMetricsFromIssues(previousSprint2, previousSprint2Issues) : null

  // Calculate comparison metrics
  const comparisonMetrics = calculateComparisonMetrics(currentMetrics, previousMetrics1)

  return {
    currentSprint: currentMetrics,
    previousSprint1: previousMetrics1,
    previousSprint2: previousMetrics2,
    comparisonMetrics,
  }
}

/**
 * Calculates quality score from checklist
 */
export function calculateQualityScore(qualityChecklist: Record<string, string>): number {
  const scores = Object.values(qualityChecklist).map(value => {
    switch (value) {
      case 'yes': return 100
      case 'partial': return 50
      case 'no': return 0
      case 'na': return 100 // Not applicable counts as good
      default: return 0
    }
  })
  
  return scores.length > 0 ? Math.round(scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length) : 0
}

/**
 * Generate sprint trends from Jira API data
 */
export function generateSprintTrendsFromJira(
  allSprints: SafeJiraSprint[],
  allSprintIssues: Record<string, SafeJiraIssue[]>
): SprintTrends {
  // Sort sprints by start date
  const sortedSprints = allSprints
    .filter(sprint => sprint.startDate && sprint.state === "closed")
    .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime())

  const velocityHistory = sortedSprints.map(sprint => {
    const issues = allSprintIssues[sprint.id] || []
    const metrics = calculateSprintMetricsFromIssues(sprint, issues)
    return {
      sprint: metrics.sprintNumber,
      velocity: metrics.completedTotalPoints,
      date: sprint.startDate!
    }
  })

  const qualityHistory = sortedSprints.map(sprint => {
    const issues = allSprintIssues[sprint.id] || []
    const metrics = calculateSprintMetricsFromIssues(sprint, issues)
    return {
      sprint: metrics.sprintNumber,
      qualityScore: metrics.qualityScore || 0,
      date: sprint.startDate!
    }
  })

  const completionHistory = sortedSprints.map(sprint => {
    const issues = allSprintIssues[sprint.id] || []
    const metrics = calculateSprintMetricsFromIssues(sprint, issues)
    const completionRate = metrics.plannedItems > 0 
      ? (metrics.completedTotalPoints / metrics.plannedItems) * 100 
      : 0
    return {
      sprint: metrics.sprintNumber,
      completionRate,
      date: sprint.startDate!
    }
  })

  const teamPerformanceHistory = sortedSprints.map(sprint => {
    const issues = allSprintIssues[sprint.id] || []
    const metrics = calculateSprintMetricsFromIssues(sprint, issues)
    const efficiencyScore = (metrics.completedTotalPoints + (metrics.qualityScore || 0)) / 2
    return {
      sprint: metrics.sprintNumber,
      efficiencyScore,
      date: sprint.startDate!
    }
  })

  return {
    velocityHistory,
    qualityHistory,
    completionHistory,
    teamPerformanceHistory
  }
}

/**
 * Enhances metrics with calculated values
 */
export function enhanceSprintMetrics(metrics: SprintMetrics): SprintMetrics {
  const qualityScore = calculateQualityScore(metrics.qualityChecklist)
  
  // Calculate velocity achievement based on sprint story point commitment
  const velocityAchievement = metrics.sprintStoryPointCommitment > 0 
    ? Math.round((metrics.completedTotalPoints / metrics.sprintStoryPointCommitment) * 100) 
    : 0
  
  const efficiencyScore = Math.round((velocityAchievement + qualityScore) / 2)

  return {
    ...metrics,
    qualityScore,
    velocityAchievement,
    efficiencyScore,
    velocity: metrics.completedTotalPoints,
    velocityTarget: metrics.sprintStoryPointCommitment // Use commitment as target
  }
}

/**
 * Validates sprint metrics data
 */
export function validateSprintMetrics(metrics: SprintMetrics): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!metrics.sprintNumber) {
    errors.push('Sprint number is required')
  }

  if (metrics.plannedItems < 0) {
    errors.push('Planned items cannot be negative')
  }

  if (metrics.estimatedPoints < 0) {
    errors.push('Estimated points cannot be negative')
  }

  if (metrics.completedTotalPoints < 0) {
    errors.push('Completed points cannot be negative')
  }

  if (metrics.testCoverage < 0 || metrics.testCoverage > 100) {
    errors.push('Test coverage must be between 0 and 100')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Formats trend percentage for display
 */
export function formatTrendPercentage(trend: number): string {
  const sign = trend >= 0 ? '+' : ''
  return `${sign}${trend.toFixed(1)}%`
}

/**
 * Gets trend color based on value
 */
export function getTrendColor(trend: number): string {
  if (trend >= 5) return 'text-green-600'
  if (trend >= 0) return 'text-blue-600'
  if (trend >= -5) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Gets trend icon based on value
 */
export function getTrendIcon(trend: number): string {
  if (trend >= 5) return '↗️'
  if (trend >= 0) return '→'
  if (trend >= -5) return '↘️'
  return '↘️'
}