// Type definitions and validation functions for Jira API responses

// Centralized Jira field mapping
export const JIRA_FIELDS = {
  // Standard fields
  SUMMARY: "summary",
  DESCRIPTION: "description",
  STATUS: "status",
  ASSIGNEE: "assignee",
  ISSUE_TYPE: "issuetype",
  PARENT: "parent",
  ISSUE_LINKS: "issuelinks",
  EPIC: "epic",

  // Custom fields with their mappings
  STORY_POINTS: "customfield_10127",
  EPIC_NAME: "customfield_10015",
  RELEASE_NOTES: "customfield_10113",
} as const;

// Type for field mapping
export type JiraFieldKey = keyof typeof JIRA_FIELDS;
export type JiraFieldValue = typeof JIRA_FIELDS[JiraFieldKey];

// Helper function to get all field values
export function getAllJiraFields(): string[] {
  return Object.values(JIRA_FIELDS);
}

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
    description?: string
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
    [JIRA_FIELDS.STORY_POINTS]?: number
    [JIRA_FIELDS.EPIC_NAME]?: string
    [JIRA_FIELDS.RELEASE_NOTES]?: string
    parent?: {
      key: string
      fields: {
        summary: string
      }
    }
    issuelinks?: Array<{
      id: string
      type: {
        id: string
        name: string
        inward: string
        outward: string
      }
      outwardIssue?: {
        key: string
        fields: {
          summary: string
          issuetype: {
            name: string
          }
        }
      }
      inwardIssue?: {
        key: string
        fields: {
          summary: string
          issuetype: {
            name: string
          }
        }
      }
    }>
    epic?: {
      key: string
      name: string
      color?: {
        key: string
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
  description?: string
  status: string
  assignee?: string
  storyPoints?: number
  issueType: string
  isSubtask: boolean
  parentKey?: string
  epicKey?: string
  epicName?: string
  epicColor?: string
  releaseNotes?: string
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
  // Enhanced epic extraction logic
  let epicKey: string | undefined = undefined;
  let epicName: string | undefined = undefined;
  let epicColor: string | undefined = undefined;

  // Try multiple sources for epic information
  if (issue.fields.epic) {
    // Direct epic field (most reliable)
    epicKey = issue.fields.epic.key;
    epicName = issue.fields.epic.name;
    epicColor = issue.fields.epic.color?.key;
  } else {
    // Check for epic information in custom fields
    const epicNameField = issue.fields[JIRA_FIELDS.EPIC_NAME];

    if (epicNameField && typeof epicNameField === 'string') {
      epicName = epicNameField;
    }

    // If we found an epic key but no name, use the key as the name
    if (epicKey && !epicName) {
      epicName = epicKey;
    }
    // If we found an epic name but no key, try to extract key from name
    else if (epicName && !epicKey && /^[A-Z]+-\d+/.test(epicName)) {
      epicKey = epicName;
    }
  }

  // Fallback to parent information if no epic found
  if (!epicKey && !epicName && issue.fields.parent) {
    epicKey = issue.fields.parent.key;
    epicName = issue.fields.parent.fields?.summary;
  }

  return {
    id: issue.id,
    key: issue.key,
    summary: issue.fields.summary,
    description: issue.fields.description,
    status: issue.fields.status.name,
    assignee: issue.fields.assignee?.displayName,
    storyPoints: issue.fields[JIRA_FIELDS.STORY_POINTS],
    issueType: issue.fields.issuetype.name,
    isSubtask: !!issue.fields.parent,
    parentKey: issue.fields.parent?.key,
    epicKey,
    epicName,
    epicColor,
    releaseNotes: issue.fields[JIRA_FIELDS.RELEASE_NOTES],
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
