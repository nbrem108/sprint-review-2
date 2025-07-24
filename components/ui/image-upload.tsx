"use client"

import React, { useCallback, useState, useEffect, useRef } from "react"
import { useDropzone } from "react-dropzone"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Upload, X, Image as ImageIcon } from "lucide-react"

interface ImageUploadProps {
  onImageUpload: (base64: string) => void
  onImageRemove?: () => void
  currentImage?: string
  disabled?: boolean
  className?: string
  maxSize?: number // in MB
  acceptedTypes?: string[]
}

export function ImageUpload({
  onImageUpload,
  onImageRemove,
  currentImage,
  disabled = false,
  className,
  maxSize = 5, // 5MB default
  acceptedTypes = ["image/jpeg", "image/png", "image/webp"],
}: ImageUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPasteSupported, setIsPasteSupported] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const dropzoneRef = useRef<HTMLDivElement>(null)

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions (max 800px width/height for export quality)
        const maxDimension = 800
        let { width, height } = img

        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width
            width = maxDimension
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.onerror = reject
              reader.readAsDataURL(blob)
            } else {
              reject(new Error("Failed to compress image"))
            }
          },
          "image/jpeg",
          0.8 // 80% quality
        )
      }

      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return
      await handleFileUpload(acceptedFiles[0])
    },
    [maxSize, onImageUpload]
  )

  const { getRootProps, getInputProps, isDragActive: dropzoneDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles: 1,
    disabled,
  })

  // Update drag state
  React.useEffect(() => {
    setIsDragActive(dropzoneDragActive)
  }, [dropzoneDragActive])

  // Check if clipboard paste is supported
  useEffect(() => {
    setIsPasteSupported(!!navigator.clipboard?.read)
  }, [])

  // Handle clipboard paste
  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    if (disabled || !isFocused) return
    
    const items = event.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          event.preventDefault()
          await handleFileUpload(file)
        }
        break
      }
    }
  }, [disabled, isFocused, maxSize, onImageUpload])

  // Handle file upload (shared between drop and paste)
  const handleFileUpload = async (file: File) => {
    setError(null)
    
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`)
      return
    }

    try {
      const compressedBase64 = await compressImage(file)
      onImageUpload(compressedBase64)
    } catch (err) {
      setError("Failed to process image. Please try again.")
    }
  }

  // Add paste event listener
  useEffect(() => {
    if (!isPasteSupported) return

    const handlePasteEvent = (event: ClipboardEvent) => handlePaste(event)
    document.addEventListener('paste', handlePasteEvent)
    
    return () => {
      document.removeEventListener('paste', handlePasteEvent)
    }
  }, [isPasteSupported, handlePaste])

  const handleRemove = () => {
    setError(null)
    onImageRemove?.()
  }

  return (
    <div className={cn("space-y-3", className)}>
      {currentImage ? (
        <div className="relative group">
          <img
            src={currentImage}
            alt="Uploaded screenshot"
            className="w-full h-48 object-cover rounded-lg border-2 border-dashed border-gray-300"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          ref={dropzoneRef}
          data-dropzone
          tabIndex={0}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors outline-none",
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : isFocused
                ? "border-blue-400 bg-blue-50/50"
                : "border-gray-300 hover:border-gray-400",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-2">
            <div className="p-2 rounded-full bg-gray-100">
              {isDragActive ? (
                <Upload className="h-6 w-6 text-blue-500" />
              ) : (
                <ImageIcon className="h-6 w-6 text-gray-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {isDragActive ? "Drop image here" : "Upload screenshot"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Drag & drop, click to select, or paste from clipboard (max {maxSize}MB)
              </p>
            </div>
            {isPasteSupported && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Focus this specific dropzone to enable paste
                  dropzoneRef.current?.focus()
                }}
                className="mt-2"
              >
                <Upload className="h-4 w-4 mr-1" />
                Paste from Clipboard
              </Button>
            )}
          </div>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
} 