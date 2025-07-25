"use server"

import { validateEnv, getJiraHeaders, handleJiraResponse, env } from "./jira-env"
import {
  isValidJiraProjectsResponse,
  isValidJiraSprintsResponse,
  isValidJiraSearchResponse,
  isValidJiraBoardsResponse,
  extractSafeProject,
  extractSafeSprint,
  extractSafeIssue,
  extractSafeUser,
  type SafeJiraSprint,
  type SafeJiraIssue,
  type SafeJiraUser,
  JIRA_FIELDS,
  getAllJiraFields,
} from "./jira-types"

export interface JiraProjectsResult {
  key: string
  name: string
  id: string
  boardId?: string
  boardName?: string
  boards?: { id: string; name: string; type: string }[]
}

export interface JiraSprintsResult {
  boardId: number
  sprints: SafeJiraSprint[]
}

export interface JiraIssuesResult {
  issues: SafeJiraIssue[]
}

export interface JiraConnectionResult {
  success: boolean
  user?: SafeJiraUser
  error?: string
}

// 🚀 Performance optimizations
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const REQUEST_TIMEOUT = 15000 // 15 seconds (reduced from 30-45s)
const MAX_CONCURRENT_REQUESTS = 5

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>()

function getCacheKey(operation: string, params?: Record<string, any>): string {
  const paramString = params ? JSON.stringify(params) : ""
  return `${operation}:${paramString}`
}

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T
  }
  cache.delete(key)
  return null
}

function setCachedData(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() })
}

// 🔒 Safe cloning utility (optimized)
function safeClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// 🔒 Freeze objects in development to catch mutations (optimized)
function freezeInDev<T>(obj: T): T {
  if (process.env.NODE_ENV === "development") {
    if (Array.isArray(obj)) {
      return obj.map((item) => Object.freeze(item)) as T
    } else if (typeof obj === "object" && obj !== null) {
      return Object.freeze(obj)
    }
  }
  return obj
}

// 🚀 Optimized fetch with caching and timeout
async function optimizedFetch(url: string, options: RequestInit = {}, operation: string): Promise<any> {
  const cacheKey = getCacheKey(operation, { url, method: options.method })
  const cached = getCachedData(cacheKey)
  if (cached) {
    console.log(`🚀 Cache hit for ${operation}`)
    return cached
  }

  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
  })

  const data = await handleJiraResponse(response, operation)
  setCachedData(cacheKey, data)
  return data
}

// 🚀 Parallel request executor with concurrency limit
async function executeParallelRequests<T>(
  requests: (() => Promise<T>)[],
  maxConcurrent: number = MAX_CONCURRENT_REQUESTS
): Promise<T[]> {
  const results: T[] = []
  const executing: Promise<void>[] = []

  for (const request of requests) {
    const promise = request().then((result) => {
      results.push(result)
    })
    executing.push(promise)

    if (executing.length >= maxConcurrent) {
      await Promise.race(executing)
      executing.splice(executing.findIndex(p => p === promise), 1)
    }
  }

  await Promise.all(executing)
  return results
}

export async function testJiraConnection(): Promise<JiraConnectionResult> {
  try {
    console.log("🔍 Testing Jira connection...")
    console.log("Environment check:")
    console.log("- JIRA_BASE_URL:", env.JIRA_BASE_URL ? "✓ Set" : "✗ Missing")
    console.log("- JIRA_EMAIL:", env.JIRA_EMAIL ? "✓ Set" : "✗ Missing")
    console.log("- JIRA_API_TOKEN:", env.JIRA_API_TOKEN ? "✓ Set" : "✗ Missing")

    validateEnv()

    const url = `${env.JIRA_BASE_URL}/rest/api/3/myself`
    const userData = await optimizedFetch(url, { headers: getJiraHeaders() }, "connection_test")
    const safeUser = extractSafeUser(userData)

    console.log("✅ Jira connection successful")
    return {
      success: true,
      user: freezeInDev(safeUser),
    }
  } catch (error) {
    console.error("❌ Jira connection failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown connection error",
    }
  }
}

