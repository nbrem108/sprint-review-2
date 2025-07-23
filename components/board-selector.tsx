"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useSprintContext } from "@/components/sprint-context"
import { cn } from "@/lib/utils"

export function BoardSelector() {
  const { state, dispatch } = useSprintContext()
  const [open, setOpen] = useState(false)

  const boards = state.selectedProject?.boards || []

  // Hide selector when there is 0 or 1 board
  if (!state.selectedProject || boards.length <= 1) return null

  const currentBoardId = state.selectedBoard?.id ?? state.selectedProject?.boardId

  const handleSelect = (board: { id: string; name: string; type: string }) => {
    dispatch({ type: "SET_BOARD", payload: board })
    setOpen(false)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Board</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-transparent"
          >
            {currentBoardId ? (
              boards.find((b) => b.id === currentBoardId)?.name || "Select board..."
            ) : (
              "Select board..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search boards..." />
            <CommandList>
              <CommandEmpty>No board found.</CommandEmpty>
              <CommandGroup>
                {boards.map((board) => (
                  <CommandItem
                    key={board.id}
                    value={board.name}
                    onSelect={() => handleSelect(board)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        currentBoardId === board.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span>{board.name}</span>
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