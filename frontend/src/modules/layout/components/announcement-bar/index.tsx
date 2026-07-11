"use client"

import React, { useState, useEffect } from "react"
import { X, ChevronRight, Truck, ShieldCheck, Headphones } from "lucide-react"

const announcements = [
  { text: "Free Shipping on all orders above ₹999", icon: Truck },
  { text: "Professional Fitment Available at Select Locations", icon: Headphones },
  { text: "EMI Options Available on All Orders Above ₹5,000", icon: ShieldCheck },
]

export default function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const t = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length)
    }, 5000)
    return () => clearInterval(t)
  }, [])

  if (dismissed) return null

  const CurrentIcon = announcements[currentIndex].icon

  return (
    <div className="relative bg-gradient-to-r from-gray-900 via-brand/95 to-gray-900 text-white overflow-hidden select-none">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:16px_16px]" />
      
      <div className="content-container relative flex items-center justify-between h-[38px]">
        <div className="flex-1 text-center">
          <p
            key={currentIndex}
            className="inline-flex items-center gap-2 text-[11px] font-medium tracking-wide animate-fade-in-down"
          >
            <CurrentIcon size={13} className="text-brand-light shrink-0" strokeWidth={2} />
            <span>{announcements[currentIndex].text}</span>
            <ChevronRight size={12} className="text-brand-light/60 hidden sm:inline-block" strokeWidth={2} />
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {announcements.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? "bg-white w-3" : "bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Show announcement ${idx + 1}`}
              />
            ))}
          </div>
          {/* Close */}
          <button
            onClick={() => setDismissed(true)}
            className="ml-2 p-1 text-white/40 hover:text-white transition-colors rounded-sm hover:bg-white/10"
            aria-label="Dismiss announcement"
          >
            <X size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}
