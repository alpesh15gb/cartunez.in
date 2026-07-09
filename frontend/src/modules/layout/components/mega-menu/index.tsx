"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { motion, AnimatePresence, type Variants } from "framer-motion"

interface Category {
  id: string
  name: string
  handle: string
  category_children?: Category[]
}

interface MegaMenuProps {
  categories: Category[]
}

/* ── Dropdown animation variants ── */
const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: 6, scaleY: 0.96, transformOrigin: "top" },
  visible: {
    opacity: 1,
    y: 0,
    scaleY: 1,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -4,
    scaleY: 0.96,
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
  },
}

/* ── Mock children data (preserved) ── */
const MOCK_CHILDREN: Record<string, Category[]> = {
  "android-stereos": [
    {
      id: "as-1",
      name: "By Memory",
      handle: "android-stereos?memory=4gb",
      category_children: [
        { id: "as-1-1", name: "2GB RAM / 32GB ROM", handle: "android-stereos" },
        { id: "as-1-2", name: "4GB RAM / 64GB ROM", handle: "android-stereos" },
        { id: "as-1-3", name: "8GB RAM / 128GB ROM", handle: "android-stereos" },
      ],
    },
    {
      id: "as-2",
      name: "By Screen Size",
      handle: "android-stereos",
      category_children: [
        { id: "as-2-1", name: "9 Inch Stereos", handle: "android-stereos" },
        { id: "as-2-2", name: "10 Inch Stereos", handle: "android-stereos" },
        { id: "as-2-3", name: "Tesla-Style Screens", handle: "android-stereos" },
      ],
    },
  ],
  "ambient-lighting": [
    {
      id: "al-1",
      name: "By Technology",
      handle: "ambient-lighting",
      category_children: [
        { id: "al-1-1", name: "K4 Acrylic Lights", handle: "ambient-lighting" },
        { id: "al-1-2", name: "Symphony LED Lights", handle: "ambient-lighting" },
        { id: "al-1-3", name: "App Controlled RGB", handle: "ambient-lighting" },
      ],
    },
    {
      id: "al-2",
      name: "Fitment Zones",
      handle: "ambient-lighting",
      category_children: [
        { id: "al-2-1", name: "Dashboard Kits", handle: "ambient-lighting" },
        { id: "al-2-2", name: "4-Door Ambient Kits", handle: "ambient-lighting" },
        { id: "al-2-3", name: "Underglow Ambient Kits", handle: "ambient-lighting" },
      ],
    },
  ],
  "led-lights": [
    {
      id: "ll-1",
      name: "Bulbs & Upgrades",
      handle: "led-lights",
      category_children: [
        { id: "ll-1-1", name: "LED Headlight Bulbs", handle: "led-lights" },
        { id: "ll-1-2", name: "H4/H7 Conversion Kits", handle: "led-lights" },
        { id: "ll-1-3", name: "LED Projector Lens", handle: "led-lights" },
      ],
    },
    {
      id: "ll-2",
      name: "Exterior Lights",
      handle: "led-lights",
      category_children: [
        { id: "ll-2-1", name: "Fog Lamps", handle: "led-lights" },
        { id: "ll-2-2", name: "Matrix Indicator Strips", handle: "led-lights" },
        { id: "ll-2-3", name: "Interior Roof LEDs", handle: "ll-2-3" },
      ],
    },
  ],
}
export default function MegaMenu({ categories }: MegaMenuProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const params = useParams()
  const countryCodeStr = (params?.countryCode as string) || ""
  const parentCategories = categories.filter(
    (cat) =>
      !(cat as unknown as Record<string, unknown>).parent_category_id &&
      !(cat as unknown as Record<string, unknown>).parent_category
  )

  return (
    <nav className="hidden md:flex items-center gap-x-0.5 h-full" data-testid="mega-menu">
      {/* All Products link */}
      <Link
        href={`/${countryCodeStr}/store`}
        className="relative px-3 py-1.5 text-[11px] font-bold tracking-[0.18em] uppercase text-gray-500 hover:text-brand transition-colors duration-200 rounded-sm"
      >
        All Products
      </Link>

      {parentCategories.slice(0, 5).map((category) => {
        const customChildren = MOCK_CHILDREN[category.handle]
        const hasChildren = customChildren && customChildren.length > 0
        const isHovered = activeCategory === category.id

        return (
          <div
            key={category.id}
            className="relative h-full flex items-center"
            onMouseEnter={() => hasChildren && setActiveCategory(category.id)}
            onMouseLeave={() => setActiveCategory(null)}
          >
            <Link
              href={`/${countryCodeStr}/categories/${category.handle}`}
              data-testid={`mega-menu-${category.handle}`}
              className={`relative flex items-center gap-x-1 px-3 py-1.5 text-[11px] font-bold tracking-[0.18em] uppercase rounded-sm transition-all duration-200 ${
                isHovered
                  ? "text-brand bg-brand-light/60"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span>{category.name}</span>
              {hasChildren && (
                <ChevronDown
                  size={10}
                  className={`transition-transform duration-200 ${
                    isHovered ? "rotate-180 text-brand" : "opacity-60"
                  }`}
                />
              )}
            </Link>

            {/* ── Premium white dropdown ── */}
            <AnimatePresence>
              {hasChildren && isHovered && customChildren && (
                <motion.div
                  key={category.id}
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute top-full left-1/2 -translate-x-1/2 w-[680px] bg-white shadow-elevation-4 border border-gray-100 rounded-lg p-8 z-50 grid grid-cols-3 gap-10"
                >
                  {/* Column 1 & 2 — Category links */}
                  <div className="col-span-2 grid grid-cols-2 gap-x-10 gap-y-8 border-r border-gray-100 pr-10">
                    {customChildren.map((child) => (
                      <div key={child.id} className="space-y-3">
                        <Link
                          href={`/${countryCodeStr}/categories/${child.handle}`}
                          className="inline-block text-[11px] font-bold text-brand uppercase tracking-[0.16em] hover:text-brand-dark transition-colors duration-200"
                          onClick={() => setActiveCategory(null)}
                        >
                          {child.name}
                        </Link>
                        {child.category_children && child.category_children.length > 0 && (
                          <div className="space-y-1.5">
                            {child.category_children.map((subChild) => (
                              <Link
                                key={subChild.id}
                                href={`/${countryCodeStr}/categories/${subChild.handle}`}
                                className="block text-[13px] text-gray-500 hover:text-gray-900 font-medium transition-colors duration-200 leading-relaxed"
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

                  {/* Column 3 — Featured callout */}
                  <div className="flex flex-col justify-between">
                    <div className="space-y-4">
                      <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-[0.22em]">
                        Featured
                      </span>
                      <div className="w-8 h-[2px] bg-brand" />
                      <h4 className="text-sm font-display font-bold uppercase text-gray-900 leading-tight tracking-wide">
                        Custom Fit<br />Guaranteed
                      </h4>
                      <p className="text-[12px] text-gray-500 font-normal leading-relaxed">
                        Wired and designed to integrate seamlessly with your
                        vehicle&apos;s factory dashboard and electrical setup.
                      </p>
                    </div>
                    <Link
                      href={`/${countryCodeStr}/categories/${category.handle}`}
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-900 hover:text-brand uppercase tracking-[0.18em] border-b border-gray-900 hover:border-brand pb-0.5 self-start transition-all duration-300 group"
                      onClick={() => setActiveCategory(null)}
                    >
                      View All
                      <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">
                        &rarr;
                      </span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </nav>
  )
}

