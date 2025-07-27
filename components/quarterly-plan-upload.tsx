"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, X, ImageIcon, FileImage, Loader2, AlertCircle, CheckCircle, Eye } from "lucide-react"
import { useSprintContext } from "@/components/sprint-context"
import { useToast } from "@/hooks/use-toast"

interface QuarterlyPlanSlide {
  id: string
  name: string
  type: string
  size: number
  data: string // Base64 encoded file data
  uploadedAt: string
}

export function QuarterlyPlanUpload() {
  const { state, dispatch } = useSprintContext()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return "Please upload only JPG, PNG, or WebP images"
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 10MB"
    }
    return null
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      const file = files[0] // Only take the first file for quarterly plan
      const validationError = validateFile(file)

      if (validationError) {
        toast({
          title: "Upload Error",
          description: validationError,
          variant: "destructive",
        })
        return
      }

      // Convert file to base64 for storage
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const quarterlyPlanSlide: QuarterlyPlanSlide = {
        id: `quarterly-plan-${Date.now()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        data: fileData.split(',')[1] || '', // Remove the data URL prefix, keep only base64
        uploadedAt: new Date().toISOString(),
      }

      dispatch({ type: "SET_QUARTERLY_PLAN_SLIDE", payload: quarterlyPlanSlide })

      toast({
        title: "Quarterly Plan Uploaded",
        description: `${file.name} has been uploaded successfully`,
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload the quarterly plan image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const removeQuarterlyPlan = () => {
    dispatch({ type: "SET_QUARTERLY_PLAN_SLIDE", payload: null })
    toast({
      title: "Quarterly Plan Removed",
      description: "The quarterly plan slide has been removed",
    })
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Quarterly Plan (Q3 Epics)
        </CardTitle>
        <CardDescription>
          Upload a snapshot of all Q3 epics. This slide will be positioned between the Title slide and Current Sprint Summary.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.quarterlyPlanSlide ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <FileImage className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">{state.quarterlyPlanSlide.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(state.quarterlyPlanSlide.size)} • Uploaded {new Date(state.quarterlyPlanSlide.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Q3 Epics
                </Badge>
                                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => window.open(`data:${state.quarterlyPlanSlide!.type};base64,${state.quarterlyPlanSlide!.data}`, '_blank')}
                 >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={removeQuarterlyPlan}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
                         <div className="flex justify-center">
               <img
                 src={`data:${state.quarterlyPlanSlide!.type};base64,${state.quarterlyPlanSlide!.data}`}
                 alt="Quarterly Plan Preview"
                 className="max-w-full max-h-64 object-contain rounded-lg border"
               />
             </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload Quarterly Plan (Q3 Epics)
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Drag and drop your Q3 epics snapshot here, or click to browse
                </p>
                <p className="text-xs text-gray-400">
                  Supports JPG, PNG, WebP • Max 10MB
                </p>
              </div>
              
              <Button
                onClick={openFileDialog}
                disabled={isUploading}
                className="w-full sm:w-auto"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 