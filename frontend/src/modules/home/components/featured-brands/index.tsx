"use client"

import Image from "next/image"
import React, { useEffect, useState } from "react"
import { fetchMakes, type VehicleMake } from "@lib/data/fastapi"

export default function FeaturedBrands() {
  const [makes, setMakes] = useState<VehicleMake[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchMakes()
      .then((data) => { setMakes(data || []) })
      .catch(() => { /* silent */ })
      .finally(() => setLoading(false))
  }, [])

  if (loading || makes.length === 0) return null

  return (
    <section className="relative bg-gradient-to-b from-gray-50 to-white border-t border-gray-100 py-24 sm:py-28">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,28,28,0.03),transparent_60%)] pointer-events-none" />

      <div className="content-container relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-4">
            <span className="eyebrow">Perfect Fitment</span>
            <h2
              className="font-display font-black uppercase text-gray-900 leading-none"
              style={{ fontSize: "clamp(36px, 4vw, 56px)", letterSpacing: "-0.02em" }}
            >
              Supported
              <br />
              <span className="text-brand">Manufacturers</span>
            </h2>
          </div>
          <p className="text-sm text-gray-500 max-w-xs font-medium leading-relaxed">
            Accessories built to spec for every major Indian and global automotive brand.
          </p>
        </div>

        {/* Logo grid — premium card-style */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {makes.slice(0, 12).map((make) => (
            <div
              key={make.id}
              className="group relative flex flex-col items-center justify-center
                         bg-white rounded-[var(--radius-md)]
                         border border-gray-200/70
                         py-8 px-4
                         transition-all duration-500 ease-out
                         hover:-translate-y-1 hover:border-brand/20 hover:shadow-[var(--shadow-card-hover)]"
            >
              {/* Subtle brand accent line on hover */}
              <span className="absolute top-0 inset-x-0 h-0.5 w-0 mx-auto rounded-full bg-brand
                               transition-all duration-500 ease-out group-hover:w-3/4" />

              {make.logo_url ? (
                <div className="flex items-center justify-center h-12 w-full px-2">
                  <Image
                    src={make.logo_url}
                    alt={make.name}
                    width={200}
                    height={40}
                    className="max-h-10 w-auto object-contain
                               filter grayscale opacity-40
                               group-hover:grayscale-0 group-hover:opacity-100
                               transition-all duration-500 ease-out"
                  />
                </div>
              ) : (
                <span
                  className="font-display font-black uppercase text-gray-400 text-center leading-tight
                             group-hover:text-gray-900 transition-colors duration-500"
                  style={{ fontSize: "clamp(14px, 1.5vw, 18px)", letterSpacing: "0.05em" }}
                >
                  {make.name}
                </span>
              )}
              <span className="mt-3 text-[9px] font-bold text-gray-300 uppercase tracking-[0.15em]
                               group-hover:text-brand/60 transition-colors duration-500">
                Verified
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