export async function fetchJiraProjects(): Promise<JiraProjectsResult[]> {
  try {
    console.log("🔍 Fetching Jira projects...")
    validateEnv()

    const url = `${env.JIRA_BASE_URL}/rest/api/3/project`
    const data = await optimizedFetch(url, { headers: getJiraHeaders() }, "fetch_projects")

    if (!isValidJiraProjectsResponse(data)) {
      throw new Error("Invalid response format from JIRA projects API")
    }

    // Filter for software projects and extract safely
    const softwareProjects = data
      .filter((project) => !project.projectTypeKey || project.projectTypeKey === "software")
      .map((project) => {
        const safeProject = extractSafeProject(project)
        return {
          id: safeProject.id,
          key: safeProject.key,
          name: safeProject.name,
        }
      })

    console.log(`✅ Found ${softwareProjects.length} software projects`)
    return freezeInDev(softwareProjects)
  } catch (error) {
    console.error("❌ Failed to fetch projects:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to fetch JIRA projects: ${error.message}`)
    }
    throw new Error("Unknown error occurred while fetching JIRA projects")
  }
}

export async function fetchJiraBoards(projectKey?: string): Promise<any[]> {
  try {
    console.log(`🔍 Fetching boards${projectKey ? ` for project ${projectKey}` : ""}...`)
    validateEnv()

    let url: string
    if (projectKey) {
      url = `${env.JIRA_BASE_URL}/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(projectKey)}`
    } else {
      url = `${env.JIRA_BASE_URL}/rest/agile/1.0/board` // fallback
    }

    const data = await optimizedFetch(url, { headers: getJiraHeaders() }, `fetch_boards_${projectKey || 'all'}`)

    if (!isValidJiraBoardsResponse(data)) {
      throw new Error("Invalid response format from JIRA boards API")
    }

    const safeBoards = data.values.map((board) => ({
      id: board.id,
      name: String(board.name),
      type: String(board.type),
    }))

    console.log(`✅ Found ${safeBoards.length} boards`)
    return freezeInDev(safeBoards)
  } catch (error) {
    console.error("❌ Failed to fetch boards:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to fetch JIRA boards: ${error.message}`)
    }
    throw new Error("Unknown error occurred while fetching JIRA boards")
  }
}

export async function boardHasSprints(boardId: number, boardType?: string): Promise<boolean> {
  // Company-managed (scrum / kanban) boards throw 400 on the features endpoint.
  if (boardType && boardType !== "simple") {
    // Assume scrum boards have sprints; kanban usually doesn’t but we still allow it.
    return boardType === "scrum" || boardType === "kanban"
  }

  try {
    const url = `${env.JIRA_BASE_URL}/rest/agile/1.0/board/${boardId}/features`
    const data = await optimizedFetch(url, { headers: getJiraHeaders() }, `board_features_${boardId}`)
    if (!data || !Array.isArray(data.features)) return false
    return data.features.some((f: any) => f.feature === "sprints" && f.enabled)
  } catch (error: any) {
    // Jira returns 400 "not an agility board" for company-managed boards – treat as sprint-capable.
    if (error instanceof Error && error.message.includes("not an agility board")) {
      return true
    }
    console.warn(`Failed to fetch features for board ${boardId}:`, error)
    return false
  }
}

// 🚀 Optimized: Fetch boards for multiple projects in parallel
export async function fetchJiraBoardsForProjects(projectKeys: string[]): Promise<Record<string, any[]>> {
  try {
    console.log(`🔍 Fetching boards for ${projectKeys.length} projects in parallel...`)
    validateEnv()

    const boardRequests = projectKeys.map((projectKey) => async () => {
      const boards = await fetchJiraBoards(projectKey)

      // Filter boards that have Sprints enabled
      const usableBoards = await executeParallelRequests(
        boards.map((b: any) => async () => ((await boardHasSprints(b.id, b.type)) ? b : null))
      )

      return { projectKey, boards: usableBoards.filter(Boolean) }
    })

    const results = await executeParallelRequests(boardRequests)

    const boardsByProject: Record<string, any[]> = {}
    results.forEach(({ projectKey, boards }) => {
      boardsByProject[projectKey] = boards
    })

    console.log(`✅ Fetched boards for ${Object.keys(boardsByProject).length} projects`)
    return boardsByProject
  } catch (error) {
    console.error("❌ Failed to fetch boards for projects:", error)
    throw error
  }
}

