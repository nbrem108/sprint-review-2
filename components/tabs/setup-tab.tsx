"use client"

import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSprintContext } from "@/components/sprint-context"
import { IssuesTable } from "@/components/issues-table"
import { SessionManager } from "@/components/session-manager"
import { PerformanceMonitor } from "@/components/performance-monitor"
import { BoardSelector } from "@/components/board-selector"

export function SetupTab() {
  const { state } = useSprintContext()



  return (
    <div className="space-y-6 max-w-none">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Setup & Configuration</h2>
        <p className="text-muted-foreground">Configure your project and sprint to begin creating your presentation</p>
      </div>

      <SessionManager />



      {/* Sprint Issues */}
      {state.selectedSprint && (
        <Card>
          <CardHeader>
            <CardTitle>Sprint Issues</CardTitle>
            <CardDescription>
              Issues from {state.selectedSprint.name}
              {state.issues.length > 0 && ` (${state.issues.length} items)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state.loading.issues ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading issues from Jira...
              </div>
            ) : state.issues.length > 0 ? (
              <IssuesTable issues={state.issues} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">No issues found for this sprint</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
          <CardDescription>Current application state</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono bg-gray-50 p-4 rounded">
            <div>Selected Project: {state.selectedProject?.key || "None"}</div>
            <div>Selected Sprint: {state.selectedSprint?.name || "None"}</div>
            <div>Issues Loaded: {state.issues.length}</div>
            <div>Demo Stories: {state.demoStories.length}</div>
            <div>Session ID: {state.sessionId}</div>
            <div>Last Saved: {state.lastSaved || "Never"}</div>
            <div>Environment: v0.dev (credentials configured)</div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Monitor */}
      <PerformanceMonitor />
    </div>
  )
}
