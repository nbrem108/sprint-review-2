"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Sparkles, Loader2, RefreshCw, Copy, AlertCircle, FileText, Target, Calendar, Zap } from "lucide-react"
import { useSprintContext } from "@/components/sprint-context"
import { useToast } from "@/hooks/use-toast"

interface GenerationStatus {
  currentSprint: "idle" | "generating" | "complete" | "error"
  upcomingSprint: "idle" | "generating" | "complete" | "error"
  demoStories: "idle" | "generating" | "complete" | "error"
}

export function SummariesTab() {
  const { state, dispatch } = useSprintContext()
  const { toast } = useToast()
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    currentSprint: "idle",
    upcomingSprint: "idle",
    demoStories: "idle",
  })
  const [editingSummary, setEditingSummary] = useState<string | null>(null)
  const [tempSummary, setTempSummary] = useState("")

  // Check if we have enough data to generate summaries
  const canGenerate = state.selectedSprint && state.issues.length > 0
  const hasMetrics = state.metrics !== null
  const hasDemoStories = state.demoStories.length > 0

  const generateCurrentSprintSummary = async () => {
    if (!state.selectedSprint || !state.issues.length) return

    setGenerationStatus((prev) => ({ ...prev, currentSprint: "generating" }))

    try {
      const response = await fetch("/api/generate-summaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "current-sprint",
          sprintName: state.selectedSprint.name,
          sprintStartDate: state.selectedSprint.startDate,
          sprintEndDate: state.selectedSprint.endDate,
          issues: state.issues,
          metrics: state.metrics,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate summary")
      }

      const data = await response.json()

      dispatch({
        type: "SET_SUMMARIES",
        payload: { currentSprint: data.summary },
      })

      setGenerationStatus((prev) => ({ ...prev, currentSprint: "complete" }))
      toast({
        title: "AI Summary Generated",
        description: "Current sprint summary has been generated using GPT-4o.",
      })
    } catch (error) {
      console.error("Generation error:", error)
      setGenerationStatus((prev) => ({ ...prev, currentSprint: "error" }))
      toast({
        title: "Generation Failed",
        description: "Failed to generate current sprint summary. Please check your OpenAI API key and try again.",
        variant: "destructive",
      })
    }
  }

  const generateUpcomingSprintSummary = async () => {
    if (!state.upcomingSprint) return

    setGenerationStatus((prev) => ({ ...prev, upcomingSprint: "generating" }))

    try {
      const response = await fetch("/api/generate-summaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "upcoming-sprint",
          sprintName: state.selectedSprint?.name,
          upcomingSprintName: state.upcomingSprint.name,
          issues: state.issues,
          upcomingIssues: state.upcomingIssues,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate summary")
      }

      const data = await response.json()

      dispatch({
        type: "SET_SUMMARIES",
        payload: { upcomingSprint: data.summary },
      })

      setGenerationStatus((prev) => ({ ...prev, upcomingSprint: "complete" }))
      toast({
        title: "AI Summary Generated",
        description: "Upcoming sprint summary has been generated using GPT-4o.",
      })
    } catch (error) {
      console.error("Generation error:", error)
      setGenerationStatus((prev) => ({ ...prev, upcomingSprint: "error" }))
      toast({
        title: "Generation Failed",
        description: "Failed to generate upcoming sprint summary. Please try again.",
        variant: "destructive",
      })
    }
  }

  const generateDemoStoriesSummaries = async () => {
    if (!hasDemoStories) return

    setGenerationStatus((prev) => ({ ...prev, demoStories: "generating" }))

    try {
      const response = await fetch("/api/generate-summaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "demo-stories",
          sprintName: state.selectedSprint?.name,
          issues: state.issues,
          demoStoryIds: state.demoStories,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate summaries")
      }

      const data = await response.json()

      dispatch({
        type: "SET_SUMMARIES",
        payload: { demoStories: data.summaries },
      })

      setGenerationStatus((prev) => ({ ...prev, demoStories: "complete" }))
      toast({
        title: "AI Summaries Generated",
        description: `Generated summaries for ${state.demoStories.length} demo stories using GPT-4o.`,
      })
    } catch (error) {
      console.error("Generation error:", error)
      setGenerationStatus((prev) => ({ ...prev, demoStories: "error" }))
      toast({
        title: "Generation Failed",
        description: "Failed to generate demo story summaries. Please try again.",
        variant: "destructive",
      })
    }
  }

  const generateAllSummaries = async () => {
    const promises = []

    if (canGenerate) {
      promises.push(generateCurrentSprintSummary())
    }
    if (state.upcomingSprint && state.upcomingIssues.length > 0) {
      promises.push(generateUpcomingSprintSummary())
    }
    if (hasDemoStories) {
      promises.push(generateDemoStoriesSummaries())
    }

    await Promise.all(promises)
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to Clipboard",
        description: `${type} summary copied successfully.`,
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      })
    }
  }

  const startEditing = (summaryType: string, currentText: string) => {
    setEditingSummary(summaryType)
    setTempSummary(currentText)
  }

  const saveEdit = (summaryType: string) => {
    dispatch({
      type: "SET_SUMMARIES",
      payload: { [summaryType]: tempSummary },
    })
    setEditingSummary(null)
    setTempSummary("")
    toast({
      title: "Summary Updated",
      description: "Your changes have been saved.",
    })
  }

  const cancelEdit = () => {
    setEditingSummary(null)
    setTempSummary("")
  }

  if (!canGenerate) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Summaries</h2>
          <p className="text-muted-foreground">Generate AI-powered content summaries using GPT-4o</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-medium">Prerequisites Required</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Please complete the following steps before generating summaries:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  {!state.selectedSprint && <li>• Select a sprint</li>}
                  {state.issues.length === 0 && <li>• Load sprint issues</li>}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-none">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            AI Summaries
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              GPT-4o
            </Badge>
          </h2>
          <p className="text-muted-foreground">
            Generate professional content summaries for {state.selectedSprint.name}
          </p>
        </div>
        <Button
          onClick={generateAllSummaries}
          disabled={Object.values(generationStatus).some((status) => status === "generating")}
          className="gap-2"
        >
          {Object.values(generationStatus).some((status) => status === "generating") ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate All Summaries
        </Button>
      </div>

      {/* AI Features Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Zap className="h-5 w-5" />
            Powered by GPT-4o
          </CardTitle>
          <CardDescription className="text-blue-700">
            Advanced AI generates contextual, professional summaries using your sprint data, metrics, and demo
            selections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <div className="font-medium text-blue-900">Smart Analysis</div>
              <div className="text-blue-700">Analyzes completion rates, quality metrics, and team performance</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-blue-900">Business Focus</div>
              <div className="text-blue-700">Emphasizes stakeholder value and business impact</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-blue-900">Presentation Ready</div>
              <div className="text-blue-700">Professional formatting suitable for executive presentations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Generation Status</CardTitle>
          <CardDescription>Track the progress of AI summary generation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <div className="font-medium">Current Sprint</div>
                <div className="text-sm text-muted-foreground">
                  {generationStatus.currentSprint === "complete"
                    ? "Generated with GPT-4o"
                    : generationStatus.currentSprint === "generating"
                      ? "Generating with AI..."
                      : generationStatus.currentSprint === "error"
                        ? "Failed"
                        : "Ready"}
                </div>
              </div>
              <Badge
                variant={
                  generationStatus.currentSprint === "complete"
                    ? "default"
                    : generationStatus.currentSprint === "generating"
                      ? "secondary"
                      : generationStatus.currentSprint === "error"
                        ? "destructive"
                        : "outline"
                }
              >
                {generationStatus.currentSprint === "generating"
                  ? "Generating"
                  : generationStatus.currentSprint === "complete"
                    ? "Complete"
                    : generationStatus.currentSprint === "error"
                      ? "Error"
                      : "Pending"}
              </Badge>
            </div>

            {state.upcomingSprint && (
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <div className="font-medium">Upcoming Sprint</div>
                  <div className="text-sm text-muted-foreground">
                    {generationStatus.upcomingSprint === "complete"
                      ? "Generated with GPT-4o"
                      : generationStatus.upcomingSprint === "generating"
                        ? "Generating with AI..."
                        : generationStatus.upcomingSprint === "error"
                          ? "Failed"
                          : "Ready"}
                  </div>
                </div>
                <Badge
                  variant={
                    generationStatus.upcomingSprint === "complete"
                      ? "default"
                      : generationStatus.upcomingSprint === "generating"
                        ? "secondary"
                        : generationStatus.upcomingSprint === "error"
                          ? "destructive"
                          : "outline"
                  }
                >
                  {generationStatus.upcomingSprint === "generating"
                    ? "Generating"
                    : generationStatus.upcomingSprint === "complete"
                      ? "Complete"
                      : generationStatus.upcomingSprint === "error"
                        ? "Error"
                        : "Pending"}
                </Badge>
              </div>
            )}

            {hasDemoStories && (
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-purple-500" />
                <div className="flex-1">
                  <div className="font-medium">Demo Stories</div>
                  <div className="text-sm text-muted-foreground">
                    {generationStatus.demoStories === "complete"
                      ? `${state.demoStories.length} generated with GPT-4o`
                      : generationStatus.demoStories === "generating"
                        ? "Generating with AI..."
                        : generationStatus.demoStories === "error"
                          ? "Failed"
                          : `${state.demoStories.length} ready`}
                  </div>
                </div>
                <Badge
                  variant={
                    generationStatus.demoStories === "complete"
                      ? "default"
                      : generationStatus.demoStories === "generating"
                        ? "secondary"
                        : generationStatus.demoStories === "error"
                          ? "destructive"
                          : "outline"
                  }
                >
                  {generationStatus.demoStories === "generating"
                    ? "Generating"
                    : generationStatus.demoStories === "complete"
                      ? "Complete"
                      : generationStatus.demoStories === "error"
                        ? "Error"
                        : "Pending"}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Sprint Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Current Sprint Summary
              {generationStatus.currentSprint === "complete" && (
                <Badge variant="secondary" className="gap-1">
                  <Zap className="h-3 w-3" />
                  AI Generated
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {state.summaries.currentSprint && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(state.summaries.currentSprint!, "Current sprint")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditing("currentSprint", state.summaries.currentSprint!)}
                  >
                    Edit
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={generateCurrentSprintSummary}
                disabled={generationStatus.currentSprint === "generating"}
              >
                {generationStatus.currentSprint === "generating" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            AI-generated summary of {state.selectedSprint.name} performance and deliverables
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editingSummary === "currentSprint" ? (
            <div className="space-y-4">
              <Textarea
                value={tempSummary}
                onChange={(e) => setTempSummary(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={() => saveEdit("currentSprint")}>Save Changes</Button>
                <Button variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : state.summaries.currentSprint ? (
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg border">
                {state.summaries.currentSprint}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {generationStatus.currentSprint === "generating" ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating current sprint summary with GPT-4o...
                </div>
              ) : (
                "Click the refresh button to generate an AI-powered summary"
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Sprint Summary */}
      {state.upcomingSprint && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Upcoming Sprint Summary
                {generationStatus.upcomingSprint === "complete" && (
                  <Badge variant="secondary" className="gap-1">
                    <Zap className="h-3 w-3" />
                    AI Generated
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                {state.summaries.upcomingSprint && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(state.summaries.upcomingSprint!, "Upcoming sprint")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing("upcomingSprint", state.summaries.upcomingSprint!)}
                    >
                      Edit
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateUpcomingSprintSummary}
                  disabled={generationStatus.upcomingSprint === "generating"}
                >
                  {generationStatus.upcomingSprint === "generating" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardTitle>
            <CardDescription>AI-generated planning summary for {state.upcomingSprint.name}</CardDescription>
          </CardHeader>
          <CardContent>
            {editingSummary === "upcomingSprint" ? (
              <div className="space-y-4">
                <Textarea
                  value={tempSummary}
                  onChange={(e) => setTempSummary(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button onClick={() => saveEdit("upcomingSprint")}>Save Changes</Button>
                  <Button variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : state.summaries.upcomingSprint ? (
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg border">
                  {state.summaries.upcomingSprint}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {generationStatus.upcomingSprint === "generating" ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating upcoming sprint summary with GPT-4o...
                  </div>
                ) : (
                  "Click the refresh button to generate an AI-powered summary"
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Demo Stories Summaries */}
      {hasDemoStories && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Demo Stories Summaries
                <Badge variant="secondary">{state.demoStories.length}</Badge>
                {generationStatus.demoStories === "complete" && (
                  <Badge variant="secondary" className="gap-1">
                    <Zap className="h-3 w-3" />
                    AI Generated
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={generateDemoStoriesSummaries}
                disabled={generationStatus.demoStories === "generating"}
              >
                {generationStatus.demoStories === "generating" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </CardTitle>
            <CardDescription>AI-generated summaries for each selected demo story</CardDescription>
          </CardHeader>
          <CardContent>
            {generationStatus.demoStories === "generating" ? (
              <div className="text-center py-8">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating demo story summaries with GPT-4o...
                </div>
              </div>
            ) : state.summaries.demoStories ? (
              <div className="space-y-6">
                {state.demoStories.map((storyId, index) => {
                  const story = state.issues.find((issue) => issue.id === storyId)
                  const summary = state.summaries.demoStories?.[storyId]

                  if (!story || !summary) return null

                  return (
                    <div key={storyId}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">
                          {story.key}: {story.summary}
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(summary, `${story.key} summary`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg border">{summary}</div>
                      </div>
                      {index < state.demoStories.length - 1 && <Separator className="mt-6" />}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Click the refresh button to generate AI-powered demo story summaries
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generation Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Generation Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">For Better AI Results:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Complete sprint metrics for detailed analysis</li>
                <li>• Select meaningful demo stories</li>
                <li>• Ensure issue summaries are descriptive</li>
                <li>• Configure upcoming sprint for planning insights</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">AI Features:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• GPT-4o analyzes your actual sprint data</li>
                <li>• Professional, stakeholder-ready content</li>
                <li>• Business-focused insights and metrics</li>
                <li>• Edit and customize AI-generated content</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
