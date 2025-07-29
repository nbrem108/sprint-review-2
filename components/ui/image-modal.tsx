"use client"

import { useState, useEffect } from "react"
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  src: string
  alt: string
}

export function ImageModal({ isOpen, onClose, src, alt }: ImageModalProps) {
  
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setRotation(0)
      setPosition({ x: 0, y: 0 })
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case "Escape":
          onClose()
          break
        case "=":
        case "+":
          e.preventDefault()
          setScale(prev => Math.min(prev + 0.25, 3))
          break
        case "-":
          e.preventDefault()
          setScale(prev => Math.max(prev - 0.25, 0.25))
          break
        case "0":
          e.preventDefault()
          setScale(1)
          setPosition({ x: 0, y: 0 })
          setRotation(0)
          break
        case "r":
          e.preventDefault()
          setRotation(prev => (prev + 90) % 360)
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.25 : 0.25
    setScale(prev => Math.max(0.25, Math.min(3, prev + delta)))
  }

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setScale(prev => Math.min(prev + 0.25, 3))}
          className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
          title="Zoom In (+)"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setScale(prev => Math.max(prev - 0.25, 0.25))}
          className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
          title="Zoom Out (-)"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setScale(1)
            setPosition({ x: 0, y: 0 })
            setRotation(0)
          }}
          className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
          title="Reset (0)"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setRotation(prev => (prev + 90) % 360)}
          className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
          title="Rotate (R)"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-white/10 text-white text-sm backdrop-blur-sm">
        {Math.round(scale * 100)}%
      </div>

      {/* Image container */}
      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-none select-none"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            imageRendering: 'auto', // Better image rendering
            objectFit: 'contain'
          }}
          draggable={false}
          onLoad={(e) => {
            // Log image dimensions for debugging
            const img = e.target as HTMLImageElement;
            console.log('Modal image loaded:', {
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              displayWidth: img.width,
              displayHeight: img.height
            });
          }}
        />
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-white/10 text-white text-sm backdrop-blur-sm text-center">
        <div className="flex gap-4 text-xs">
          <span>Scroll to zoom • Drag to pan • ESC to close</span>
        </div>
      </div>
    </div>
  )
} 