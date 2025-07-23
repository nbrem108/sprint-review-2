"use client"

import { useState, useEffect, useRef } from "react"
import { Check, ChevronsUpDown, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSprintContext } from "@/components/sprint-context"
import { useJiraProjects } from "@/hooks/use-jira-api"
import { cn } from "@/lib/utils"

interface Project {
  id: string
  key: string
  name: string
  boardId?: string
  boardName?: string
  boards?: { id: string; name: string; type: string }[]
}

export function ProjectSelector() {
  const { state, dispatch } = useSprintContext()
  const [open, setOpen] = useState(false)
  const { data: projects, loading, error, execute: loadProjects, clearError } = useJiraProjects()
  const projectsMapRef = useRef<Map<string, Project>>(new Map())
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadProjects()
    }
  }, [loadProjects])

  // Update projects map when projects data changes
  useEffect(() => {
    if (projects) {
      projectsMapRef.current.clear()
      projects.forEach((project: Project) => {
        projectsMapRef.current.set(`${project.key} ${project.name}`, project)
      })
    }
  }, [projects])

  const handleProjectSelect = (value: string) => {
    const project = projectsMapRef.current.get(value)
    if (!project) return

    console.log("ProjectSelector: Selected project:", project)

    // 🔒 Create a completely new object for the context to avoid any reference issues
    const safeProject = {
      id: project.id,
      key: project.key,
      name: project.name,
      boards: project.boards,
      boardId: project.boardId,
      boardName: project.boardName,
    }

    dispatch({ type: "SET_PROJECT", payload: safeProject })

    // Automatically select default board if available
    if (project.boards && project.boards.length === 1) {
      const boardObj = project.boards[0]
      dispatch({ type: "SET_BOARD", payload: boardObj })
    }

    setOpen(false)
  }

  const handleRetry = () => {
    clearError()
    loadProjects()
  }

  if (error) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Project</label>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" onClick={handleRetry}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Project</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-transparent"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading projects...
              </>
            ) : state.selectedProject ? (
              `${state.selectedProject.key} - ${state.selectedProject.name}`
            ) : (
              "Select project..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Search projects..." />
            <CommandList>
              <CommandEmpty>No project found.</CommandEmpty>
              <CommandGroup>
                {projects?.map((project: Project) => (
                  <CommandItem
                    key={project.id}
                    value={`${project.key} ${project.name}`}
                    onSelect={handleProjectSelect}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        state.selectedProject?.id === project.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {project.key} - {project.name}
                      </span>
                      {project.boardName && (
                        <span className="text-xs text-muted-foreground">
                          Board: {project.boardName}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
