"use client"

import React from "react"
import { ArrowRight } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const categories = [
  {
    name: "Interior",
    description: "Cabin upgrades, mats, lighting, seat comfort and daily-use accessories.",
    href: "/store?category=interior",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1400&auto=format&fit=crop",
  },
  {
    name: "Exterior",
    description: "Lighting, styling, protection and road-ready exterior enhancements.",
    href: "/store?category=exterior",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1400&auto=format&fit=crop",
  },
  {
    name: "Wheels",
    description: "Alloy wheels, fitment-led upgrades and premium stance products.",
    href: "/store?category=wheels",
    image: "https://images.unsplash.com/photo-1617814076668-9d7cc7e8ca43?q=80&w=1400&auto=format&fit=crop",
  },
]

const quickCategories = [
  { name: "Android Stereos", href: "/categories/android-stereos" },
  { name: "Ambient Lighting", href: "/categories/ambient-lighting" },
  { name: "Floor Mats", href: "/categories/floor-mats" },
  { name: "LED Lights", href: "/categories/led-lights" },
  { name: "Seat Covers", href: "/categories/seat-covers" },
  { name: "Steering Wheels", href: "/categories/steering-wheels" },
]

const FeaturedCategories = () => {
  return (
    <section className="relative border-t border-gray-100 bg-white py-14 sm:py-16 lg:py-20">
      <div className="content-container">
        <div className="mb-8 flex flex-col gap-4 border-b border-gray-100 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow">Shop Our Exclusive Range</span>
            <h2 className="mt-3 font-display text-4xl font-black uppercase leading-none tracking-tight text-gray-950 sm:text-5xl">
              Premium Car Accessories
            </h2>
          </div>
          <p className="max-w-md text-sm font-medium leading-6 text-gray-500">
            Browse the same way serious automotive shoppers do: by interior, exterior, wheels, and fitment-led upgrades.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {categories.map((category) => (
            <LocalizedClientLink
              key={category.name}
              href={category.href}
              className="group relative min-h-[360px] overflow-hidden rounded-[var(--radius-md)] bg-gray-950 shadow-[var(--shadow-card)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url('${category.image}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                <h3 className="font-display text-4xl font-black uppercase leading-none tracking-tight text-white">
                  {category.name}
                </h3>
                <p className="mt-3 max-w-sm text-sm font-medium leading-6 text-white/72">
                  {category.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-colors group-hover:text-brand-light">
                  Shop Now
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </LocalizedClientLink>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickCategories.map((category) => (
            <LocalizedClientLink
              key={category.name}
              href={category.href}
              className="flex min-h-14 items-center justify-center rounded-[var(--radius-sm)] border border-gray-200 bg-gray-50 px-3 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-gray-700 transition-all hover:border-brand/30 hover:bg-brand-light hover:text-brand"
            >
              {category.name}
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedCategories
