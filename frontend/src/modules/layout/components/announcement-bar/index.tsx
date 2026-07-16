"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { X, ChevronRight, Truck, ShieldCheck, Headphones } from "lucide-react"

const announcements = [
  { text: "Free shipping on all orders above Rs. 999", icon: Truck },
  { text: "Professional fitment available at select locations", icon: Headphones },
  { text: "EMI options available on orders above Rs. 5,000", icon: ShieldCheck },
]

export default function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  if (dismissed) return null

  const CurrentIcon = announcements[currentIndex].icon

  return (
    <div className="relative overflow-hidden bg-gray-950 text-white select-none">
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:16px_16px]" />

      <div className="content-container relative flex h-[38px] items-center justify-between gap-4">
        <div className="hidden md:flex items-center gap-5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
          <Link href="/support" className="transition-colors hover:text-white">Contact Us</Link>
          <Link href="/returns" className="transition-colors hover:text-white">Returns</Link>
          <Link href="/book-installation" className="transition-colors hover:text-white">Installation</Link>
        </div>

        <div className="min-w-0 flex-1 text-center">
          <p
            key={currentIndex}
            className="inline-flex max-w-full items-center gap-2 truncate text-[11px] font-semibold tracking-wide animate-fade-in-down"
          >
            <CurrentIcon size={13} className="shrink-0 text-brand-light" strokeWidth={2} />
            <span className="truncate">{announcements[currentIndex].text}</span>
            <ChevronRight size={12} className="hidden shrink-0 text-brand-light/60 sm:inline-block" strokeWidth={2} />
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5">
            {announcements.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? "w-3 bg-white" : "w-1.5 bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Show announcement ${idx + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="rounded-sm p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Dismiss announcement"
          >
            <X size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}
