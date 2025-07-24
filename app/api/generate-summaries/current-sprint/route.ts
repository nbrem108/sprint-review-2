"use server"

import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"
import { CurrentSprintRequest, SummaryResponse } from "@/lib/summary-types"
import { getEpicBreakdown } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const body: CurrentSprintRequest = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    const result = await generateCurrentSprintSummary(body)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Current sprint summary generation error:", error)
    return NextResponse.json({ error: "Failed to generate current sprint summary" }, { status: 500 })
  }
}

async function generateCurrentSprintSummary(data: CurrentSprintRequest): Promise<SummaryResponse> {
  // Filter out sub-tasks or non-story-level work
  const validIssues = data.issues.filter(
    (issue) => issue.issueType.toLowerCase() !== "sub-task"
  );

  if (validIssues.length === 0) {
    return {
      summary: `### Sprint Review Summary

**Sprint:** ${data.sprintName}  
**End Date:** ${data.sprintEndDate ? new Date(data.sprintEndDate).toLocaleDateString() : "TBD"}  

#### Sprint Overview  
No story-level issues were linked to this sprint. This may indicate a planning sprint or missing story associations.

#### Key Features & Deliverables  
None recorded.

#### Success Criteria  
Not specified.
      `,
    };
  }

  const totalPoints = validIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
  const epicBreakdown = getEpicBreakdown(validIssues);

  const epicBreakdownText = epicBreakdown.map(epic => {
    return `- **${epic.name}**
  - Stories: ${epic.completed}/${epic.total} completed
  - Points: ${epic.completedPoints}/${epic.totalPoints} points (${epic.percentPoints}% complete)`;
  }).join('\n');

  const issueList = validIssues.map((issue) => {
    const parts = [
      `- **${issue.key}**: ${issue.summary} (${issue.storyPoints || 0} pts, ${issue.issueType})`,
      issue.status ? `  - Status: ${issue.status}` : "",
      issue.description ? `  - Desc: ${issue.description}` : "",
      issue.releaseNotes ? `  - Notes: ${issue.releaseNotes}` : "",
      issue.epicName ? `  - Epic: ${issue.epicName}` : "",
    ];
    return parts.filter(Boolean).join("\n");
  }).join("\n\n");

  const prompt = `You are a professional scrum master writing a sprint review summary for a stakeholder audience. Focus on clarity, conciseness, and accurate reflection of the work completed or in progress. Do not make up any data.

**Sprint:** ${data.sprintName}  
**End Date:** ${data.sprintEndDate ? new Date(data.sprintEndDate).toLocaleDateString() : "TBD"}  
**Total Story Points (All statuses):** ${totalPoints}  
**Total Issues:** ${validIssues.length}  

### Epic Breakdown
${epicBreakdownText}

### Issues
${issueList}

### Instructions
1. **Sprint Overview** – Describe the general scope and theme of work (e.g. setup, enhancements, bugs, polish). Include a summary of epic progress.
2. **Key Features & Deliverables** – List major stories or enhancements and their value, organized by epic where relevant.
3. **Success Criteria / Challenges** – Summarize any obvious outcome measures or blockers. Say "Not specified" if unclear.

Output should be formatted and stakeholder-friendly. Do not include raw issue lists or markdown syntax in your answer.`

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt,
    system:
      "You are a professional scrum master preparing Sprint Review summaries. Emphasize clear communication and value delivery. Return clean, concise text suitable for executive review slides.",
    temperature: 0.7,
    maxTokens: 1200,
  });

  return { summary: text.trim() };
}
