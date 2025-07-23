"use client"

import { useEffect, useState } from "react"
import { Loader2, CheckCircle, AlertCircle, TestTube } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSprintContext } from "@/components/sprint-context"
import { IssuesTable } from "@/components/issues-table"
import { SessionManager } from "@/components/session-manager"
import { PerformanceMonitor } from "@/components/performance-monitor"
import { BoardSelector } from "@/components/board-selector"
import { testMinimalConnection, testMinimalProjects } from "@/lib/jira-test"

export function SetupTab() {
  const { state } = useSprintContext()
  const [jiraStatus, setJiraStatus] = useState<{
    status: "checking" | "connected" | "error"
    message?: string
    user?: {
      displayName: string
      emailAddress: string
      accountId: string
      timeZone: string
    }
  }>({ status: "checking" })

  const [testResults, setTestResults] = useState<any>(null)

  useEffect(() => {
    checkJiraConnection()
  }, [])

  const checkJiraConnection = async () => {
    console.log("SetupTab: Starting minimal connection test...")
    setJiraStatus({ status: "checking" })

    try {
      console.log("SetupTab: Calling testMinimalConnection...")
      const result = await testMinimalConnection()
      console.log("SetupTab: Got result:", result)

      if (result.success && result.user) {
        console.log("SetupTab: Setting connected status...")
        setJiraStatus({
          status: "connected",
          message: `Connected as ${result.user.displayName}`,
          user: result.user,
        })
      } else {
        console.log("SetupTab: Setting error status...")
        setJiraStatus({
          status: "error",
          message: result.error || "Connection failed",
        })
      }
    } catch (error) {
      console.error("SetupTab: Caught error:", error)
      setJiraStatus({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      })
    }
  }

  const runProjectsTest = async () => {
    console.log("SetupTab: Running projects test...")
    setTestResults({ status: "loading" })

    try {
      const result = await testMinimalProjects()
      console.log("SetupTab: Projects test result:", result)
      setTestResults(result)
    } catch (error) {
      console.error("SetupTab: Projects test error:", error)
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const getSetupStatus = () => {
    if (jiraStatus.status === "error") return { status: "error", message: "Jira connection failed" }
    if (jiraStatus.status === "checking") return { status: "loading", message: "Checking Jira connection..." }
    if (!state.selectedProject) return { status: "incomplete", message: "Select a project to get started" }
    if (!state.selectedSprint) return { status: "incomplete", message: "Select a sprint to continue" }
    if (state.loading.issues) return { status: "loading", message: "Loading sprint issues..." }
    if (state.issues.length === 0) return { status: "warning", message: "No issues found for this sprint" }
    return { status: "complete", message: `${state.issues.length} issues loaded successfully` }
  }

  const setupStatus = getSetupStatus()

  return (
    <div className="space-y-6 max-w-none">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Setup & Configuration</h2>
        <p className="text-muted-foreground">Configure your project and sprint to begin creating your presentation</p>
      </div>

      <SessionManager />

      {/* Minimal Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Jira Connection Test
            {jiraStatus.status === "checking" && <Loader2 className="h-4 w-4 animate-spin" />}
            {jiraStatus.status === "connected" && <CheckCircle className="h-4 w-4 text-green-500" />}
            {jiraStatus.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
          </CardTitle>
          <CardDescription>Testing Jira API connectivity with your configured credentials</CardDescription>
        </CardHeader>
        <CardContent>
          {jiraStatus.status === "error" && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{jiraStatus.message}</AlertDescription>
            </Alert>
          )}

          {jiraStatus.status === "connected" && jiraStatus.user && (
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-green-900 mb-2">✅ Connection Successful</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-green-700 font-medium">User:</span>{" "}
                  <span className="text-green-800">{jiraStatus.user.displayName}</span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Email:</span>{" "}
                  <span className="text-green-800">{jiraStatus.user.emailAddress}</span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Account ID:</span>{" "}
                  <span className="text-green-800 font-mono text-xs">{jiraStatus.user.accountId}</span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Time Zone:</span>{" "}
                  <span className="text-green-800">{jiraStatus.user.timeZone}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={checkJiraConnection}>
              Test Connection
            </Button>
            <Button variant="outline" onClick={runProjectsTest}>
              Test Projects
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects Test Results */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Projects Test Results
              {testResults.status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
              {testResults.success && <CheckCircle className="h-4 w-4 text-green-500" />}
              {testResults.success === false && <AlertCircle className="h-4 w-4 text-red-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.status === "loading" ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Testing projects fetch...
              </div>
            ) : testResults.success ? (
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">✅ Projects Loaded Successfully</h4>
                <div className="text-sm text-green-800">Found {testResults.count} projects</div>
                {testResults.projects && testResults.projects.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {testResults.projects.slice(0, 3).map((project: any) => (
                      <div key={project.id} className="text-xs text-green-700">
                        {project.key} - {project.name}
                      </div>
                    ))}
                    {testResults.projects.length > 3 && (
                      <div className="text-xs text-green-600">... and {testResults.projects.length - 3} more</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{testResults.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Setup Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Setup Status
            {setupStatus.status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
            {setupStatus.status === "complete" && <CheckCircle className="h-4 w-4 text-green-500" />}
            {setupStatus.status === "warning" && <AlertCircle className="h-4 w-4 text-yellow-500" />}
            {setupStatus.status === "incomplete" && <AlertCircle className="h-4 w-4 text-red-500" />}
            {setupStatus.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
          </CardTitle>
          <CardDescription>{setupStatus.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Project</div>
              {state.selectedProject ? (
                <Badge variant="secondary">
                  {state.selectedProject.key} - {state.selectedProject.name}
                </Badge>
              ) : (
                <Badge variant="outline">Not selected</Badge>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Board</div>
              <BoardSelector />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Current Sprint</div>
              {state.selectedSprint ? (
                <Badge variant="secondary">{state.selectedSprint.name}</Badge>
              ) : (
                <Badge variant="outline">Not selected</Badge>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Upcoming Sprint</div>
              {state.upcomingSprint ? (
                <Badge variant="secondary">{state.upcomingSprint.name}</Badge>
              ) : (
                <Badge variant="outline">None selected</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
            <div>Connection Status: {jiraStatus.status}</div>
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
