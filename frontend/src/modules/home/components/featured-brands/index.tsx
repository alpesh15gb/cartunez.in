"use client"

import React, { useEffect, useState } from "react"
import { fetchMakes, type VehicleMake } from "@lib/data/fastapi"

export default function FeaturedBrands() {
  const [makes, setMakes] = useState<VehicleMake[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchMakes()
      .then((data) => { setMakes(data || []) })
      .catch(() => { /* silent — section simply won't render */ })
      .finally(() => setLoading(false))
  }, [])

  if (loading || makes.length === 0) return null

  return (
    <section className="bg-carbon-dark border-t border-white/5 py-24">
      <div className="content-container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-3">
            <span className="eyebrow">Perfect Fitment</span>
            <h2
              className="font-display font-black uppercase text-white leading-none"
              style={{ fontSize: "clamp(36px, 4vw, 56px)", letterSpacing: "-0.02em" }}
            >
              Supported
              <br />
              <span className="text-brand">Manufacturers</span>
            </h2>
          </div>
          <p className="text-sm text-gray-400 max-w-xs font-medium leading-relaxed">
            Accessories built to spec for every major Indian and global automotive brand.
          </p>
        </div>

        {/* Logo grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-px bg-white/5">
          {makes.slice(0, 12).map((make) => (
            <div
              key={make.id}
              className="bg-carbon-light flex flex-col items-center justify-center py-8 px-4
                         group cursor-default hover:bg-[#161618] transition-colors duration-300"
            >
              {make.logo_url ? (
                <img
                  src={make.logo_url}
                  alt={make.name}
                  className="h-10 object-contain filter grayscale opacity-40
                             group-hover:grayscale-0 group-hover:opacity-100
                             transition-all duration-400"
                />
              ) : (
                <span
                  className="font-display font-black uppercase text-gray-600 text-center leading-tight
                             group-hover:text-white transition-colors duration-300"
                  style={{ fontSize: "clamp(14px, 1.5vw, 18px)", letterSpacing: "0.05em" }}
                >
                  {make.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
