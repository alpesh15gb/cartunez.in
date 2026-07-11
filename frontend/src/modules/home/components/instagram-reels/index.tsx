"use client"

import Image from "next/image"
import React, { useEffect, useState } from "react"
import { Play, X } from "lucide-react"

interface InstagramReel {
  id: string
  shortcode: string
  url: string
  thumbnail: string
  caption: string
  likes: number
}

export default function InstagramReels() {
  const [reels, setReels] = useState<InstagramReel[]>([])
  const [loading, setLoading] = useState(true)
  const [activeReel, setActiveReel] = useState<string | null>(null)

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const response = await fetch("/api/instagram-reels", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
        if (!response.ok) throw new Error("Failed to fetch reels")
        const data = await response.json()
        setReels(data.reels || [])
      } catch (err) {
        console.error("Failed to fetch Instagram reels:", err)
        setReels([])
      } finally {
        setLoading(false)
      }
    }
    fetchReels()
  }, [])

  if (loading || reels.length === 0) {
    return null
  }

  return (
    <section className="relative bg-gradient-to-b from-white to-gray-50 text-gray-900 py-24 sm:py-28 border-t border-gray-100">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(201,28,28,0.03),transparent_60%)] pointer-events-none" />
      <div className="content-container relative z-10">
        <div className="text-center max-w-xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            <span className="text-[10px] font-bold text-brand uppercase tracking-[0.2em]">Social Feed</span>
          </div>
          <h2 className="font-display font-black uppercase text-gray-900" style={{ fontSize: "clamp(32px, 4vw, 48px)", letterSpacing: "-0.02em" }}>Instagram Reels</h2>
          <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-lg mx-auto">Watch our products in action and see real upgrades from our community.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {reels.slice(0, 8).map((reel) => (
            <div key={reel.id} onClick={() => setActiveReel(reel.shortcode)} className="group relative aspect-[9/16] rounded-[var(--radius-md)] overflow-hidden cursor-pointer shadow-md hover:shadow-[var(--shadow-xl)] border border-gray-200/70 transition-all duration-500 ease-out hover:-translate-y-1">
              <Image src={reel.thumbnail} alt={reel.caption || "Instagram Reel"} fill sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, 25vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10 group-hover:from-black/80 group-hover:via-black/30 transition-colors duration-500 flex flex-col justify-between p-4 sm:p-5 z-10">
                <div className="self-end">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-brand to-brand-dark shadow-lg shadow-brand/30 scale-90 group-hover:scale-100 transition-transform duration-500 ease-out">
                      <Play size={18} className="text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  {reel.caption && <p className="text-[10px] text-gray-200/90 line-clamp-2 text-center leading-relaxed font-medium">{reel.caption}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {activeReel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setActiveReel(null)} onKeyDown={(e) => { if (e.key === "Escape") setActiveReel(null); }} role="dialog" aria-modal="true" aria-label="Instagram reel preview" tabIndex={-1}>
          <div className="relative w-full max-w-[420px] animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActiveReel(null)} className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors duration-300 flex items-center gap-2 text-xs font-medium"><span>Close</span><X size={16} /></button>
            <div className="rounded-[var(--radius-md)] overflow-hidden shadow-2xl bg-black aspect-[9/16] ring-1 ring-white/10">
              <iframe src={`https://www.instagram.com/reel/${activeReel}/embed/?autoplay=1`} className="w-full h-full border-0" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen title="Instagram Reel" />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
