"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"

interface Category {
  id: string
  name: string
  handle: string
  category_children?: Category[]
}

interface MegaMenuProps {
  categories: Category[]
}

const MOCK_CHILDREN: Record<string, Category[]> = {
  "android-stereos": [
    {
      id: "as-1",
      name: "By Memory",
      handle: "android-stereos?memory=4gb",
      category_children: [
        { id: "as-1-1", name: "2GB RAM / 32GB ROM", handle: "android-stereos" },
        { id: "as-1-2", name: "4GB RAM / 64GB ROM", handle: "android-stereos" },
        { id: "as-1-3", name: "8GB RAM / 128GB ROM", handle: "android-stereos" }
      ]
    },
    {
      id: "as-2",
      name: "By Screen Size",
      handle: "android-stereos",
      category_children: [
        { id: "as-2-1", name: "9 Inch Stereos", handle: "android-stereos" },
        { id: "as-2-2", name: "10 Inch Stereos", handle: "android-stereos" },
        { id: "as-2-3", name: "Tesla-Style Screens", handle: "android-stereos" }
      ]
    }
  ],
  "ambient-lighting": [
    {
      id: "al-1",
      name: "By Technology",
      handle: "ambient-lighting",
      category_children: [
        { id: "al-1-1", name: "K4 Acrylic Lights", handle: "ambient-lighting" },
        { id: "al-1-2", name: "Symphony LED Lights", handle: "ambient-lighting" },
        { id: "al-1-3", name: "App Controlled RGB", handle: "ambient-lighting" }
      ]
    },
    {
      id: "al-2",
      name: "Fitment Zones",
      handle: "ambient-lighting",
      category_children: [
        { id: "al-2-1", name: "Dashboard Kits", handle: "ambient-lighting" },
        { id: "al-2-2", name: "4-Door Ambient Kits", handle: "ambient-lighting" },
        { id: "al-2-3", name: "Underglow Ambient Kits", handle: "ambient-lighting" }
      ]
    }
  ],
  "led-lights": [
    {
      id: "ll-1",
      name: "Bulbs & Upgrades",
      handle: "led-lights",
      category_children: [
        { id: "ll-1-1", name: "LED Headlight Bulbs", handle: "led-lights" },
        { id: "ll-1-2", name: "H4/H7 Conversion Kits", handle: "led-lights" },
        { id: "ll-1-3", name: "LED Projector Lens", handle: "led-lights" }
      ]
    },
    {
      id: "ll-2",
      name: "Exterior Lights",
      handle: "led-lights",
      category_children: [
        { id: "ll-2-1", name: "Fog Lamps", handle: "led-lights" },
        { id: "ll-2-2", name: "Matrix Indicator Strips", handle: "led-lights" },
        { id: "ll-2-3", name: "Interior Roof LEDs", handle: "ll-2-3" }
      ]
    }
  ]
}

export default function MegaMenu({ categories }: MegaMenuProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const parentCategories = categories.filter(
    (cat) => !(cat as unknown as Record<string, unknown>).parent_category_id && !(cat as unknown as Record<string, unknown>).parent_category
  )

  return (
    <div className="hidden md:flex items-center gap-x-8 h-full">
      <Link
        href="/store"
        className="text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-brand transition-colors duration-300"
      >
        All Products
      </Link>

      {parentCategories.slice(0, 5).map((category) => {
        const customChildren = MOCK_CHILDREN[category.handle] || null
        const hasChildren = customChildren !== null
        const isHovered = activeCategory === category.id

        return (
          <div
            key={category.id}
            className="relative h-full flex items-center"
            onMouseEnter={() => hasChildren && setActiveCategory(category.id)}
            onMouseLeave={() => setActiveCategory(null)}
          >
            <Link
              href={`/categories/${category.handle}`}
              className="flex items-center gap-x-1.5 text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-brand transition-colors duration-300 h-full"
            >
              <span>{category.name}</span>
              {hasChildren && <ChevronDown size={12} className="opacity-70" />}
            </Link>

            {hasChildren && isHovered && customChildren && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[640px] dark-glass-card border border-gray-200 shadow-lg rounded-none p-8 z-50 animate-fade-in-down grid grid-cols-3 gap-8 backdrop-blur-xl">
                <div className="col-span-2 grid grid-cols-2 gap-6 border-r border-gray-200 pr-6">
                  {customChildren.map((child) => (
                    <div key={child.id} className="space-y-3">
                      <Link
                        href={`/categories/${child.handle}`}
                        className="text-[11px] font-bold text-brand uppercase tracking-widest block hover:text-brand-dark transition-colors duration-200"
                        onClick={() => setActiveCategory(null)}
                      >
                        {child.name}
                      </Link>
                      {child.category_children && child.category_children.length > 0 && (
                        <div className="space-y-2">
                          {child.category_children.map((subChild) => (
                            <Link
                              key={subChild.id}
                              href={`/categories/${subChild.handle}`}
                              className="text-xs text-gray-500 hover:text-gray-900 block font-medium transition-colors duration-200"
                              onClick={() => setActiveCategory(null)}
                            >
                              {subChild.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="eyebrow">Featured</span>
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider leading-snug">
                      Custom Fit Guaranteed
                    </h4>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                      Wired and designed to integrate seamlessly with your vehicle&apos;s factory dashboard and electrical setup.
                    </p>
                  </div>
                  <Link
                    href={`/categories/${category.handle}`}
                    className="text-[10px] font-bold text-gray-900 hover:text-brand uppercase tracking-widest border-b border-gray-900 hover:border-brand pb-0.5 self-start transition-all duration-300"
                    onClick={() => setActiveCategory(null)}
                  >
                    View All Upgrades
                  </Link>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
