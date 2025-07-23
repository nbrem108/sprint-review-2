"use server"

import { NextRequest, NextResponse } from "next/server"
import { 
  fetchJiraProjects, 
  fetchJiraBoardsForProjects, 
  fetchJiraSprints, 
  fetchJiraSprintIssues,
  clearJiraCache,
  getCacheStats
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
      case "clear-cache":
        return await handleClearCache(params)
      case "get-cache-stats":
        return await handleGetCacheStats()
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

    // Fetch boards for all projects in parallel
    const projectKeys = projects.map(p => p.key)
    const boardsByProject = await fetchJiraBoardsForProjects(projectKeys)

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

async function handleClearCache(params?: { pattern?: string }) {
  await clearJiraCache(params?.pattern)
  return NextResponse.json({ success: true })
}

async function handleGetCacheStats() {
  const stats = await getCacheStats()
  return NextResponse.json(stats)
}