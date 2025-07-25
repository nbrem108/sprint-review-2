"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Save, Download, Upload, Trash2, Clock, Database, CheckCircle } from "lucide-react"
import { useSprintContext } from "@/components/sprint-context"
import { useToast } from "@/hooks/use-toast"

export function SessionManager() {
  const { state, clearSession, exportSession, importSession } = useSprintContext()
  const { toast } = useToast()
  const [importData, setImportData] = useState("")
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [sessionId, setSessionId] = useState<string>("Loading...")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setSessionId(state.sessionId)
  }, [state.sessionId])

  const handleExport = () => {
    try {
      const data = exportSession()
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `sprint-review-session-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Session Exported",
        description: "Your session data has been downloaded as a JSON file.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export session data.",
        variant: "destructive",
      })
    }
  }

  const handleImport = () => {
    if (!importData.trim()) {
      toast({
        title: "No Data",
        description: "Please paste session data to import.",
        variant: "destructive",
      })
      return
    }

    const success = importSession(importData)
    if (success) {
      toast({
        title: "Session Imported",
        description: "Your session data has been restored successfully.",
      })
      setShowImportDialog(false)
      setImportData("")
    } else {
      toast({
        title: "Import Failed",
        description: "Invalid session data format.",
        variant: "destructive",
      })
    }
  }

  const handleClearSession = () => {
    clearSession()
    toast({
      title: "Session Cleared",
      description: "All session data has been cleared.",
    })
  }

  const getSessionStats = () => {
    return {
      hasProject: !!state.selectedProject,
      hasSprint: !!state.selectedSprint,
      issuesCount: state.issues.length,
      demoStoriesCount: state.demoStories.length,
      hasMetrics: !!state.metrics,
      hasSummaries: Object.keys(state.summaries).length > 0,
      corporateSlidesCount: state.corporateSlides.length,
      additionalSlidesCount: state.additionalSlides.length,
    }
  }

  const stats = getSessionStats()
  const hasData = stats.hasProject || stats.hasSprint || stats.issuesCount > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Session Management
        </CardTitle>
        <CardDescription>
          Your session data is automatically saved and persists across browser refreshes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Session Status</span>
            <Badge variant={hasData ? "default" : "secondary"}>{hasData ? "Active" : "Empty"}</Badge>
          </div>

          {state.lastSaved && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last saved: {new Date(state.lastSaved).toLocaleString()}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Session ID: <code className="bg-muted px-1 rounded">{sessionId}</code>
          </div>
        </div>

        {/* Session Data Overview */}
        {hasData && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Current Session Data:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                {stats.hasProject ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <div className="h-3 w-3 rounded-full border border-gray-300" />
                )}
                Project: {stats.hasProject ? state.selectedProject?.name : "None"}
              </div>
              <div className="flex items-center gap-1">
                {stats.hasSprint ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <div className="h-3 w-3 rounded-full border border-gray-300" />
                )}
                Sprint: {stats.hasSprint ? state.selectedSprint?.name : "None"}
              </div>
              <div className="flex items-center gap-1">
                {stats.issuesCount > 0 ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <div className="h-3 w-3 rounded-full border border-gray-300" />
                )}
                Issues: {stats.issuesCount}
              </div>
              <div className="flex items-center gap-1">
                {stats.demoStoriesCount > 0 ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <div className="h-3 w-3 rounded-full border border-gray-300" />
                )}
                Demo Stories: {stats.demoStoriesCount}
              </div>
              <div className="flex items-center gap-1">
                {stats.hasMetrics ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <div className="h-3 w-3 rounded-full border border-gray-300" />
                )}
                Metrics: {stats.hasMetrics ? "Configured" : "None"}
              </div>
              <div className="flex items-center gap-1">
                {stats.hasSummaries ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <div className="h-3 w-3 rounded-full border border-gray-300" />
                )}
                AI Summaries: {Object.keys(state.summaries).length}
              </div>
              <div className="flex items-center gap-1">
                {stats.corporateSlidesCount > 0 ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <div className="h-3 w-3 rounded-full border border-gray-300" />
                )}
                Corporate Slides: {stats.corporateSlidesCount}
              </div>
              <div className="flex items-center gap-1">
                {stats.additionalSlidesCount > 0 ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <div className="h-3 w-3 rounded-full border border-gray-300" />
                )}
                Additional Slides: {stats.additionalSlidesCount}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!hasData}
            className="gap-2 bg-transparent"
          >
            <Download className="h-4 w-4" />
            Export Session
          </Button>

          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Upload className="h-4 w-4" />
                Import Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Session Data</DialogTitle>
                <DialogDescription>
                  Paste your exported session JSON data below to restore a previous session.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Paste session JSON data here..."
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  rows={10}
                  className="font-mono text-xs"
                />
                <div className="flex gap-2">
                  <Button onClick={handleImport} disabled={!importData.trim()}>
                    Import
                  </Button>
                  <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearSession}
            disabled={!hasData}
            className="gap-2 text-red-600 hover:text-red-700 bg-transparent"
          >
            <Trash2 className="h-4 w-4" />
            Clear Session
          </Button>
        </div>

        {/* Auto-save Notice */}
        <Alert>
          <Save className="h-4 w-4" />
          <AlertDescription>
            Your work is automatically saved to browser storage and will persist across page refreshes and browser
            sessions for 24 hours.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
