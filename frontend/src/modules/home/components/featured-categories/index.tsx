"use client"

import React from "react"
import Link from "next/link"
import { Monitor, Sun, Grid3x3, Lightbulb, Sofa, Circle, ArrowRight } from "lucide-react"

const categories = [
  {
    name: "Android Stereos",
    description: "Smart CarPlay & Android Auto displays with OEM-grade integration.",
    icon: Monitor,
    href: "/categories/android-stereos",
    gradient: "from-blue-500/15 via-blue-500/5 to-transparent",
    accent: "bg-blue-500",
    ring: "ring-blue-500/20 group-hover:ring-blue-500/40",
  },
  {
    name: "Ambient Lighting",
    description: "Custom interior LED kits with app control and music sync.",
    icon: Sun,
    href: "/categories/ambient-lighting",
    gradient: "from-amber-400/15 via-amber-400/5 to-transparent",
    accent: "bg-amber-400",
    ring: "ring-amber-400/20 group-hover:ring-amber-400/40",
  },
  {
    name: "Floor Mats",
    description: "Precision-cut 7D all-weather protection for your exact model.",
    icon: Grid3x3,
    href: "/categories/floor-mats",
    gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    accent: "bg-emerald-500",
    ring: "ring-emerald-500/20 group-hover:ring-emerald-500/40",
  },
  {
    name: "LED Lights",
    description: "High-performance LED headlights, fog lights & interior bulbs.",
    icon: Lightbulb,
    href: "/categories/led-lights",
    gradient: "from-yellow-500/15 via-yellow-400/5 to-transparent",
    accent: "bg-yellow-500",
    ring: "ring-yellow-500/20 group-hover:ring-yellow-500/40",
  },
  {
    name: "Seat Covers",
    description: "Premium leatherette and fabric covers tailored to your seats.",
    icon: Sofa,
    href: "/categories/seat-covers",
    gradient: "from-rose-500/15 via-rose-400/5 to-transparent",
    accent: "bg-rose-500",
    ring: "ring-rose-500/20 group-hover:ring-rose-500/40",
  },
  {
    name: "Steering Wheels",
    description: "Sports and premium steering wheels with custom stitch options.",
    icon: Circle,
    href: "/categories/steering-wheels",
    gradient: "from-violet-500/15 via-violet-400/5 to-transparent",
    accent: "bg-violet-500",
    ring: "ring-violet-500/20 group-hover:ring-violet-500/40",
  },
]

const FeaturedCategories = () => {
  return (
    <section className="relative bg-gradient-to-b from-white via-gray-50/50 to-white border-t border-gray-100 py-24 sm:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(201,28,28,0.04),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(201,28,28,0.03),transparent_60%)] pointer-events-none" />

      <div className="content-container relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-4">
            <span className="eyebrow">Shop by Category</span>
            <h2
              className="font-display font-black uppercase text-gray-900 leading-none"
              style={{ fontSize: "clamp(36px, 4vw, 56px)", letterSpacing: "-0.02em" }}
            >
              Find Your
              <br />
              <span className="text-brand">Perfect Fit</span>
            </h2>
          </div>
          <p className="text-sm text-gray-500 max-w-xs font-medium leading-relaxed">
            Premium automotive accessories curated and verified for your specific vehicle.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <Link
                key={cat.name}
                href={cat.href}
                className="group relative flex flex-col items-center text-center bg-white rounded-[var(--radius-lg)] border border-gray-200/80 p-6 sm:p-7
                           transition-all duration-500 ease-out
                           hover:-translate-y-2 hover:border-brand/15 hover:shadow-[var(--shadow-card-hover)]"
              >
                <span className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-0 rounded-full ${cat.accent}
                                  transition-all duration-500 ease-out group-hover:w-3/4`} />

                <div
                  className={`relative mb-5 flex h-16 w-16 items-center justify-center rounded-[var(--radius-md)]
                              bg-gradient-to-br ${cat.gradient} bg-white
                              ring-1 ${cat.ring} ring-gray-900/5
                              transition-all duration-500 ease-out
                              group-hover:shadow-lg group-hover:scale-105`}
                >
                  <Icon
                    size={28}
                    className="text-gray-700 transition-colors duration-500 ease-out group-hover:text-brand"
                    strokeWidth={1.5}
                  />
                </div>

                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-2 transition-colors duration-300 group-hover:text-brand">
                  {cat.name}
                </h3>

                <p className="text-[11px] text-gray-500 font-medium leading-relaxed mb-5 line-clamp-2">
                  {cat.description}
                </p>

                <span className="mt-auto inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em]
                                 text-brand/0 group-hover:text-brand
                                 translate-y-1 group-hover:translate-y-0
                                 transition-all duration-500 ease-out">
                  Shop Now
                  <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FeaturedCategories
