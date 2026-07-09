"use client"

import React, { useState, useEffect } from "react"
import { X } from "lucide-react"

const announcements = [
  "Free Shipping on all orders above ₹999",
  "Professional Fitment Available at Select Locations",
  "EMI Options Available on All Orders Above ₹5,000",
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

  return (
    <div className="relative bg-gray-900 text-white overflow-hidden select-none">
      <div className="content-container flex items-center justify-between h-9">
        <div className="flex-1 text-center">
          <p
            key={currentIndex}
            className="text-[11px] font-medium tracking-wide animate-fade-in-down"
          >
            {announcements[currentIndex]}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {announcements.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? "bg-white w-3" : "bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Show announcement ${idx + 1}`}
              />
            ))}
          </div>
          {/* Close */}
          <button
            onClick={() => setDismissed(true)}
            className="ml-3 p-1 text-white/60 hover:text-white transition-colors"
            aria-label="Dismiss announcement"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}