export async function fetchJiraSprints(boardId: number): Promise<SafeJiraSprint[]> {
  try {
    console.log(`🔍 Fetching sprints for board ${boardId}...`)
    validateEnv()

    if (!boardId || isNaN(boardId)) {
      throw new Error("Valid board ID is required")
    }
    const allSprints: SafeJiraSprint[] = []
    let startAt = 0
    const pageSize = 50

    while (true) {
      const url = `${env.JIRA_BASE_URL}/rest/agile/1.0/board/${boardId}/sprint?maxResults=${pageSize}&startAt=${startAt}`
      const page = await optimizedFetch(url, { headers: getJiraHeaders() }, `fetch_sprints_${boardId}_${startAt}`)

      if (!isValidJiraSprintsResponse(page)) {
        throw new Error("Invalid response format from JIRA sprints API")
      }

      allSprints.push(...page.values.map((s) => extractSafeSprint(s)))

      const pageAny: any = page
      if (pageAny.isLast || page.values.length < pageSize) break
      startAt += pageSize
    }

    const safeSprints = allSprints.map((sprint) => {
      const safeSprint = sprint
      return {
        id: safeSprint.id,
        name: safeSprint.name,
        state: safeSprint.state,
        startDate: safeSprint.startDate,
        endDate: safeSprint.endDate,
        boardId: safeSprint.boardId,
        goal: safeSprint.goal,
      }
    })

    // Sort sprints: active first, then by start date descending
    const sortedSprints = safeSprints.sort((a, b) => {
      if (a.state === "active" && b.state !== "active") return -1
      if (b.state === "active" && a.state !== "active") return 1

      const aDate = new Date(a.startDate || 0)
      const bDate = new Date(b.startDate || 0)
      return bDate.getTime() - aDate.getTime()
    })

    console.log(`✅ Found ${sortedSprints.length} sprints`)
    return freezeInDev(sortedSprints)
  } catch (error) {
    console.error("❌ Failed to fetch sprints:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to fetch JIRA sprints: ${error.message}`)
    }
    throw new Error("Unknown error occurred while fetching JIRA sprints")
  }
}

export async function fetchJiraSprintIssues(sprintId: number): Promise<SafeJiraIssue[]> {
  try {
    console.log(`🔍 Fetching issues for sprint ${sprintId}...`)
    validateEnv()

    if (!sprintId || isNaN(sprintId)) {
      throw new Error("Valid sprint ID is required")
    }

    const jql = `sprint = ${sprintId}`
    const url = `${env.JIRA_BASE_URL}/rest/api/3/search`

    const data = await optimizedFetch(
      url,
      {
        method: "POST",
        headers: getJiraHeaders(),
        body: JSON.stringify({
          jql,
          maxResults: 1000,
          fields: getAllJiraFields(),
        }),
      },
      `fetch_sprint_issues_${sprintId}`
    )

    if (!isValidJiraSearchResponse(data)) {
      throw new Error("Invalid response format from JIRA search API")
    }

    const safeIssues = data.issues.map((issue) => extractSafeIssue(issue))

    console.log(`✅ Found ${safeIssues.length} issues for sprint ${sprintId}`)
    return freezeInDev(safeIssues)
  } catch (error) {
    console.error("❌ Failed to fetch sprint issues:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to fetch JIRA sprint issues: ${error.message}`)
    }
    throw new Error("Unknown error occurred while fetching JIRA sprint issues")
  }
}

export async function fetchJiraIssuesByJQL(jql: string): Promise<SafeJiraIssue[]> {
  try {
    console.log(`🔍 Fetching issues with JQL: ${jql}`)
    validateEnv()

    if (!jql.trim()) {
      throw new Error("JQL query is required")
    }

    const url = `${env.JIRA_BASE_URL}/rest/api/3/search`
    const data = await optimizedFetch(
      url,
      {
        method: "POST",
        headers: getJiraHeaders(),
        body: JSON.stringify({
          jql,
          maxResults: 1000,
          fields: getAllJiraFields(),
        }),
      },
      `fetch_jql_issues_${Buffer.from(jql).toString('base64').slice(0, 20)}`
    )

    if (!isValidJiraSearchResponse(data)) {
      throw new Error("Invalid response format from JIRA search API")
    }

    const safeIssues = data.issues.map((issue) => {
      const safeIssue = extractSafeIssue(issue)
      
      // Debug logging for epic information
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 Epic debug for ${issue.key}:`, {
          epicKey: safeIssue.epicKey,
          epicName: safeIssue.epicName,
          epicColor: safeIssue.epicColor,
          rawEpicField: issue.fields.epic,
          parent: issue.fields.parent
        });
      }
      
      return safeIssue;
    })

    console.log(`✅ Found ${safeIssues.length} issues with JQL query`)
    return freezeInDev(safeIssues)
  } catch (error) {
    console.error("❌ Failed to fetch issues by JQL:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to fetch JIRA issues by JQL: ${error.message}`)
    }
    throw new Error("Unknown error occurred while fetching JIRA issues by JQL")
  }
}

