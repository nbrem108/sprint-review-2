"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ArrowUpDown } from "lucide-react"

interface Issue {
  id: string
  key: string
  summary: string
  status: string
  assignee?: string
  storyPoints?: number
  issueType: string
  isSubtask: boolean
}

interface IssuesTableProps {
  issues: Issue[]
}

export function IssuesTable({ issues }: IssuesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof Issue>("key")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const filteredAndSortedIssues = issues
    .filter(
      (issue) =>
        issue.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (issue.assignee && issue.assignee.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    .sort((a, b) => {
      const aValue = a[sortField] || ""
      const bValue = b[sortField] || ""

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const handleSort = (field: keyof Issue) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "done":
        return "bg-green-100 text-green-800"
      case "in progress":
        return "bg-blue-100 text-blue-800"
      case "to do":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getIssueTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "story":
        return "bg-green-100 text-green-800"
      case "bug":
        return "bg-red-100 text-red-800"
      case "task":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("key")} className="h-auto p-0 font-semibold">
                  Key
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("summary")} className="h-auto p-0 font-semibold">
                  Summary
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("issueType")} className="h-auto p-0 font-semibold">
                  Type
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("status")} className="h-auto p-0 font-semibold">
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("assignee")} className="h-auto p-0 font-semibold">
                  Assignee
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort("storyPoints")} className="h-auto p-0 font-semibold">
                  Points
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedIssues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell className="font-medium">{issue.key}</TableCell>
                <TableCell className="max-w-md">
                  <div className="truncate" title={issue.summary}>
                    {issue.summary}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getIssueTypeColor(issue.issueType)}>{issue.issueType}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(issue.status)}>{issue.status}</Badge>
                </TableCell>
                <TableCell>{issue.assignee || "Unassigned"}</TableCell>
                <TableCell className="text-right">{issue.storyPoints || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredAndSortedIssues.length === 0 && searchTerm && (
        <div className="text-center py-4 text-muted-foreground">No issues found matching "{searchTerm}"</div>
      )}
    </div>
  )
}
