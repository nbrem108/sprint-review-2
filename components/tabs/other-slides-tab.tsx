"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, X, ImageIcon, FileImage, Loader2, AlertCircle, CheckCircle, Eye, Edit3 } from "lucide-react"
import { useSprintContext } from "@/components/sprint-context"
import { useToast } from "@/hooks/use-toast"

interface UploadedSlide {
  id: string
  file: File
  title: string
  description: string
  preview: string
  uploadedAt: string
  order: number
}

export function OtherSlidesTab() {
  const { state, dispatch } = useSprintContext()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedSlides, setUploadedSlides] = useState<UploadedSlide[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [editingSlide, setEditingSlide] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")

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

  const createPreviewUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      const newSlides: UploadedSlide[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const validationError = validateFile(file)

        if (validationError) {
          toast({
            title: "Upload Error",
            description: `${file.name}: ${validationError}`,
            variant: "destructive",
          })
          continue
        }

        const preview = await createPreviewUrl(file)
        const slideId = `slide-${Date.now()}-${i}`

        const newSlide: UploadedSlide = {
          id: slideId,
          file,
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
          description: "",
          preview,
          uploadedAt: new Date().toISOString(),
          order: uploadedSlides.length + newSlides.length,
        }

        newSlides.push(newSlide)

        // Add to context state
        dispatch({ type: "ADD_SLIDE", payload: file })
      }

      setUploadedSlides((prev) => [...prev, ...newSlides])

      toast({
        title: "Upload Successful",
        description: `${newSlides.length} slide${newSlides.length > 1 ? "s" : ""} uploaded successfully.`,
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload slides. Please try again.",
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

  const removeSlide = (slideId: string) => {
    const slideIndex = uploadedSlides.findIndex((slide) => slide.id === slideId)
    if (slideIndex !== -1) {
      setUploadedSlides((prev) => prev.filter((slide) => slide.id !== slideId))
      dispatch({ type: "REMOVE_SLIDE", payload: slideIndex })

      toast({
        title: "Slide Removed",
        description: "Slide has been removed from your presentation.",
      })
    }
  }

  const startEditing = (slide: UploadedSlide) => {
    setEditingSlide(slide.id)
    setEditTitle(slide.title)
    setEditDescription(slide.description)
  }

  const saveEdit = () => {
    if (!editingSlide) return

    setUploadedSlides((prev) =>
      prev.map((slide) =>
        slide.id === editingSlide
          ? {
              ...slide,
              title: editTitle,
              description: editDescription,
            }
          : slide,
      ),
    )

    setEditingSlide(null)
    setEditTitle("")
    setEditDescription("")

    toast({
      title: "Slide Updated",
      description: "Slide information has been updated.",
    })
  }

  const cancelEdit = () => {
    setEditingSlide(null)
    setEditTitle("")
    setEditDescription("")
  }

  const moveSlide = (slideId: string, direction: "up" | "down") => {
    const currentIndex = uploadedSlides.findIndex((slide) => slide.id === slideId)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= uploadedSlides.length) return

    const newSlides = [...uploadedSlides]
    const [movedSlide] = newSlides.splice(currentIndex, 1)
    newSlides.splice(newIndex, 0, movedSlide)

    // Update order
    const updatedSlides = newSlides.map((slide, index) => ({
      ...slide,
      order: index,
    }))

    setUploadedSlides(updatedSlides)
  }

  return (
    <div className="space-y-6 max-w-none">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Additional Slides</h2>
        <p className="text-muted-foreground">
          Upload custom images to include as additional slides in your presentation
        </p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Slides
          </CardTitle>
          <CardDescription>
            Upload JPG, PNG, or WebP images (max 10MB each). These will be added to your presentation as additional
            slides.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                )}
              </div>

              <div>
                <h3 className="font-medium">
                  {isUploading ? "Uploading slides..." : "Drop images here or click to upload"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Supports JPG, PNG, WebP up to 10MB each</p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Choose Files
                </Button>
                <div className="text-sm text-muted-foreground">or drag and drop</div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_FILE_TYPES.join(",")}
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </div>
          </div>

          {/* Upload Guidelines */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-900 mb-1">Upload Guidelines</div>
                <ul className="text-blue-700 space-y-1">
                  <li>• Images will be automatically resized to fit presentation slides</li>
                  <li>• Use high-resolution images for best quality</li>
                  <li>• Consider slide order - you can reorder after upload</li>
                  <li>• Add descriptive titles for better presentation flow</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Slides Management */}
      {uploadedSlides.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileImage className="h-5 w-5" />
                Uploaded Slides
                <Badge variant="secondary">{uploadedSlides.length}</Badge>
              </div>
            </CardTitle>
            <CardDescription>Manage your uploaded slides, edit titles, and reorder as needed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {uploadedSlides
                .sort((a, b) => a.order - b.order)
                .map((slide, index) => (
                  <Card key={slide.id} className="overflow-hidden">
                    <div className="aspect-video bg-gray-100 relative">
                      <img
                        src={slide.preview || "/placeholder.svg"}
                        alt={slide.title}
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=200&width=300&text=Image+Error"
                        }}
                      />
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs">
                          Slide {index + 1}
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            // Preview functionality
                            window.open(slide.preview, "_blank")
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => removeSlide(slide.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      {editingSlide === slide.id ? (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`title-${slide.id}`} className="text-sm">
                              Title
                            </Label>
                            <Input
                              id={`title-${slide.id}`}
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              placeholder="Slide title"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`desc-${slide.id}`} className="text-sm">
                              Description
                            </Label>
                            <Input
                              id={`desc-${slide.id}`}
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              placeholder="Optional description"
                              className="mt-1"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveEdit}>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button variant="outline" size="sm" onClick={cancelEdit}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{slide.title}</h4>
                              {slide.description && (
                                <p className="text-sm text-muted-foreground truncate">{slide.description}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 ml-2"
                              onClick={() => startEditing(slide)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{(slide.file.size / 1024 / 1024).toFixed(1)} MB</span>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => moveSlide(slide.id, "up")}
                                disabled={index === 0}
                              >
                                ↑
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => moveSlide(slide.id, "down")}
                                disabled={index === uploadedSlides.length - 1}
                              >
                                ↓
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage in Presentation */}
      {uploadedSlides.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Ready for Presentation
            </CardTitle>
            <CardDescription>
              Your uploaded slides will be automatically included in the generated presentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Slide Integration:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Slides will appear in the order shown above</li>
                  <li>• Each slide gets its own presentation page</li>
                  <li>• Titles and descriptions are included</li>
                  <li>• Images are optimized for presentation display</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Best Practices:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Use landscape orientation for better fit</li>
                  <li>• Keep text in images large and readable</li>
                  <li>• Consider slide flow in your presentation</li>
                  <li>• Test in presentation mode before exporting</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {uploadedSlides.length === 0 && !isUploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <FileImage className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-medium">No Additional Slides</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Upload images to add custom slides to your presentation. These could include:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Architecture diagrams</li>
                  <li>• Screenshots of new features</li>
                  <li>• Team photos or achievements</li>
                  <li>• Charts and graphs</li>
                  <li>• Process flows or wireframes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
