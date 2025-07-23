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

  const qualityScore = data.metrics ? calculateQualityScore(data.metrics.qualityChecklist) : null

  const prompt = `Generate a professional sprint review summary for ${data.sprintName}. Use the following data:

SPRINT PERFORMANCE:
- Total Issues: ${data.issues.length}
- Completed Issues: ${completedIssues.length}
- Completion Rate: ${completionRate}%
- Total Story Points: ${totalStoryPoints}
- Completed Story Points: ${completedStoryPoints}

COMPLETED DELIVERABLES:
${completedIssues.map((issue) => {
  const description = issue.description ? `\n  Description: ${issue.description}` : '';
  const releaseNotes = issue.releaseNotes ? `\n  Release Notes: ${issue.releaseNotes}` : '';
  return `- ${issue.key}: ${issue.summary} (${issue.storyPoints || 0} pts, ${issue.assignee || "Unassigned"})${description}${releaseNotes}`;
}).join("\n")}

${
  data.metrics
    ? `SPRINT METRICS:
- Quality Score: ${qualityScore}%
- Test Coverage: ${data.metrics.testCoverage}%
- Planned Items: ${data.metrics.plannedItems}
- Estimated Points: ${data.metrics.estimatedPoints}
- Completed Total Points: ${data.metrics.completedTotalPoints}
- Completed Adjusted Points: ${data.metrics.completedAdjustedPoints}

QUALITY STANDARDS:
${Object.entries(data.metrics.qualityChecklist)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join("\n")}`
    : ""
}

Create a comprehensive sprint summary that includes:
1. Executive overview with key metrics
2. Major accomplishments and deliverables
3. Performance analysis (velocity, quality, completion rate)
4. Team highlights and individual contributions
5. Challenges overcome and lessons learned
6. Impact on project goals and stakeholder value

Format as markdown with clear sections. Be professional, data-driven, and suitable for stakeholder presentation. Focus on achievements and business value delivered.`

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt,
    temperature: 0.7,
    maxTokens: 1500,
  })

  return { summary: text }
}

async function generateUpcomingSprintSummary(data: GenerateRequest) {
  const upcomingPoints = (data.upcomingIssues || []).reduce((sum, issue) => sum + (issue.storyPoints || 0), 0)

  const prompt = `Generate a professional upcoming sprint planning summary for ${data.upcomingSprintName}. Use the following data:

UPCOMING SPRINT PLANNING:
- Sprint Name: ${data.upcomingSprintName}
- Total Planned Issues: ${(data.upcomingIssues || []).length}
- Total Story Points: ${upcomingPoints}

PLANNED DELIVERABLES:
${(data.upcomingIssues || []).map((issue) => `- ${issue.key}: ${issue.summary} (${issue.storyPoints || 0} pts, ${issue.issueType})`).join("\n")}

CONTEXT FROM CURRENT SPRINT:
- Current Sprint: ${data.sprintName}
- Current Sprint Issues: ${data.issues.length}
- Lessons learned and momentum to carry forward

Create a forward-looking sprint planning summary that includes:
1. Sprint goals and objectives
2. Key deliverables and priorities
3. Resource allocation and capacity planning
4. Risk assessment and mitigation strategies
5. Success criteria and measurement approach
6. Dependencies and coordination requirements

Format as markdown with clear sections. Be strategic, forward-thinking, and suitable for stakeholder communication. Focus on planning, preparation, and expected outcomes.`

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt,
    temperature: 0.7,
    maxTokens: 1200,
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

    const prompt = `Generate a professional demo story summary for presentation. Use the following data:

STORY DETAILS:
- Key: ${story.key}
- Summary: ${story.summary}
- Status: ${story.status}
- Type: ${story.issueType}
- Story Points: ${story.storyPoints || "Not estimated"}
- Assignee: ${story.assignee || "Unassigned"}
${story.description ? `- Description: ${story.description}` : ''}
${story.releaseNotes ? `- Release Notes: ${story.releaseNotes}` : ''}

SPRINT CONTEXT:
- Sprint: ${data.sprintName}
- Sprint Performance: Part of ${data.issues.length} total items

Create a compelling demo story summary that includes:
1. Story overview and business context
2. Technical implementation highlights
3. User value and business impact
4. Quality and testing approach
5. Demo key points and features to showcase
6. Success metrics and acceptance criteria met

Format as markdown suitable for presentation slides. Be engaging, business-focused, and highlight the value delivered. This will be used during sprint demo to stakeholders.`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.7,
      maxTokens: 800,
    })

    summaries[storyId] = text
  }

  return { summaries }
}

function calculateQualityScore(checklist: Record<string, "yes" | "no" | "partial" | "na">): number {
  const scores = Object.values(checklist)
    .map((value) => {
      switch (value) {
        case "yes":
          return 1
        case "partial":
          return 0.5
        case "no":
          return 0
        case "na":
          return null
        default:
          return 0
      }
    })
    .filter((score): score is 1 | 0.5 | 0 => score !== null)

  if (scores.length === 0) return 0
  const average =
    scores.reduce((sum, score) => sum + score, 0 as number) / scores.length
  return Math.round(average * 100)
}
