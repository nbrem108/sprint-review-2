export interface Issue {
  id: string
  key: string
  summary: string
  description?: string
  status: string
  assignee?: string
  storyPoints?: number
  issueType: string
  epicKey?: string
  epicName?: string
  epicColor?: string
  releaseNotes?: string
}

export interface SprintMetrics {
  plannedItems: number
  estimatedPoints: number
  carryForwardPoints: number
  committedBufferPoints: number
  completedBufferPoints: number
  testCoverage: number
  sprintNumber: string
  completedTotalPoints: number
  completedAdjustedPoints: number
  qualityChecklist: Record<string, "yes" | "no" | "partial" | "na">
}

export interface CurrentSprintRequest {
  sprintName: string
  sprintStartDate?: string
  sprintEndDate?: string
  issues: Issue[]
  metrics?: SprintMetrics
}

export interface UpcomingSprintRequest {
  sprintName: string
  upcomingSprintName: string
  sprintStartDate?: string
  sprintEndDate?: string
  issues: Issue[]
  upcomingIssues: Issue[]
}

export interface DemoStoriesRequest {
  sprintName: string
  issues: Issue[]
  demoStoryIds: string[]
}

export interface SummaryResponse {
  summary?: string
  summaries?: Record<string, string>
  error?: string
} 