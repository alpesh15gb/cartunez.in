import { listCategories } from "@lib/data/categories"
import type * as HttpTypes from "@lib/commerce/medusa-v1/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  AudioLines,
  Camera,
  Car,
  Gauge,
  Headphones,
  Layers,
  Lightbulb,
  Paintbrush,
  PlugZap,
  Shield,
  Sofa,
  Speaker,
  SunMedium,
  Wind,
  Zap,
} from "lucide-react"

/* Real Medusa product-category handles → icon + label mapping.
   Only handles that exist in the store are listed, so every tile 200s. */
const CATEGORY_META: Record<string, { icon: typeof Car; label: string }> = {
  "android-stereos": { icon: AudioLines, label: "Android Stereos" },
  "ambient-lighting": { icon: Lightbulb, label: "Ambient Lighting" },
  "floor-mats": { icon: Layers, label: "Floor Mats" },
  "led-lights": { icon: SunMedium, label: "LED Lights" },
  "seat-covers": { icon: Sofa, label: "Seat Covers" },
  "steering-covers": { icon: Gauge, label: "Steering Covers" },
  "car-speakers": { icon: Speaker, label: "Car Speakers" },
  "car-amplifiers": { icon: Headphones, label: "Amplifiers" },
  "car-subwoofers": { icon: Zap, label: "Subwoofers" },
  "dash-cameras": { icon: Camera, label: "Dash Cameras" },
  "reverse-cameras": { icon: Car, label: "Reverse Cameras" },
  headlights: { icon: SunMedium, label: "Headlights" },
  "tail-lights": { icon: PlugZap, label: "Tail Lights" },
  "sound-damping": { icon: Wind, label: "Sound Damping" },
  "car-perfumes": { icon: Paintbrush, label: "Car Perfumes" },
  "tyre-inflators": { icon: Zap, label: "Tyre Inflators" },
  "car-protection": { icon: Shield, label: "Car Protection" },
}

export default async function TrendingCategories() {
  let categories: HttpTypes.StoreProductCategory[] = []

  try {
    const all = await listCategories({ limit: 100 })
    categories = all.filter(
      (c) => c.handle && CATEGORY_META[c.handle] && (c.products?.length ?? 0) > 0
    )
  } catch (error) {
    console.error("[TrendingCategories] Failed to load categories:", error)
    return null
  }

  if (categories.length === 0) {
    return null
  }

  const tiles = categories.slice(0, 8)

  return (
    <section className="relative border-t border-gray-100 bg-gray-50 py-16 sm:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(201,28,28,0.03),transparent_60%)] pointer-events-none" />
      <div className="content-container relative z-10">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <span className="eyebrow">Popular Right Now</span>
            <h2
              className="font-display font-black uppercase text-gray-900 leading-none"
              style={{ fontSize: "clamp(30px, 4vw, 48px)", letterSpacing: "-0.02em" }}
            >
              Shop Trending
              <br />
              <span className="text-brand">Categories</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm font-medium leading-relaxed text-gray-500">
            The most-shopped accessory lines this month — each one verified against your car.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {tiles.map((category) => {
            const meta = CATEGORY_META[category.handle]
            const Icon = meta.icon
            return (
              <LocalizedClientLink
                key={category.id}
                href={`/categories/${category.handle}`}
                className="group relative flex min-h-32 flex-col items-center justify-center gap-3 rounded-[var(--radius-md)] border border-gray-200/80 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-brand/5 transition-colors duration-300 group-hover:bg-brand/10">
                  <Icon size={20} className="text-brand" strokeWidth={1.5} />
                </div>
                <span className="text-[11px] font-bold uppercase leading-tight tracking-wide text-gray-900">
                  {meta.label}
                </span>
                <span className="text-[10px] font-medium text-gray-400">
                  {category.products?.length ?? 0} items
                </span>
              </LocalizedClientLink>
            )
          })}
        </div>
      </div>
    </section>
  )
}
