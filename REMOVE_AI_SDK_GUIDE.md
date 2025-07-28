# Remove @ai-sdk/openai Package - Fix Private Registry Issue

## Problem
The `@ai-sdk/openai` package is causing npm login issues because it's being pulled from a private CommandAlkon registry. This package is only used for the `openai` function, but the `ai` package (which you already have) can handle OpenAI integration directly.

## Solution: Replace @ai-sdk/openai with public 'ai' package

### Step 1: Update the API routes to use only the 'ai' package

**File: `app/api/generate-summaries/current-sprint/route.ts`**
```typescript
"use server"

// Remove this line:
// import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"
import { CurrentSprintRequest, SummaryResponse } from "@/lib/summary-types"
import { getEpicBreakdown } from "@/lib/utils"

// ... rest of the code stays the same until the generateText call ...

  const { text } = await generateText({
    // Change this line:
    // model: openai("gpt-4o"),
    // To this:
    model: "gpt-4o",
    prompt,
    system:
      "You are a professional scrum master preparing Sprint Review summaries. Emphasize clear communication and value delivery. Return clean, concise text suitable for executive review slides.",
    temperature: 0.7,
    maxTokens: 1200,
  });
```

**File: `app/api/generate-summaries/demo-stories/route.ts`**
```typescript
"use server"

// Remove this line:
// import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"
import { DemoStoriesRequest, SummaryResponse } from "@/lib/summary-types"

// ... rest of the code stays the same until the generateText call ...

  const { text } = await generateText({
    // Change this line:
    // model: openai("gpt-4o"),
    // To this:
    model: "gpt-4o",
    prompt,
    system: "You are generating demo story summaries for Sprint Review presentations. Focus on clear, concise descriptions that highlight value and user benefits.",
    temperature: 0.7,
    maxTokens: 800,
  });
```

**File: `app/api/generate-summaries/upcoming-sprint/route.ts`**
```typescript
"use server"

// Remove this line:
// import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"
import { UpcomingSprintRequest, SummaryResponse } from "@/lib/summary-types"

// ... rest of the code stays the same until the generateText call ...

  const { text } = await generateText({
    // Change this line:
    // model: openai("gpt-4o"),
    // To this:
    model: "gpt-4o",
    prompt,
    system:
      "You are a professional scrum master creating sprint planning summaries. Focus on planning, preparation, and clear communication of upcoming work for stakeholders and team members. Return only the formatted markdown content without any code blocks or extra formatting.",
    temperature: 0.7,
    maxTokens: 800,
  })
```

### Step 2: Remove the @ai-sdk/openai package

```bash
# Remove the problematic package
npm uninstall @ai-sdk/openai

# This will also remove any related @ai-sdk packages that were installed as dependencies
```

### Step 3: Clean up and reinstall

```bash
# Delete package-lock.json to remove private registry references
rm package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall with public registry
npm install
```

### Step 4: Verify the fix

Check that the new `package-lock.json` no longer contains private registry URLs:

```bash
# This should return no results (no private registry URLs)
grep -i "commandalkon.jfrog.io" package-lock.json

# This should return results (public registry URLs)
grep -i "registry.npmjs.org" package-lock.json
```

## Why This Works

1. **The `ai` package** (Vercel AI SDK) can handle OpenAI models directly without needing `@ai-sdk/openai`
2. **Same functionality** - both packages use the same OpenAI API under the hood
3. **Public registry** - the `ai` package comes from the public npm registry
4. **No breaking changes** - the API is nearly identical

## Benefits

- ✅ **Fixes npm login issues** - no more private registry dependencies
- ✅ **Simplifies dependencies** - one less package to maintain
- ✅ **Public registry only** - works on any computer without authentication
- ✅ **Same functionality** - AI text generation still works exactly the same

## Testing

After making these changes:
1. Test the current sprint summary generation
2. Test the demo stories summary generation  
3. Test the upcoming sprint summary generation
4. Verify all AI features still work as expected

The functionality should be identical - you're just using a different (public) package to access the same OpenAI API. 