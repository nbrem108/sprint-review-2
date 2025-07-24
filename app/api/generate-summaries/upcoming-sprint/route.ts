"use server"

import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"
import { UpcomingSprintRequest, SummaryResponse } from "@/lib/summary-types"

export async function POST(request: NextRequest) {
  try {
    const body: UpcomingSprintRequest = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    const result = await generateUpcomingSprintSummary(body)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Upcoming sprint summary generation error:", error)
    return NextResponse.json({ error: "Failed to generate upcoming sprint summary" }, { status: 500 })
  }
}

async function generateUpcomingSprintSummary(data: UpcomingSprintRequest): Promise<SummaryResponse> {
  const upcomingPoints = data.upcomingIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0)
  const issueDetails = data.upcomingIssues.map((issue) => {
    const description = issue.description ? `\n  Description: ${issue.description}` : '';
    const releaseNotes = issue.releaseNotes ? `\n  Release Notes: ${issue.releaseNotes}` : '';
    const epic = issue.epicName ? `\n  Epic: ${issue.epicName}` : '';
    return `- ${issue.key}: ${issue.summary} (${issue.storyPoints || 0} pts, ${issue.issueType})${description}${releaseNotes}${epic}`;
  }).join("\n")

  const prompt = `You are generating a professional sprint planning summary based on the provided data. Do NOT invent goals, deliverables, or success criteria that aren't directly inferable from the input.

**Sprint:** ${data.upcomingSprintName}
**Start Date:** ${data.sprintStartDate ? new Date(data.sprintStartDate).toLocaleDateString() : "TBD"}
**Total Story Points:** ${upcomingPoints}
**Total Issues:** ${data.upcomingIssues.length}

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