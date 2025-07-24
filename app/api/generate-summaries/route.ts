"use server"

import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"

interface Issue {
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

interface SprintMetrics {
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

interface GenerateRequest {
  type: "current-sprint" | "upcoming-sprint" | "demo-stories"
  sprintName: string
  sprintStartDate?: string
  sprintEndDate?: string
  issues: Issue[]
  upcomingIssues?: Issue[]
  demoStoryIds?: string[]
  metrics?: SprintMetrics
  upcomingSprintName?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    let result: any = {}

    switch (body.type) {
      case "current-sprint":
        result = await generateCurrentSprintSummary(body)
        break
      case "upcoming-sprint":
        result = await generateUpcomingSprintSummary(body)
        break
      case "demo-stories":
        result = await generateDemoStoriesSummaries(body)
        break
      default:
        return NextResponse.json({ error: "Invalid generation type" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Summary generation error:", error)
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 })
  }
}

async function generateCurrentSprintSummary(data: GenerateRequest) {
  const completedIssues = data.issues.filter((issue) => issue.status === "Done")
  const totalStoryPoints = data.issues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0)
  const completedStoryPoints = completedIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0)
  const completionRate = totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0

  const demoStoryDetails = completedIssues.map((issue) => {
    const description = issue.description ? `\n  Description: ${issue.description}` : '';
    const releaseNotes = issue.releaseNotes ? `\n  Release Notes: ${issue.releaseNotes}` : '';
    return `- ${issue.key}: ${issue.summary}${description}${releaseNotes}`;
  }).join("\n")

  const prompt = `Create a concise SPRINT REVIEW summary for the following completed sprint:

**Sprint:** ${data.sprintName}
**Completion Rate:** ${completionRate}%
**Total Issues:** ${data.issues.length} (${completedIssues.length} completed)
**Total Story Points:** ${totalStoryPoints} (${completedStoryPoints} completed)

**Demo Stories (Key Accomplishments):**
${demoStoryDetails}

Please provide a professional sprint review summary with up to three sections, using these exact markdown headings and bullet points for each:

- **Sprint Focus**
- **Major Themes**
- **Key Updates**

Across all sections, provide a total of no more than 5 bullet points. Only include a section if it has at least one bullet point. Omit empty sections and their headers. Choose the most relevant sections and points for a concise executive summary. Each bullet must be a single, clear sentence (max 20 words). Do not repeat bullet points between sections. Do not include the section headings as bullet points. Do not include any other sections or headings. Only output the relevant sections with the exact headings: Sprint Focus, Major Themes, Key Updates.

Be extremely concise and use executive-summary style. Format your response in markdown, using the exact headings above (e.g., **Sprint Focus**), and provide concise bullet points under each. This summary will be used directly in a presentation slide.`

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt,
    system:
      "You are a professional scrum master creating sprint review summaries. Focus on business value, user impact, and clear communication for stakeholders. Return only the formatted markdown content without any code blocks or extra formatting.",
    temperature: 0.7,
    maxTokens: 800,
  })

  return { summary: text }
}

async function generateDemoStoriesSummaries(data: GenerateRequest) {
  if (!data.demoStoryIds || data.demoStoryIds.length === 0) {
    return { summaries: {} }
  }

  const summaries: Record<string, string> = {}

  for (const storyId of data.demoStoryIds) {
    const story = data.issues.find((issue) => issue.id === storyId)
    if (!story) continue

    const prompt = `Summarize the following Jira ticket for a sprint review demo slide. Focus on what was accomplished, the value delivered, and keep it concise and clear for stakeholders.

Ticket Details:
Summary: ${story.summary}
Description: ${story.description || "(none)"}
Release Notes: ${story.releaseNotes || "(none)"}
Type: ${story.issueType || "(none)"}
Status: ${story.status || "(none)"}
Story Points: ${story.storyPoints || "(none)"}
Assignee: ${story.assignee || "(none)"}
Epic: ${story.epicName || "(none)"}`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      system:
        "You are a professional scrum master creating sprint review demo summaries. Focus on business value, user impact, and clear communication for stakeholders. Return only the summary text without any code blocks or extra formatting.",
      temperature: 0.7,
      maxTokens: 600,
    })

    summaries[storyId] = text
  }

  return { summaries }
}

async function generateUpcomingSprintSummary(data: GenerateRequest) {
  const upcomingPoints = (data.upcomingIssues || []).reduce((sum, issue) => sum + (issue.storyPoints || 0), 0)
  const issueDetails = (data.upcomingIssues || []).map((issue) => {
    const description = issue.description ? `\n  Description: ${issue.description}` : '';
    const releaseNotes = issue.releaseNotes ? `\n  Release Notes: ${issue.releaseNotes}` : '';
    const epic = issue.epicName ? `\n  Epic: ${issue.epicName}` : '';
    return `- ${issue.key}: ${issue.summary} (${issue.storyPoints || 0} pts, ${issue.issueType})${description}${releaseNotes}${epic}`;
  }).join("\n")

  const prompt = `You are generating a professional sprint planning summary based on the provided data. Do NOT invent goals, deliverables, or success criteria that aren't directly inferable from the input.

**Sprint:** ${data.upcomingSprintName}
**Start Date:** ${data.sprintStartDate ? new Date(data.sprintStartDate).toLocaleDateString() : "TBD"}
**Total Story Points:** ${upcomingPoints}
**Total Issues:** ${(data.upcomingIssues || []).length}

**Planned Issues:**
${issueDetails}

Please provide:

1. **Sprint Overview** — Briefly summarize the general nature of the work based solely on the provided issues.
2. **Key Features & Deliverables** — List any feature work, enhancements, or user-facing changes if identifiable.
3. **Success Criteria** — If clear success measures or expected outcomes are evident, summarize them. Otherwise, state "Not specified."

Format the response as a concise and structured planning summary suitable for stakeholders and sprint planning meetings. Avoid adding assumptions or extrapolated information.`

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt,
    system:
      "You are a professional scrum master creating sprint planning summaries. Focus on planning, preparation, and clear communication of upcoming work for stakeholders and team members. Return only the formatted markdown content without any code blocks or extra formatting.",
    temperature: 0.7,
    maxTokens: 800,
  })

  return { summary: text }
}
