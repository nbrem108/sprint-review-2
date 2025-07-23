"use client"

import { useState, useCallback } from "react"
import { Loader2, Upload, X, AlertCircle, Lock, Image as ImageIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSprintContext } from "@/components/sprint-context"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

export function CorporateSlidesTab() {
  const { state, dispatch } = useSprintContext()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files?.length) return

    setUploading(true)
    setError(null)

    try {
      const newSlides = await Promise.all(
        Array.from(files).map(async (file) => {
          // Check for duplicates
          const isDuplicate = state.corporateSlides.some(
            (slide) => slide.filename.toLowerCase() === file.name.toLowerCase()
          )

          if (isDuplicate) {
            throw new Error(`A slide with the name "${file.name}" already exists.`)
          }

          // Create a local URL for persistence
          const localUrl = `/corporate-slides/${file.name}`

          return {
            id: `slide-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            filename: file.name,
            blobUrl: "",
            localUrl,
            title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
            position: "custom" as const,
            order: state.corporateSlides.length,
            isActive: true,
            uploadedAt: new Date().toISOString(),
          }
        })
      )

      dispatch({
        type: "SET_CORPORATE_SLIDES",
        payload: [...state.corporateSlides, ...newSlides],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload slides. Please try again.")
      console.error("Upload error:", err)
    } finally {
      setUploading(false)
      // Reset the input
      const input = document.getElementById("slide-upload") as HTMLInputElement
      if (input) input.value = ""
    }
  }, [state.corporateSlides, dispatch])

  const handleRemoveSlide = useCallback((slideId: string) => {
    const slide = state.corporateSlides.find(s => s.id === slideId)
    // Don't allow removing default slides
    if (slide?.id.startsWith("default-")) return
    
    dispatch({
      type: "SET_CORPORATE_SLIDES",
      payload: state.corporateSlides.filter(s => s.id !== slideId)
    })
  }, [state.corporateSlides, dispatch])

  const handlePositionChange = useCallback((slideId: string, position: "intro" | "meeting-guidelines" | "section-break" | "outro" | "custom") => {
    dispatch({
      type: "SET_CORPORATE_SLIDES",
      payload: state.corporateSlides.map(slide =>
        slide.id === slideId ? { ...slide, position } : slide
      )
    })
  }, [state.corporateSlides, dispatch])

  const isDefaultSlide = (id: string) => id.startsWith("default-")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Corporate Slides</h2>
        <p className="text-muted-foreground">
          Manage corporate slide templates for consistent branding
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Additional Slides</CardTitle>
          <CardDescription>
            Upload PowerPoint, PDF, or image files to use as additional corporate slide templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => document.getElementById("slide-upload")?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Slides
                  </>
                )}
              </Button>
              <input
                id="slide-upload"
                type="file"
                accept=".pptx,.pdf,.png,.jpg,.jpeg"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Default Slides */}
      <Card>
        <CardHeader>
          <CardTitle>Default Corporate Slides</CardTitle>
          <CardDescription>
            Pre-configured slides for your presentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {state.corporateSlides
              .filter(slide => isDefaultSlide(slide.id))
              .map((slide) => (
                <div
                  key={slide.id}
                  className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/50"
                >
                  {/* Image Preview */}
                  <div className="relative w-full aspect-[16/9] bg-background rounded-lg overflow-hidden border">
                    <Image
                      src={slide.localUrl}
                      alt={slide.title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw"
                    />
                  </div>
                  
                  {/* Slide Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{slide.title}</p>
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {slide.filename}
                        </p>
                      </div>
                      <Badge variant="secondary">{slide.position}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={slide.position}
                        onChange={(e) => handlePositionChange(slide.id, e.target.value as any)}
                        className="text-sm border rounded p-1"
                      >
                        <option value="intro">Intro</option>
                        <option value="meeting-guidelines">Meeting Guidelines</option>
                        <option value="section-break">Section Break</option>
                        <option value="outro">Outro</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Slides */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Slides</CardTitle>
          <CardDescription>
            {state.corporateSlides.filter(s => !isDefaultSlide(s.id)).length} custom slide(s) uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.corporateSlides.filter(s => !isDefaultSlide(s.id)).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No additional slides uploaded yet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {state.corporateSlides
                .filter(slide => !isDefaultSlide(slide.id))
                .map((slide) => (
                  <div
                    key={slide.id}
                    className="flex flex-col gap-4 p-4 border rounded-lg"
                  >
                    {/* Image Preview */}
                    <div className="relative w-full aspect-[16/9] bg-background rounded-lg overflow-hidden border">
                      <Image
                        src={slide.localUrl}
                        alt={slide.title}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw"
                      />
                    </div>

                    {/* Slide Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{slide.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {slide.filename}
                          </p>
                        </div>
                        <Badge variant="secondary">{slide.position}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={slide.position}
                          onChange={(e) => handlePositionChange(slide.id, e.target.value as any)}
                          className="text-sm border rounded p-1"
                        >
                          <option value="intro">Intro</option>
                          <option value="meeting-guidelines">Meeting Guidelines</option>
                          <option value="section-break">Section Break</option>
                          <option value="outro">Outro</option>
                          <option value="custom">Custom</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSlide(slide.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 