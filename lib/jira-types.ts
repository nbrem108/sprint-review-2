// Type definitions and validation functions for Jira API responses

export interface JiraProject {
  id: string
  key: string
  name: string
  projectTypeKey?: string
}

export interface JiraSprint {
  id: number
  name: string
  state: "active" | "closed" | "future"
  startDate?: string
  endDate?: string
  completeDate?: string
  originBoardId?: number
  goal?: string
}

export interface JiraIssue {
  id: string
  key: string
  fields: {
    summary: string
    status: {
      name: string
      statusCategory?: {
        key: string
        name: string
      }
    }
    assignee?: {
      displayName: string
      emailAddress?: string
    }
    issuetype: {
      name: string
      iconUrl?: string
    }
    customfield_10016?: number // Story Points
    parent?: {
      key: string
      fields: {
        summary: string
      }
    }
  }
}

export interface JiraBoard {
  id: number
  name: string
  type: string
  location?: {
    projectId: number
    projectKey: string
    projectName: string
  }
}

export interface JiraUser {
  displayName: string
  name?: string
  emailAddress: string
  timeZone?: string
}

// Safe extracted types
export interface SafeJiraProject {
  id: string
  key: string
  name: string
}

export interface SafeJiraSprint {
  id: string
  name: string
  state: "active" | "closed" | "future"
  startDate: string | null
  endDate: string | null
  boardId: string
  goal?: string
}

export interface SafeJiraIssue {
  id: string
  key: string
  summary: string
  status: string
  assignee?: string
  storyPoints?: number
  issueType: string
  isSubtask: boolean
  parentKey?: string
}

export interface SafeJiraUser {
  displayName: string
  name: string
  emailAddress: string
  timeZone: string
}

// Validation functions
export function isValidJiraProjectsResponse(data: any): data is JiraProject[] {
  return (
    Array.isArray(data) &&
    data.every(
      (project) =>
        project &&
        typeof project.id === "string" &&
        typeof project.key === "string" &&
        typeof project.name === "string",
    )
  )
}

export function isValidJiraSprintsResponse(data: any): data is { values: JiraSprint[] } {
  return (
    data &&
    Array.isArray(data.values) &&
    data.values.every((sprint: any) => sprint && typeof sprint.id === "number" && typeof sprint.name === "string")
  )
}

export function isValidJiraSearchResponse(data: any): data is { issues: JiraIssue[] } {
  return (
    data &&
    Array.isArray(data.issues) &&
    data.issues.every(
      (issue: any) =>
        issue &&
        typeof issue.id === "string" &&
        typeof issue.key === "string" &&
        issue.fields &&
        typeof issue.fields.summary === "string",
    )
  )
}

export function isValidJiraBoardsResponse(data: any): data is { values: JiraBoard[] } {
  return (
    data &&
    Array.isArray(data.values) &&
    data.values.every((board: any) => board && typeof board.id === "number" && typeof board.name === "string")
  )
}

// Safe extraction functions
export function extractSafeProject(project: JiraProject): SafeJiraProject {
  return {
    id: project.id,
    key: project.key,
    name: project.name,
  }
}

export function extractSafeSprint(sprint: JiraSprint): SafeJiraSprint {
  return {
    id: sprint.id.toString(),
    name: sprint.name,
    state: sprint.state,
    startDate: sprint.startDate ? new Date(sprint.startDate).toISOString().split("T")[0] : null,
    endDate: sprint.endDate ? new Date(sprint.endDate).toISOString().split("T")[0] : null,
    boardId: sprint.originBoardId?.toString() || "0",
    goal: sprint.goal,
  }
}

export function extractSafeIssue(issue: JiraIssue): SafeJiraIssue {
  return {
    id: issue.id,
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status.name,
    assignee: issue.fields.assignee?.displayName,
    storyPoints: issue.fields.customfield_10016,
    issueType: issue.fields.issuetype.name,
    isSubtask: !!issue.fields.parent,
    parentKey: issue.fields.parent?.key,
  }
}

export function extractSafeUser(user: any): SafeJiraUser {
  return {
    displayName: user.displayName || "Unknown User",
    name: user.name || user.displayName || "unknown",
    emailAddress: user.emailAddress || "unknown@example.com",
    timeZone: user.timeZone || "UTC",
  }
}
