"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Upload, X, Eye, Building2, Loader2, CheckCircle, ArrowUp, ArrowDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CorporateSlide {
  id: string
  filename: string
  blobUrl: string
  localUrl: string
  title: string
  position: "intro" | "section-break" | "outro" | "custom"
  order: number
  isActive: boolean
  uploadedAt: string
}

interface CorporateSlidesManagerProps {
  slides: CorporateSlide[]
  onSlidesUpdate: (slides: CorporateSlide[]) => void
}

export function CorporateSlidesManager({ slides, onSlidesUpdate }: CorporateSlidesManagerProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const uploadToBlob = async (file: File): Promise<{ blobUrl: string; localUrl: string }> => {
    // Simulate Vercel Blob upload
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/upload-corporate-slide", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Upload failed")
    }

    const { blobUrl, localUrl } = await response.json()
    return { blobUrl, localUrl }
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      const newSlides: CorporateSlide[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid File",
            description: `${file.name} is not an image file`,
            variant: "destructive",
          })
          continue
        }

        if (file.size > 10 * 1024 * 1024) {
          // 10MB limit
          toast({
            title: "File Too Large",
            description: `${file.name} exceeds 10MB limit`,
            variant: "destructive",
          })
          continue
        }

        // Upload to Vercel Blob
        const { blobUrl, localUrl } = await uploadToBlob(file)

        const newSlide: CorporateSlide = {
          id: `corporate-${Date.now()}-${i}`,
          filename: file.name,
          blobUrl,
          localUrl,
          title: file.name.replace(/\.[^/.]+$/, ""),
          position: "intro", // Default position
          order: slides.length + newSlides.length,
          isActive: true,
          uploadedAt: new Date().toISOString(),
        }

        newSlides.push(newSlide)
      }

      onSlidesUpdate([...slides, ...newSlides])

      toast({
        title: "Upload Successful",
        description: `${newSlides.length} corporate slide${newSlides.length > 1 ? "s" : ""} uploaded`,
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload corporate slides",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const updateSlide = (slideId: string, updates: Partial<CorporateSlide>) => {
    const updatedSlides = slides.map((slide) => (slide.id === slideId ? { ...slide, ...updates } : slide))
    onSlidesUpdate(updatedSlides)
  }

  const removeSlide = (slideId: string) => {
    const updatedSlides = slides.filter((slide) => slide.id !== slideId)
    onSlidesUpdate(updatedSlides)

    toast({
      title: "Slide Removed",
      description: "Corporate slide has been removed",
    })
  }

  const moveSlide = (slideId: string, direction: "up" | "down") => {
    const currentIndex = slides.findIndex((slide) => slide.id === slideId)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= slides.length) return

    const newSlides = [...slides]
    const [movedSlide] = newSlides.splice(currentIndex, 1)
    newSlides.splice(newIndex, 0, movedSlide)

    // Update order
    const reorderedSlides = newSlides.map((slide, index) => ({
      ...slide,
      order: index,
    }))

    onSlidesUpdate(reorderedSlides)
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

  const positionLabels = {
    intro: "Introduction",
    "section-break": "Section Breaks",
    outro: "Conclusion",
    custom: "Custom Position",
  }

  const getPositionBadgeColor = (position: string) => {
    switch (position) {
      case "intro":
        return "bg-blue-100 text-blue-800"
      case "section-break":
        return "bg-purple-100 text-purple-800"
      case "outro":
        return "bg-green-100 text-green-800"
      case "custom":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Corporate Slides
          </CardTitle>
          <CardDescription>Upload company slides to be integrated throughout your presentation</CardDescription>
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
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                ) : (
                  <Building2 className="h-6 w-6 text-blue-500" />
                )}
              </div>

              <div>
                <h3 className="font-medium">
                  {isUploading ? "Uploading corporate slides..." : "Upload Corporate Slides"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">JPG, PNG, or WebP images up to 10MB each</p>
              </div>

              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Choose Files
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Slides Management */}
      {slides.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                Uploaded Corporate Slides
                <Badge variant="secondary">{slides.length}</Badge>
              </div>
            </CardTitle>
            <CardDescription>Configure where each slide appears in your presentation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {slides.map((slide, index) => (
                <div key={slide.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {/* Slide Preview */}
                    <div className="w-24 h-16 bg-gray-100 rounded border overflow-hidden flex-shrink-0">
                      <img
                        src={slide.localUrl || "/placeholder.svg"}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=64&width=96&text=Corporate+Slide"
                        }}
                      />
                    </div>

                    {/* Slide Configuration */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Input
                            value={slide.title}
                            onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                            className="font-medium"
                            placeholder="Slide title"
                          />
                          <div className="text-xs text-muted-foreground">{slide.filename}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={slide.isActive}
                            onCheckedChange={(checked) => updateSlide(slide.id, { isActive: checked })}
                          />
                          <Label className="text-sm">Active</Label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Position in Presentation</Label>
                          <Select
                            value={slide.position}
                            onValueChange={(value: any) => updateSlide(slide.id, { position: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="intro">Introduction</SelectItem>
                              <SelectItem value="section-break">Section Breaks</SelectItem>
                              <SelectItem value="outro">Conclusion</SelectItem>
                              <SelectItem value="custom">Custom Position</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={getPositionBadgeColor(slide.position)}>
                            {positionLabels[slide.position]}
                          </Badge>
                          {slide.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSlide(slide.id, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => window.open(slide.localUrl, "_blank")}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSlide(slide.id, "down")}
                        disabled={index === slides.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSlide(slide.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Preview */}
      {slides.filter((s) => s.isActive).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Presentation Integration</CardTitle>
            <CardDescription>Preview of where corporate slides will appear in your presentation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {slides.filter((s) => s.isActive && s.position === "intro").length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800">Introduction</Badge>
                  <span>{slides.filter((s) => s.isActive && s.position === "intro").length} slides</span>
                </div>
              )}

              <div className="text-muted-foreground">→ Sprint Overview</div>

              {slides.filter((s) => s.isActive && s.position === "section-break").length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-800">Section Break</Badge>
                  <span>{slides.filter((s) => s.isActive && s.position === "section-break").length} slides</span>
                </div>
              )}

              <div className="text-muted-foreground">→ Sprint Metrics</div>
              <div className="text-muted-foreground">→ Demo Stories</div>

              {slides.filter((s) => s.isActive && s.position === "outro").length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Conclusion</Badge>
                  <span>{slides.filter((s) => s.isActive && s.position === "outro").length} slides</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
