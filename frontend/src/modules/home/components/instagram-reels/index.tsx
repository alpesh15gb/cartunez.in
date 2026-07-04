"use client"

import React, { useEffect, useState } from "react"
import { Play, X } from "lucide-react"
import { fetchInstagramReels, type InstagramReel } from "@lib/data/fastapi"

export default function InstagramReels() {
  const [reels, setReels] = useState<InstagramReel[]>([])
  const [loading, setLoading] = useState(false)
  const [activeReel, setActiveReel] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchInstagramReels()
      .then((data) => {
        setReels(data || [])
      })
      .catch((err) => {
        console.error("Failed to fetch Instagram reels:", err)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || reels.length === 0) {
    return null
  }

  return (
    <div className="bg-carbon text-white py-20 border-t border-white/5">
      <div className="content-container">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-16">
          <span className="text-[10px] font-bold text-brand uppercase tracking-widest block">
            Social Feed
          </span>
          <h2 className="text-2xl font-bold uppercase tracking-wider text-white">
            Instagram Reels
          </h2>
          <p className="text-xs text-gray-400 font-medium">
            Watch our products in action and see real upgrades from our community.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {reels.slice(0, 8).map((reel) => (
            <div
              key={reel.id}
              onClick={() => setActiveReel(reel.shortcode)}
              className="relative aspect-[9/16] rounded-soft overflow-hidden group cursor-pointer shadow-lg border border-white/5"
            >
              <img
                src={reel.thumbnail}
                alt={reel.caption || "Instagram Reel"}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-300 flex flex-col justify-between p-4 z-10">
                <div className="self-end bg-white/10 backdrop-blur-sm border border-white/15 p-2 rounded-full text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center mx-auto shadow-lg scale-90 group-hover:scale-100 transition-transform duration-300">
                    <Play size={16} className="text-white fill-white ml-0.5" />
                  </div>
                  <p className="text-[10px] text-gray-300 line-clamp-2 text-center leading-relaxed font-medium">
                    {reel.caption}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeReel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setActiveReel(null)}
        >
          <div
            className="relative w-full max-w-[420px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveReel(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white"
            >
              <X size={24} />
            </button>
            <div className="rounded-xl overflow-hidden shadow-2xl bg-black aspect-[9/16]">
              <iframe
                src={`https://www.instagram.com/reel/${activeReel}/embed/?autoplay=1`}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
                title="Instagram Reel"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