// 🚀 New: Utility function to help identify JIRA field mappings
export async function analyzeJiraFields(sprintId: number): Promise<any> {
  try {
    console.log(`🔍 Analyzing JIRA fields for sprint ${sprintId}...`)
    validateEnv()

    if (!sprintId || isNaN(sprintId)) {
      throw new Error("Valid sprint ID is required")
    }

    const jql = `sprint = ${sprintId}`
    const url = `${env.JIRA_BASE_URL}/rest/api/3/search`

    // Request all fields to analyze what's available
    const data = await optimizedFetch(
      url,
      {
        method: "POST",
        headers: getJiraHeaders(),
        body: JSON.stringify({
          jql,
          maxResults: 10, // Just get a few issues for analysis
          fields: ["*all"], // Request all fields
        }),
      },
      `analyze_fields_${sprintId}`
    )

    if (!isValidJiraSearchResponse(data)) {
      throw new Error("Invalid response format from JIRA search API")
    }

    // Analyze multiple issues to get a better picture
    const fieldAnalysis = {
      totalIssues: data.issues.length,
      sampleIssues: data.issues.map((issue: any) => ({
        key: issue.key,
        summary: issue.fields.summary,
        issueType: issue.fields.issuetype?.name,
        availableFields: Object.keys(issue.fields),
        customFields: {} as Record<string, { value: any; type: string }>,
        potentialEpicFields: {} as Record<string, { value: any; type: string }>,
      })),
      epicRelatedFields: {} as Record<string, { value: any; type: string }>,
      allCustomFields: {} as Record<string, { value: any; type: string; count: number }>,
    };

    // Analyze each issue
    data.issues.forEach((issue: any) => {
      const issueAnalysis = fieldAnalysis.sampleIssues.find(s => s.key === issue.key);
      if (!issueAnalysis) return;

      // Look for epic-related fields and custom fields
      Object.entries(issue.fields).forEach(([fieldName, fieldValue]) => {
        // Track all custom fields
        if (fieldName.startsWith('customfield_')) {
          if (!fieldAnalysis.allCustomFields[fieldName]) {
            fieldAnalysis.allCustomFields[fieldName] = {
              value: fieldValue,
              type: typeof fieldValue,
              count: 0
            };
          }
          fieldAnalysis.allCustomFields[fieldName].count++;
          
          issueAnalysis.customFields[fieldName] = {
            value: fieldValue,
            type: typeof fieldValue
          };
        }

        // Look for epic-related fields
        if (fieldName.toLowerCase().includes('epic') || 
            fieldName.toLowerCase().includes('parent') ||
            fieldName.toLowerCase().includes('theme') ||
            fieldName.toLowerCase().includes('initiative')) {
          fieldAnalysis.epicRelatedFields[fieldName] = {
            value: fieldValue,
            type: typeof fieldValue
          };
          issueAnalysis.potentialEpicFields[fieldName] = {
            value: fieldValue,
            type: typeof fieldValue
          };
        }

        // Check for fields that might contain epic-like information
        if (typeof fieldValue === 'string' && fieldValue.length > 0) {
          // Look for patterns that might indicate epic information
          if (/^[A-Z]+-\d+$/.test(fieldValue) || // Looks like a key
              fieldValue.length > 10 && fieldValue.length < 100) { // Reasonable length for epic name
            issueAnalysis.potentialEpicFields[fieldName] = {
              value: fieldValue,
              type: typeof fieldValue
            };
          }
        }
      });
    });

    console.log(`✅ Field analysis completed for ${data.issues.length} issues`);
    return fieldAnalysis;
  } catch (error) {
    console.error("❌ Failed to analyze JIRA fields:", error);
    throw error;
  }
}

// 🚀 New: Clear cache function for manual cache management
export async function clearJiraCache(pattern?: string): Promise<void> {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key)
      }
    }
    console.log(`🧹 Cleared cache entries matching: ${pattern}`)
  } else {
    cache.clear()
    console.log("🧹 Cleared all Jira API cache")
  }
}

// 🚀 New: Get cache statistics
export async function getCacheStats(): Promise<{ size: number; entries: string[] }> {
  return {
    size: cache.size,
    entries: Array.from(cache.keys()),
  }
}
