"use server"

import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"
import { DemoStoriesRequest, SummaryResponse } from "@/lib/summary-types"

export async function POST(request: NextRequest) {
  try {
    const body: DemoStoriesRequest = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    if (!body.demoStoryIds || body.demoStoryIds.length === 0) {
      return NextResponse.json({ summaries: {} })
    }

    const result = await generateDemoStoriesSummaries(body)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Demo stories summary generation error:", error)
    return NextResponse.json({ error: "Failed to generate demo stories summaries" }, { status: 500 })
  }
}

// 🧽 Optional post-processor to enforce consistent formatting
function formatSummary(raw: string): string {
  const lines = raw.trim().split("\n").filter(Boolean)

  // Fixes cases where model returns extra line breaks
  if (lines.length >= 7) {
    const title = lines[0].replace(/^(\*\*|)(.*?)(\*\*|)$/, "**$2**")
    const body = lines.slice(1).join("\n")
    return `${title}\n${body}`
  }

  return raw.trim()
}

// Utility function to safely convert any content to string
function safeContentToString(content: any): string {
  if (typeof content === 'string') {
    return content;
  }
  
  if (content === null || content === undefined) {
    return '';
  }
  
  if (typeof content === 'object') {
    // Handle ADF objects
    if (content.type === 'doc' && Array.isArray(content.content)) {
      return content.content.map((node: any) => {
        if (node.type === 'paragraph' && node.content) {
          return node.content.map((child: any) => child.text || '').join('');
        }
        return '';
      }).join('\n\n');
    }
    
    // Handle other objects by converting to JSON string
    try {
      return JSON.stringify(content);
    } catch {
      return '[Object content]';
    }
  }
  
  return String(content);
}

async function generateDemoStoriesSummaries(data: DemoStoriesRequest): Promise<SummaryResponse> {
  const summaries: Record<string, string> = {}

  for (const storyId of data.demoStoryIds) {
    const story = data.issues.find((issue) => issue.id === storyId)
    if (!story) continue

    const prompt = `You are generating a comprehensive demo highlight summary for a Sprint Review deck.

Use this EXACT format with exactly 7 lines (no more, no less):

Line 1: [**Feature Name or Goal**]
Line 2: One sentence on what it does.
Line 3: One sentence on why it matters — describe the user or business value.
Line 4: One sentence on who benefits — include user role and what job it helps them accomplish.
Line 5: Customer Value Proposition — one sentence on the specific value this feature provides to customers.
Line 6: Success Metrics — one sentence on how success will be measured or what goals this achieves.
Line 7: Competitive Differentiation — one sentence on what makes this feature unique or better than alternatives.

Here are the ticket details:
- Summary: ${safeContentToString(story.summary)}
- Description: ${safeContentToString(story.description || "(none)")}
- Release Notes: ${safeContentToString(story.releaseNotes || "(none)")}
- Type: ${safeContentToString(story.issueType || "(none)")}
- Status: ${safeContentToString(story.status || "(none)")}
- Story Points: ${safeContentToString(story.storyPoints || "(none)")}
- Assignee: ${safeContentToString(story.assignee || "(none)")}
- Epic: ${safeContentToString(story.epicName || "(none)")}

IMPORTANT: Return exactly 7 lines. Each line should be on its own line. Use clear stakeholder language. Do not include bullet points, markdown formatting, or section headers.`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      system:
        "You are a Product Owner writing comprehensive demo slide content for Sprint Reviews. You MUST return exactly 7 lines: Line 1 = Feature name, Line 2 = What it does, Line 3 = Why it matters, Line 4 = Who benefits, Line 5 = Customer Value Proposition, Line 6 = Success Metrics, Line 7 = Competitive Differentiation. Each line should be separate and distinct. Use stakeholder-friendly tone and clear, concise language.",
      temperature: 0.7,
      maxTokens: 600,
    })

    summaries[storyId] = formatSummary(text)
  }

  return { summaries }
}
