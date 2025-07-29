"use server"

import { NextRequest, NextResponse } from "next/server"
import { 
  fetchJiraProjects, 
  fetchJiraBoardsForProjects, 
  fetchJiraBoards,
  fetchJiraBoardsRobust,
  boardHasSprints,
  fetchJiraSprints, 
  fetchJiraSprintIssues,
  clearJiraCache,
  getCacheStats,
  analyzeJiraFields
} from "@/lib/jira-api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operation, params } = body

    switch (operation) {
      case "fetch-projects-with-boards":
        return await handleFetchProjectsWithBoards()
      case "fetch-sprint-with-issues":
        return await handleFetchSprintWithIssues(params)
      case "analyze-fields":
        return await handleAnalyzeFields(params)
      case "clear-cache":
        return await handleClearCache(params)
      case "get-cache-stats":
        return await handleGetCacheStats()
      case "debug-ptq":
        return await handleDebugPTQ()
      default:
        return NextResponse.json({ error: "Invalid operation" }, { status: 400 })
    }
  } catch (error) {
    console.error("Batch API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

async function handleFetchProjectsWithBoards() {
  try {
    console.log("🚀 Batch operation: Fetching projects with boards...")
    
    // Fetch projects first
    const projects = await fetchJiraProjects()
    
    if (!projects || projects.length === 0) {
      return NextResponse.json({ projects: [] })
    }

    // Fetch boards for all projects using robust approach
    const boardPromises = projects.map(async (project) => {
      const boards = await fetchJiraBoardsRobust(project.key, project.id)
      return { projectKey: project.key, boards }
    })
    
    const boardResults = await Promise.all(boardPromises)
    const boardsByProject: Record<string, any[]> = {}
    boardResults.forEach(({ projectKey, boards }) => {
      boardsByProject[projectKey] = boards
    })

    // Combine projects with their boards
    const projectsWithBoards = projects.map((project) => {
      const projectBoards = (boardsByProject[project.key] || []).map((b:any)=> ({ ...b, id: b.id.toString() }))
      let boardId: string | undefined = undefined
      let boardName: string | undefined = undefined
      if (projectBoards.length === 1) {
        boardId = projectBoards[0].id
        boardName = projectBoards[0].name
      }

      return {
        id: project.id,
        key: project.key,
        name: project.name,
        boards: projectBoards,
        boardId,
        boardName,
      }
    })

    console.log(`✅ Batch operation completed: ${projectsWithBoards.length} projects with boards`)
    return NextResponse.json({ projects: projectsWithBoards })
  } catch (error) {
    console.error("Failed to fetch projects with boards:", error)
    throw error
  }
}

async function handleFetchSprintWithIssues(params: { boardId: number; sprintId: number }) {
  try {
    console.log("🚀 Batch operation: Fetching sprint with issues...")
    const { boardId, sprintId } = params
    if (!boardId || !sprintId) {
      throw new Error("Board ID and Sprint ID are required")
    }
    const [sprints, issues] = await Promise.all([
      fetchJiraSprints(boardId),
      fetchJiraSprintIssues(sprintId),
    ])
    const selectedSprint = sprints.find((s) => s.id === sprintId.toString())
    return NextResponse.json({ sprint: selectedSprint, issues, availableSprints: sprints })
  } catch (error) {
    console.error("Failed to fetch sprint with issues:", error)
    throw error
  }
}

async function handleAnalyzeFields(params: { sprintId: number }) {
  try {
    console.log("🚀 Batch operation: Analyzing Jira fields...")
    const { sprintId } = params
    if (!sprintId) {
      throw new Error("Sprint ID is required")
    }
    const fields = await analyzeJiraFields(sprintId)
    return NextResponse.json({ fields })
  } catch (error) {
    console.error("Failed to analyze Jira fields:", error)
    throw error
  }
}

async function handleClearCache(params?: { pattern?: string }) {
  await clearJiraCache(params?.pattern)
  return NextResponse.json({ success: true })
}

async function handleGetCacheStats() {
  const stats = await getCacheStats()
  return NextResponse.json(stats)
}

async function handleDebugPTQ() {
  try {
    console.log("🔍 Debug operation: Testing PTQ project...")
    
    // Test 1: Check if PTQ project exists
    const projects = await fetchJiraProjects()
    const ptqProject = projects.find(p => p.key === 'PTQ')
    
    if (!ptqProject) {
      return NextResponse.json({ 
        error: "PTQ project not found",
        availableProjects: projects.map(p => ({ key: p.key, name: p.name }))
      })
    }
    
    console.log("🔍 PTQ project found:", ptqProject)
    
    // Test 2: Check boards for PTQ using project key
    console.log("🔍 Testing boards with project key 'PTQ'...")
    const boardsWithKey = await fetchJiraBoards('PTQ')
    
    // Test 3: Check boards for PTQ using project ID
    console.log("🔍 Testing boards with project ID '10005'...")
    const boardsWithId = await fetchJiraBoards('10005')
    
    // Test 4: Check boards using robust approach
    console.log("🔍 Testing boards with robust approach...")
    const boardsRobust = await fetchJiraBoardsRobust('PTQ', '10005')
    
    // Test 5: Check if boards have sprints (using the approach that found boards)
    const boardsToTest = boardsRobust.length > 0 ? boardsRobust : (boardsWithKey.length > 0 ? boardsWithKey : boardsWithId)
    const boardsWithSprints = await Promise.all(
      boardsToTest.map(async (board: any) => {
        const hasSprints = await boardHasSprints(board.id, board.type)
        return {
          ...board,
          hasSprints
        }
      })
    )
    
    return NextResponse.json({
      ptqProject,
      boardsWithKey,
      boardsWithId,
      boardsRobust,
      boardsWithSprints,
      summary: {
        projectFound: true,
        boardsFoundWithKey: boardsWithKey.length,
        boardsFoundWithId: boardsWithId.length,
        boardsFoundWithRobust: boardsRobust.length,
        boardsWithSprints: boardsWithSprints.filter((b: any) => b.hasSprints).length,
        recommendedApproach: boardsRobust.length > 0 ? 'robust' : (boardsWithId.length > boardsWithKey.length ? 'projectId' : 'projectKey')
      }
    })
  } catch (error) {
    console.error("Failed to debug PTQ:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}