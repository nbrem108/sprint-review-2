"use client"

import { useState, useCallback, useRef, useMemo } from "react"

interface UseJiraApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseJiraApiReturn<T> extends UseJiraApiState<T> {
  execute: (...args: any[]) => Promise<T | null>
  clearError: () => void
  clearData: () => void
}

// 🚀 Optimized Jira API hook with caching and error handling
export function useJiraApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  cacheKey?: string
): UseJiraApiReturn<T> {
  const [state, setState] = useState<UseJiraApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map())
  const apiFunctionRef = useRef(apiFunction)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Update the ref when apiFunction changes
  apiFunctionRef.current = apiFunction

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      // Cancel previous request if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController()

      // Check cache if cacheKey is provided
      if (cacheKey) {
        const cached = cacheRef.current.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          console.log(`🚀 Cache hit for ${cacheKey}`)
          setState({ data: cached.data, loading: false, error: null })
          return cached.data
        }
      }

      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const result = await apiFunctionRef.current(...args)

        // Cache the result if cacheKey is provided
        if (cacheKey) {
          cacheRef.current.set(cacheKey, { data: result, timestamp: Date.now() })
        }

        setState({ data: result, loading: false, error: null })
        return result
      } catch (error) {
        // Don't set error if request was aborted
        if (error instanceof Error && error.name === 'AbortError') {
          return null
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        setState(prev => ({ ...prev, loading: false, error: errorMessage }))
        return null
      }
    },
    [cacheKey] // Only depend on cacheKey, not apiFunction
  )

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const clearData = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return {
    ...state,
    execute,
    clearError,
    clearData,
  }
}

// 🚀 Batch API hook for multiple operations
export function useJiraBatchApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeBatch = useCallback(async (operation: string, params?: any) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/jira-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ operation, params }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    executeBatch,
    loading,
    error,
    clearError,
  }
}

// 🚀 Optimized project loading hook
export function useJiraProjects() {
  const apiFunction = useMemo(() => async () => {
    const response = await fetch('/api/jira-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'fetch-projects-with-boards' }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return data.projects
  }, [])

  return useJiraApi(apiFunction, 'projects-with-boards')
}

// 🚀 Optimized sprint loading hook
export function useJiraSprintWithIssues() {
  const apiFunction = useMemo(() => async (boardId: number, sprintId: number) => {
    const response = await fetch('/api/jira-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: 'fetch-sprint-with-issues',
        params: { boardId, sprintId }
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return data
  }, [])

  return useJiraApi(apiFunction, 'sprint-with-issues')
} 