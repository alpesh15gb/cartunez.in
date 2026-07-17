import { clx } from "@modules/common/components/ui"
import Image from "next/image"
import React from "react"

type ThumbnailProps = {
  thumbnail?: string | null
  images?: { url?: string }[] | null
  productTitle?: string | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  "data-testid"?: string
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  productTitle,
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
      <ImageOrPlaceholder image={initialImage} productTitle={productTitle} />
    </div>
  )
}

const ImageOrPlaceholder = ({
  image,
  productTitle,
}: {
  image?: string | null
  productTitle?: string | null
}) => {
  if (!image) {
    return <AutomotiveFallback productTitle={productTitle} />
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

export const getProductVisualLabel = (title?: string | null) => {
  const value = (title || "").toLowerCase()

  if (value.includes("dash")) return "Dash Camera"
  if (value.includes("infotainment") || value.includes("android")) return "Infotainment"
  if (value.includes("led") || value.includes("headlight")) return "LED Lighting"
  if (value.includes("seat")) return "Seat Covers"
  if (value.includes("mat")) return "Floor Mats"
  if (value.includes("wheel") || value.includes("alloy")) return "Alloy Wheels"

  return "Car Accessory"
}

export const AutomotiveFallback = ({
  productTitle,
  compact = false,
}: {
  productTitle?: string | null
  compact?: boolean
}) => {
  const label = getProductVisualLabel(productTitle)

  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_28%_18%,rgba(220,38,38,0.18),transparent_28%),linear-gradient(145deg,#111827_0%,#1f2937_48%,#f3f4f6_100%)]">
      <div className="absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <div className="absolute -right-10 top-10 h-32 w-32 rounded-full border border-white/10" />
      <div className="absolute -left-12 bottom-8 h-40 w-40 rounded-full border border-white/10" />

      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="relative flex w-full max-w-[78%] flex-col items-center">
          <div className="relative w-full rounded-[28px] border border-white/15 bg-white/[0.08] p-5 shadow-2xl shadow-black/25 backdrop-blur-sm">
            <div className="relative mx-auto aspect-[1.55] w-full max-w-[260px]">
              <div className="absolute left-[8%] right-[8%] top-[36%] h-[30%] rounded-t-[48px] rounded-b-[18px] bg-gradient-to-b from-white/80 to-white/45 shadow-[0_18px_45px_rgba(0,0,0,0.22)]" />
              <div className="absolute left-[23%] right-[23%] top-[18%] h-[36%] rounded-t-[42px] bg-gradient-to-b from-sky-100/90 to-sky-300/35" />
              <div className="absolute left-[10%] right-[10%] top-[53%] h-[24%] rounded-[18px] bg-gradient-to-b from-red-600 to-red-800" />
              <div className="absolute left-[14%] top-[63%] h-[18%] w-[16%] rounded-full bg-neutral-950 ring-4 ring-neutral-700" />
              <div className="absolute right-[14%] top-[63%] h-[18%] w-[16%] rounded-full bg-neutral-950 ring-4 ring-neutral-700" />
              <div className="absolute left-[38%] right-[38%] top-[59%] h-[8%] rounded-full bg-white/75" />
            </div>
          </div>

          <div className="mt-5 text-center">
            <span className="rounded-full bg-white/90 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.22em] text-gray-900 shadow-sm">
              Cartunez
            </span>
            {!compact && (
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-white">
                {label}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Thumbnail
