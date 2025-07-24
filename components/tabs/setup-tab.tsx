"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSprintContext } from "@/components/sprint-context"
import { useToast } from "@/hooks/use-toast"
import { ProjectSelector } from "@/components/project-selector"
import { BoardSelector } from "@/components/board-selector"
import { SprintSelector } from "@/components/sprint-selector"
import { IssuesTable } from "@/components/issues-table"
import { ReleaseNotesSection } from "@/components/release-notes/release-notes-section"
import { 
  Settings, 
  Database, 
  Calendar, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Bug
} from "lucide-react"
import { SessionManager } from "@/components/session-manager"
import { PerformanceMonitor } from "@/components/performance-monitor"

export function SetupTab() {
  const { state, dispatch } = useSprintContext()
  const { toast } = useToast()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastReadVersion, setLastReadVersion] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastReadVersion') || undefined
    }
    return undefined
  })

  const handleMarkAsRead = (version: string) => {
    setLastReadVersion(version)
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastReadVersion', version)
    }
    toast({
      title: "Release Notes",
      description: `Marked version ${version} as read.`,
    })
  }

  const analyzeJiraFields = async () => {
    if (!state.selectedSprint) {
      toast({
        title: "No Sprint Selected",
        description: "Please select a sprint first to analyze fields.",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/jira-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          operation: 'analyze-fields',
          params: { sprintId: parseInt(state.selectedSprint.id) }
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('🔍 JIRA Field Analysis:', data)
      
      toast({
        title: "Field Analysis Complete",
        description: "Check the browser console for detailed field information.",
      })
    } catch (error) {
      console.error('Field analysis error:', error)
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const testReleaseNotesField = async () => {
    if (!state.selectedSprint) {
      toast({
        title: "No Sprint Selected",
        description: "Please select a sprint first to test release notes fields.",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/test-release-notes-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sprintId: parseInt(state.selectedSprint.id)
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('🔍 Release Notes Field Analysis:', data)
      
      if (data.recommendation) {
        toast({
          title: "Release Notes Field Found!",
          description: `Recommended field: ${data.recommendation.fieldName} (${data.recommendation.reason})`,
        })
      } else {
        toast({
          title: "No Release Notes Fields Found",
          description: "Check the browser console for all available custom fields.",
        })
      }
    } catch (error) {
      console.error('Release notes field test error:', error)
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const testEpicExtraction = async () => {
    if (!state.issues || state.issues.length === 0) {
      toast({
        title: "No Issues Loaded",
        description: "Please load sprint issues first.",
        variant: "destructive",
      })
      return
    }

    console.log('🔍 Testing Epic Extraction:');
    console.log('Total issues:', state.issues.length);
    
    const issuesWithEpic = state.issues.filter(issue => issue.epicKey || issue.epicName);
    console.log('Issues with epic info:', issuesWithEpic.length);
    
    issuesWithEpic.forEach(issue => {
      console.log(`  ${issue.key}:`, {
        epicKey: issue.epicKey,
        epicName: issue.epicName,
        epicColor: issue.epicColor
      });
    });

    const issuesWithoutEpic = state.issues.filter(issue => !issue.epicKey && !issue.epicName);
    console.log('Issues without epic info:', issuesWithoutEpic.length);
    
    if (issuesWithoutEpic.length > 0) {
      console.log('Sample issues without epic:');
      issuesWithoutEpic.slice(0, 3).forEach(issue => {
        console.log(`  ${issue.key}: ${issue.summary}`);
      });
    }

    toast({
      title: "Epic Extraction Test Complete",
      description: `Found ${issuesWithEpic.length} issues with epic info out of ${state.issues.length} total. Check console for details.`,
    })
  }


  return (
    <div className="space-y-6 max-w-none">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Setup</h2>
          <p className="text-muted-foreground">Configure your JIRA connection and select sprint data</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={testReleaseNotesField} 
            disabled={isAnalyzing || !state.selectedSprint}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Test Release Notes Field
          </Button>
          <Button 
            onClick={testEpicExtraction} 
            disabled={!state.issues || state.issues.length === 0}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Test Epic Extraction
          </Button>
          <Button 
            onClick={analyzeJiraFields} 
            disabled={isAnalyzing || !state.selectedSprint}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bug className="h-4 w-4" />}
            Debug Fields
          </Button>
        </div>
      </div>

      <SessionManager />

      {/* Release Notes */}
      <ReleaseNotesSection 
        lastReadVersion={lastReadVersion}
        onMarkAsRead={handleMarkAsRead}
      />

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
