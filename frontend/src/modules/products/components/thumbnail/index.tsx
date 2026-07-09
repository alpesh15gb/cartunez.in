import { clx } from "@modules/common/components/ui"
import Image from "next/image"
import React from "react"

import PlaceholderImage from "@modules/common/icons/placeholder-image"

type ThumbnailProps = {
  thumbnail?: string | null
  images?: { url?: string }[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  "data-testid"?: string
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "small",
  isFeatured,
  className,
  "data-testid": dataTestid,
}) => {
  const initialImage = thumbnail || images?.[0]?.url || null

  return (
    <div
      className={clx(
        "relative w-full overflow-hidden bg-gray-50 rounded-[var(--radius-lg)] group-hover:shadow-[var(--shadow-card-hover)] transition-all ease-out duration-500",
        className,
        {
          "aspect-[11/14]": isFeatured,
          "aspect-[9/16]": !isFeatured && size !== "square",
          "aspect-[1/1]": size === "square",
          "w-[180px]": size === "small",
          "w-[290px]": size === "medium",
          "w-[440px]": size === "large",
          "w-full": size === "full",
        }
      )}
      data-testid={dataTestid}
    >
      <ImageOrPlaceholder image={initialImage} />
    </div>
  )
}

const ImageOrPlaceholder = ({
  image,
}: {
  image?: string | null
}) => {
  if (!image) {
    return (
      <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-gray-100">
        <PlaceholderImage size={24} />
      </div>
    )
  }

  return (
    <div className="img-zoom-container w-full h-full absolute inset-0">
      <Image
        src={image}
        alt="Product image"
        className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        draggable={false}
        quality={85}
        sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
        fill
        loading="lazy"
      />
      {/* Subtle overlay gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  )
}

export default Thumbnail