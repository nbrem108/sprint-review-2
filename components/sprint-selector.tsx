"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useSprintContext } from "@/components/sprint-context"
import { fetchJiraSprints, fetchJiraSprintIssues } from "@/lib/jira-api"
import { createSprintComparisonFromJira, generateSprintTrendsFromJira } from "@/lib/sprint-comparison-utils"
import { cn } from "@/lib/utils"

export function SprintSelector() {
  const { state, dispatch } = useSprintContext()
  const [open, setOpen] = useState(false)
  const [upcomingOpen, setUpcomingOpen] = useState(false)
  const [sprints, setSprints] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const boardId = state.selectedBoard?.id ?? state.selectedProject?.boardId
    if (state.selectedProject && boardId) {
      loadSprints()
    } else {
      setSprints([])
      setError(null)
    }
  }, [state.selectedProject, state.selectedBoard])

  const loadSprints = async () => {
    const boardId = state.selectedBoard?.id ?? state.selectedProject?.boardId
    if (!boardId) return

    dispatch({ type: "SET_LOADING", payload: { key: "sprints", value: true } })
    setError(null)

    try {
      const fetchedSprints = await fetchJiraSprints(Number.parseInt(boardId))
      setSprints(fetchedSprints)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load sprints"
      setError(errorMessage)
      console.error("Failed to load sprints:", error)
    } finally {
      dispatch({ type: "SET_LOADING", payload: { key: "sprints", value: false } })
    }
  }

  const handleSprintSelect = async (sprint: any) => {
    dispatch({ type: "SET_SPRINT", payload: sprint })
    setOpen(false)

    // Load issues for selected sprint
    dispatch({ type: "SET_LOADING", payload: { key: "issues", value: true } })
    try {
      const issues = await fetchJiraSprintIssues(Number.parseInt(sprint.id))
      dispatch({ type: "SET_ISSUES", payload: issues })
    } catch (error) {
      console.error("Failed to load sprint issues:", error)
      // Don't show error to user, just log it
    } finally {
      dispatch({ type: "SET_LOADING", payload: { key: "issues", value: false } })
    }

    // Load historical sprint data and create comparison using Jira API data
    dispatch({ type: "SET_LOADING", payload: { key: "historicalData", value: true } })
    try {
      const boardId = state.selectedBoard?.id ?? state.selectedProject?.boardId
      if (boardId) {
        // Get all sprints for this board (we already have them)
        const allSprints = sprints
        
        // Load issues for all closed sprints to create comparison
        const allSprintIssues: Record<string, any[]> = {}
        
        // Load issues for the current sprint
        const currentIssues = await fetchJiraSprintIssues(Number.parseInt(sprint.id))
        allSprintIssues[sprint.id] = currentIssues
        
        // Load issues for closed sprints (previous sprints)
        const closedSprints = allSprints.filter(s => s.state === "closed")
        for (const closedSprint of closedSprints.slice(0, 5)) { // Limit to 5 to avoid too many API calls
          try {
            const issues = await fetchJiraSprintIssues(Number.parseInt(closedSprint.id))
            allSprintIssues[closedSprint.id] = issues
          } catch (error) {
            console.warn(`Failed to load issues for sprint ${closedSprint.id}:`, error)
            allSprintIssues[closedSprint.id] = []
          }
        }
        
        // Convert sprint to SafeJiraSprint format
        const safeSprint = {
          id: sprint.id,
          name: sprint.name,
          state: sprint.state,
          startDate: sprint.startDate || null,
          endDate: sprint.endDate || null,
          boardId: sprint.boardId,
          goal: sprint.goal
        }
        
        // Create sprint comparison using Jira data
        const comparison = createSprintComparisonFromJira(safeSprint, currentIssues, allSprints, allSprintIssues)
        if (comparison) {
          dispatch({ type: "SET_SPRINT_COMPARISON", payload: comparison })
        }
        
        // Generate sprint trends
        const trends = generateSprintTrendsFromJira(allSprints, allSprintIssues)
        dispatch({ type: "SET_SPRINT_TRENDS", payload: trends })
      }
    } catch (error) {
      console.error("Failed to create sprint comparison:", error)
      // Don't show error to user, just log it
    } finally {
      dispatch({ type: "SET_LOADING", payload: { key: "historicalData", value: false } })
    }
  }

  const handleUpcomingSprintSelect = async (sprint: any | null) => {
    dispatch({ type: "SET_UPCOMING_SPRINT", payload: sprint })
    setUpcomingOpen(false)

    if (sprint) {
      try {
        const upcomingIssues = await fetchJiraSprintIssues(Number.parseInt(sprint.id))
        dispatch({ type: "SET_UPCOMING_ISSUES", payload: upcomingIssues })
      } catch (error) {
        console.error("Failed to load upcoming sprint issues:", error)
      }
    } else {
      dispatch({ type: "SET_UPCOMING_ISSUES", payload: [] })
    }
  }

  const getSprintStatusBadge = (state: string) => {
    switch (state) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "closed":
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>
      case "future":
        return <Badge className="bg-blue-100 text-blue-800">Future</Badge>
      default:
        return <Badge variant="outline">{state}</Badge>
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No date"
    return new Date(dateString).toLocaleDateString()
  }

  if (!state.selectedProject) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">Current Sprint</label>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please select a project first to load sprints.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const boardId = state.selectedBoard?.id ?? state.selectedProject?.boardId

  if (!boardId) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">Current Sprint</label>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No Scrum board found for this project. Please ensure the project has a Scrum board configured.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">Current Sprint</label>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" onClick={loadSprints}>
          Retry
        </Button>
      </div>
    )
  }

  const futureSprints = sprints.filter((s) => s.state === "future")
  const upcomingSprints = sprints.filter((s) => s.state === "future" || s.state === "active")

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Current Sprint</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between bg-transparent"
              disabled={state.loading.sprints}
            >
              {state.loading.sprints ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading sprints...
                </>
              ) : state.selectedSprint ? (
                <div className="flex items-center gap-2">
                  <span>{state.selectedSprint.name}</span>
                  {getSprintStatusBadge(state.selectedSprint.state)}
                </div>
              ) : (
                "Select sprint..."
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search sprints..." />
              <CommandList>
                <CommandEmpty>No sprints found.</CommandEmpty>
                <CommandGroup>
                  {sprints.map((sprint) => (
                    <CommandItem key={sprint.id} value={sprint.name} onSelect={() => handleSprintSelect(sprint)}>
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          state.selectedSprint?.id === sprint.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{sprint.name}</span>
                          {getSprintStatusBadge(sprint.state)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                        </div>
                        {sprint.goal && <div className="text-xs text-muted-foreground mt-1">Goal: {sprint.goal}</div>}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Upcoming/Active Sprint (Optional)</label>
        <Popover open={upcomingOpen} onOpenChange={setUpcomingOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={upcomingOpen}
              className="w-full justify-between bg-transparent"
              disabled={state.loading.sprints}
            >
              {state.upcomingSprint ? (
                <div className="flex items-center gap-2">
                  <span>{state.upcomingSprint.name}</span>
                  {getSprintStatusBadge(state.upcomingSprint.state)}
                </div>
              ) : (
                "Select upcoming/active sprint..."
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search sprints..." />
              <CommandList>
                <CommandEmpty>No upcoming sprints found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem value="none" onSelect={() => handleUpcomingSprintSelect(null)}>
                    <Check className={cn("mr-2 h-4 w-4", !state.upcomingSprint ? "opacity-100" : "opacity-0")} />
                    None
                  </CommandItem>
                  {upcomingSprints.map((sprint) => (
                    <CommandItem
                      key={sprint.id}
                      value={sprint.name}
                      onSelect={() => handleUpcomingSprintSelect(sprint)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          state.upcomingSprint?.id === sprint.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{sprint.name}</span>
                          {getSprintStatusBadge(sprint.state)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {sprints.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Found {sprints.length} sprint{sprints.length !== 1 ? "s" : ""} • Active:{" "}
          {sprints.filter((s) => s.state === "active").length} • Future:{" "}
          {sprints.filter((s) => s.state === "future").length} • Upcoming:{" "}
          {upcomingSprints.length} • Closed:{" "}
          {sprints.filter((s) => s.state === "closed").length}
        </p>
      )}
    </div>
  )
}
