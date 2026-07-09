"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useMemo, useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ImageIcon, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const galleryImages = useMemo(
    () => images.filter((image) => Boolean(image.url)),
    [images]
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const mainRef = useRef<HTMLDivElement>(null)
  const activeImage = galleryImages[activeIndex]

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!mainRef.current || !isZoomed) return
    const rect = mainRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }, [isZoomed])

  if (!galleryImages.length) {
    return (
      <div className="relative flex aspect-square min-h-[400px] w-full items-center justify-center overflow-hidden rounded-3xl border border-gray-200 bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <ImageIcon size={48} strokeWidth={1.5} />
          <span className="text-xs font-bold uppercase tracking-widest">No images available</span>
        </div>
      </div>
    )
  }

  const goToPrev = () => {
    setActiveIndex((prev) =>
      prev === 0 ? galleryImages.length - 1 : prev - 1
    )
  }

  const goToNext = () => {
    setActiveIndex((prev) =>
      prev === galleryImages.length - 1 ? 0 : prev + 1
    )
  }

  const handleThumbnailClick = (index: number) => {
    setActiveIndex(index)
    setIsZoomed(false)
  }

  return (
    <div className="flex w-full flex-col-reverse gap-5 lg:flex-row lg:gap-6" data-testid="image-gallery">
      {/* ── Thumbnail Strip ── */}
      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar lg:w-[100px] lg:flex-col lg:overflow-visible lg:pb-0">
        {galleryImages.map((image, index) => (
          <button
            key={image.id || image.url}
            type="button"
            aria-label={`View product image ${index + 1}`}
            onClick={() => handleThumbnailClick(index)}
            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-gray-50 transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 lg:h-[92px] lg:w-[92px] ${
              activeIndex === index
                ? "border-brand shadow-lg shadow-brand/10 ring-2 ring-brand/20 scale-105"
                : "border-gray-200 opacity-60 hover:opacity-100 hover:border-gray-300 hover:scale-105"
            }`}
          >
            <Image
              src={image.url!}
              alt={`Product thumbnail ${index + 1}`}
              fill
              sizes="92px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* ── Main Image Display ── */}
      <div
        ref={mainRef}
        className="group relative aspect-square min-h-[400px] flex-1 overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 shadow-lg"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative h-full w-full"
          >
            <Image
              src={activeImage.url!}
              priority
              className={`object-cover transition-transform duration-300 ${
                isZoomed ? "scale-[2.2] cursor-zoom-out" : "cursor-zoom-in"
              }`}
              style={
                isZoomed
                  ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
                  : undefined
              }
              alt={`Product image ${activeIndex + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 58vw, 780px"
            />
          </motion.div>
        </AnimatePresence>

        {/* Hover overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/5 via-transparent to-black/5" />

        {/* Image counter badge */}
        <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/60 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-lg backdrop-blur-sm">
          {activeIndex + 1} / {galleryImages.length}
        </div>

        {/* Zoom hint */}
        <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white/80 shadow-sm backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ZoomIn size={12} />
          <span>Hover to zoom</span>
        </div>

        {/* Navigation arrows */}
        {galleryImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrev}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-gray-800 opacity-0 shadow-xl backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-brand hover:scale-110 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={goToNext}
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-gray-800 opacity-0 shadow-xl backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-brand hover:scale-110 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
          </>
        )}

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

        {/* Dot indicators */}
        {galleryImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {galleryImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleThumbnailClick(idx)}
                aria-label={`Go to image ${idx + 1}`}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === activeIndex
                    ? "bg-white w-6 shadow-lg"
                    : "bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageGallery