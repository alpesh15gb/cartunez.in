"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useMemo, useState } from "react"
import { ImageIcon } from "lucide-react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const galleryImages = useMemo(
    () => images.filter((image) => Boolean(image.url)),
    [images]
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = galleryImages[activeIndex]

  if (!galleryImages.length) {
    return (
      <div className="relative flex aspect-square min-h-[320px] w-full items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <ImageIcon size={42} strokeWidth={1.5} />
          <span className="text-body-sm uppercase tracking-widest">No images available</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col-reverse gap-4 lg:flex-row lg:gap-5">
      <div className="flex gap-3 overflow-x-auto pb-1 lg:w-20 lg:flex-col lg:overflow-visible lg:pb-0">
        {galleryImages.map((image, index) => (
          <button
            key={image.id || image.url}
            type="button"
            aria-label={`View product image ${index + 1}`}
            onClick={() => setActiveIndex(index)}
            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-gray-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 lg:h-20 lg:w-20 ${
              activeIndex === index
                ? "border-brand shadow-sm"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <Image
              src={image.url!}
              alt={`Product thumbnail ${index + 1}`}
              fill
              sizes="80px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      <div className="group relative aspect-square min-h-[320px] flex-1 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
        <Image
          src={activeImage.url!}
          priority
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          alt={`Product image ${activeIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 58vw, 780px"
        />
        <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-700 shadow-sm backdrop-blur">
          {activeIndex + 1} / {galleryImages.length}
        </div>
      </div>
    </div>
  )
}

export default ImageGallery
