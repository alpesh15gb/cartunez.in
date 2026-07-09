"use client"

import React, { useRef } from "react"
import { Star, ChevronLeft, ChevronRight, Quote, MessageCircle } from "lucide-react"

const reviews = [
  {
    name: "Arjun Mehta",
    avatar: "AM",
    vehicle: "Hyundai Creta 2023",
    rating: 5,
    text: "The 7D floor mats are absolutely perfect — precision fit like OEM. Delivery was surprisingly fast and installation was a breeze. Highly recommended!",
  },
  {
    name: "Priya Sharma",
    avatar: "PS",
    vehicle: "Maruti Suzuki Baleno 2024",
    rating: 5,
    text: "Bought the Android stereo system and the difference is night and day. Wireless CarPlay works flawlessly. The team even helped with compatibility check before ordering.",
  },
  {
    name: "Rahul Verma",
    avatar: "RV",
    vehicle: "Mahindra Thar 2023",
    rating: 5,
    text: "Ambient lighting kit transformed the cabin experience. App control is smooth and the install video guide made it easy to DIY. Quality is top notch.",
  },
  {
    name: "Sneha Patel",
    avatar: "SP",
    vehicle: "Toyota Fortuner 2022",
    rating: 5,
    text: "Premium seat covers that actually fit! No loose fabric, no shifting. The leatherette feels premium and the stitching matches my interior perfectly.",
  },
  {
    name: "Vikram Singh",
    avatar: "VS",
    vehicle: "Honda City 2024",
    rating: 5,
    text: "Been shopping here for all my accessories. The fitment guarantee is real — everything has been spot on. Customer support is genuinely helpful and responsive.",
  },
  {
    name: "Ananya Reddy",
    avatar: "AR",
    vehicle: "Kia Seltos 2023",
    rating: 5,
    text: "Ordered steering wheel cover and LED lights. Quality exceeded expectations. Free shipping is a bonus and the packaging was premium. Will definitely order again.",
  },
]

const CustomerReviews = () => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    const scrollAmount = 360
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    })
  }

  return (
    <section className="relative bg-gradient-to-b from-gray-50 to-white border-t border-gray-100 py-24 sm:py-28 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,28,28,0.04),transparent_60%)] pointer-events-none" />

      <div className="content-container relative z-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-16 gap-6">
          <div className="space-y-4">
            <span className="eyebrow">Real Reviews</span>
            <h2
              className="font-display font-black uppercase text-gray-900 leading-none"
              style={{ fontSize: "clamp(36px, 4vw, 56px)", letterSpacing: "-0.02em" }}
            >
              What Our
              <br />
              <span className="text-brand">Customers Say</span>
            </h2>
          </div>

          {/* Scroll arrows */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => scroll("left")}
              className="flex h-11 w-11 items-center justify-center rounded-full
                         border border-gray-200 bg-white text-gray-500
                         hover:border-brand hover:text-brand hover:bg-brand/5
                         shadow-sm hover:shadow-md
                         transition-all duration-300"
              aria-label="Scroll reviews left"
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="flex h-11 w-11 items-center justify-center rounded-full
                         border border-gray-200 bg-white text-gray-500
                         hover:border-brand hover:text-brand hover:bg-brand/5
                         shadow-sm hover:shadow-md
                         transition-all duration-300"
              aria-label="Scroll reviews right"
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal scrolling row */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto px-[max(calc((100vw-var(--content-max-width,1280px))/2),1.5rem)] pb-4
                   scroll-smooth snap-x snap-mandatory no-scrollbar"
        style={{ scrollbarWidth: "none" }}
      >
        {reviews.map((review, idx) => (
          <div
            key={idx}
            className="snap-start shrink-0 w-[360px] sm:w-[400px] bg-white rounded-[var(--radius-lg)]
                       border border-gray-200/80 p-8
                       flex flex-col gap-5
                       shadow-sm hover:shadow-[var(--shadow-card-hover)]
                       transition-all duration-500 ease-out
                       hover:-translate-y-0.5"
          >
            {/* Quote icon + rating row */}
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-brand/5">
                <Quote size={18} className="text-brand/40" strokeWidth={1.5} />
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={i < review.rating ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-100"}
                    strokeWidth={0}
                  />
                ))}
              </div>
            </div>

            {/* Review text */}
            <div className="flex-1">
              <p className="text-sm text-gray-600 font-medium leading-relaxed italic">
                &ldquo;{review.text}&rdquo;
              </p>
            </div>

            {/* Author */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full
                              bg-gradient-to-br from-brand/20 via-brand/10 to-brand/5
                              text-xs font-bold text-brand uppercase
                              ring-2 ring-white shadow-sm">
                {review.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{review.name}</p>
                <p className="text-[11px] text-gray-400 font-medium truncate flex items-center gap-1">
                  <MessageCircle size={10} className="shrink-0" />
                  {review.vehicle}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default CustomerReviews
