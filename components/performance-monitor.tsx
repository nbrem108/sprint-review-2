"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Zap, Database, Clock } from "lucide-react"

interface PerformanceStats {
  cacheSize: number
  cacheEntries: string[]
  averageResponseTime: number
  totalRequests: number
  cacheHits: number
  cacheMisses: number
}

export function PerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/jira-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'get-cache-stats' }),
      })

      if (response.ok) {
        const data = await response.json()
        setStats({
          cacheSize: data.size,
          cacheEntries: data.entries,
          averageResponseTime: 0, // Would need to track this separately
          totalRequests: data.entries.length,
          cacheHits: 0, // Would need to track this separately
          cacheMisses: 0, // Would need to track this separately
        })
      }
    } catch (error) {
      console.error('Failed to fetch performance stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearCache = async () => {
    try {
      await fetch('/api/jira-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'clear-cache' }),
      })
      await fetchStats()
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (!stats) {
    return null
  }

  const cacheHitRate = stats.totalRequests > 0 
    ? Math.round((stats.cacheHits / stats.totalRequests) * 100) 
    : 0

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Performance Monitor
        </CardTitle>
        <CardDescription>
          Jira API performance metrics and cache statistics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Cache Size:</span>
            <Badge variant="secondary">{stats.cacheSize}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Total Requests:</span>
            <Badge variant="secondary">{stats.totalRequests}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-green-500" />
            <span className="text-sm">Cache Hit Rate:</span>
            <Badge variant="outline" className="text-green-600">
              {cacheHitRate}%
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Avg Response:</span>
            <Badge variant="outline">
              {stats.averageResponseTime}ms
            </Badge>
          </div>
        </div>

        {stats.cacheEntries.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Cached Operations:</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {stats.cacheEntries.slice(0, 5).map((entry, index) => (
                <div key={index} className="text-xs text-muted-foreground font-mono bg-muted p-1 rounded">
                  {entry}
                </div>
              ))}
              {stats.cacheEntries.length > 5 && (
                <div className="text-xs text-muted-foreground">
                  ... and {stats.cacheEntries.length - 5} more
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchStats}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearCache}
          >
            Clear Cache
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 