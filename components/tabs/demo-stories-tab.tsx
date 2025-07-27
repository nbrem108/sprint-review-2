"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, CheckCircle2 } from "lucide-react"
import { useSprintContext } from "@/components/sprint-context"

export function DemoStoriesTab() {
  const { state, dispatch } = useSprintContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIssueTypes, setSelectedIssueTypes] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  // Get unique issue types and statuses for filter options
  const uniqueIssueTypes = Array.from(new Set(state.issues.map((issue) => issue.issueType))).sort()
  const uniqueStatuses = Array.from(new Set(state.issues.map((issue) => issue.status))).sort()

  const filteredIssues = state.issues.filter((issue) => {
    const matchesSearch =
      issue.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.summary.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesIssueType = selectedIssueTypes.length === 0 || selectedIssueTypes.includes(issue.issueType)
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(issue.status)

    return matchesSearch && matchesIssueType && matchesStatus
  })

  const toggleIssueTypeFilter = (issueType: string) => {
    setSelectedIssueTypes((prev) =>
      prev.includes(issueType) ? prev.filter((type) => type !== issueType) : [...prev, issueType],
    )
  }

  const toggleStatusFilter = (status: string) => {
    setSelectedStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
  }

  const clearAllFilters = () => {
    setSearchTerm("")
    setSelectedIssueTypes([])
    setSelectedStatuses([])
  }

  const handleStoryToggle = (issueId: string) => {
    dispatch({ type: "TOGGLE_DEMO_STORY", payload: issueId })
  }

  const selectAll = () => {
    filteredIssues.forEach((issue) => {
      if (!state.demoStories.includes(issue.id)) {
        dispatch({ type: "TOGGLE_DEMO_STORY", payload: issue.id })
      }
    })
  }

  const clearAll = () => {
    state.demoStories.forEach((storyId) => {
      dispatch({ type: "TOGGLE_DEMO_STORY", payload: storyId })
    })
  }

  if (!state.selectedSprint || state.issues.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Demo Stories</h2>
          <p className="text-muted-foreground">Select stories to highlight in your presentation</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">Please select a sprint and load issues first</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Demo Stories</h2>
        <p className="text-muted-foreground">
          Select stories to highlight in your presentation ({state.demoStories.length} selected)
        </p>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Story Selection</CardTitle>
          <CardDescription>
            Choose which stories from {state.selectedSprint.name} to showcase in your demo
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Enhanced Filter Controls */}
          <div className="space-y-4">
            {/* Search and Action Buttons Row */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search stories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={clearAll}>
                  Clear All
                </Button>
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="space-y-3">
              {/* Issue Type Filters */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Issue Types</label>
                <div className="flex flex-wrap gap-2">
                  {uniqueIssueTypes.map((issueType) => (
                    <Button
                      key={issueType}
                      variant={selectedIssueTypes.includes(issueType) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleIssueTypeFilter(issueType)}
                      className="h-7 text-xs"
                    >
                      {issueType}
                      {selectedIssueTypes.includes(issueType) && (
                        <span className="ml-1 bg-white/20 rounded-full px-1">
                          {state.issues.filter((i) => i.issueType === issueType).length}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Status Filters */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <div className="flex flex-wrap gap-2">
                  {uniqueStatuses.map((status) => (
                    <Button
                      key={status}
                      variant={selectedStatuses.includes(status) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleStatusFilter(status)}
                      className="h-7 text-xs"
                    >
                      {status}
                      {selectedStatuses.includes(status) && (
                        <span className="ml-1 bg-white/20 rounded-full px-1">
                          {state.issues.filter((i) => i.status === status).length}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            {(selectedIssueTypes.length > 0 || selectedStatuses.length > 0 || searchTerm) && (
              <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                Showing {filteredIssues.length} of {state.issues.length} stories
                {searchTerm && <span> • Search: "{searchTerm}"</span>}
                {selectedIssueTypes.length > 0 && <span> • Types: {selectedIssueTypes.join(", ")}</span>}
                {selectedStatuses.length > 0 && <span> • Status: {selectedStatuses.join(", ")}</span>}
              </div>
            )}
          </div>

          {/* Scrollable Stories Container */}
          <div className="border rounded-lg flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2 p-4">
                {filteredIssues.map((issue) => {
                  const isSelected = state.demoStories.includes(issue.id)
                  return (
                    <div
                      key={issue.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                        isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                      }`}
                    >
                      <Checkbox
                        id={issue.id}
                        checked={isSelected}
                        onCheckedChange={() => handleStoryToggle(issue.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <label htmlFor={issue.id} className="font-medium cursor-pointer">
                            {issue.key}
                          </label>
                          <Badge variant="outline">{issue.issueType}</Badge>
                          <Badge
                            className={
                              issue.status === "Done" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                            }
                          >
                            {issue.status}
                          </Badge>
                          {issue.storyPoints && <Badge variant="secondary">{issue.storyPoints} pts</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{issue.summary}</p>
                        {issue.assignee && (
                          <p className="text-xs text-muted-foreground">Assigned to: {issue.assignee}</p>
                        )}
                      </div>
                      {isSelected && <CheckCircle2 className="h-5 w-5 text-blue-600 mt-1" />}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {filteredIssues.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || selectedIssueTypes.length > 0 || selectedStatuses.length > 0
                ? "No stories match your current filters"
                : "No stories found"}
            </div>
          )}
        </CardContent>
      </Card>

      {state.demoStories.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Selected Demo Stories</CardTitle>
            <CardDescription>{state.demoStories.length} stories selected for presentation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {state.demoStories.map((storyId) => {
                const story = state.issues.find((issue) => issue.id === storyId)
                if (!story) return null

                return (
                  <div key={story.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div>
                      <span className="font-medium">{story.key}</span>
                      <span className="text-sm text-muted-foreground ml-2">{story.summary}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleStoryToggle(story.id)}>
                      Remove
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
