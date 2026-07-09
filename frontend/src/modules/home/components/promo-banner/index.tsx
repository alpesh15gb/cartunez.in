"use client"

import React from "react"
import Link from "next/link"
import { ArrowRight, ShieldCheck, CreditCard, MapPin, Wrench, Star } from "lucide-react"

const features = [
  { icon: CreditCard, label: "EMI Available", desc: "No-cost EMI on all major credit cards" },
  { icon: ShieldCheck, label: "Installation Warranty", desc: "6-month warranty on all installations" },
  { icon: MapPin, label: "Pan-India Service", desc: "40+ authorised installation centers" },
]

const PromoBanner = () => {
  return (
    <section className="relative bg-[var(--color-carbon)] overflow-hidden">
      {/* Premium background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1487621167305-5d248087c724?q=80&w=2000&auto=format&fit=crop')",
        }}
      />
      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-carbon-dark)] via-[var(--color-carbon)]/95 to-[var(--color-carbon)]/80" />
      {/* Brand glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,28,28,0.15),transparent_60%)]" />
      {/* Carbon fiber texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 content-container py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">
          {/* Left content — spans 3 cols */}
          <div className="lg:col-span-3 space-y-7">
            {/* Eyebrow pill */}
            <div className="inline-flex items-center gap-2 bg-white/[0.07] backdrop-blur-sm border border-white/[0.08] rounded-full px-4 py-1.5">
              <Wrench size={12} className="text-brand" />
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em]">Worry-Free Shopping</span>
            </div>

            {/* Headline */}
            <h2
              className="font-display font-black uppercase text-white leading-none"
              style={{ fontSize: "clamp(40px, 5vw, 72px)", letterSpacing: "-0.02em" }}
            >
              Free Installation
              <br />
              <span className="text-brand">at Select Locations</span>
            </h2>

            {/* Description */}
            <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-md">
              Get your accessories professionally installed at our partner studios across Delhi, Mumbai, 
              Bengaluru &amp; Hyderabad. Easy EMI options available on all orders above ₹2,000.
            </p>

            {/* CTA row */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/store"
                className="group inline-flex items-center gap-2.5
                           bg-gradient-to-br from-brand to-brand-dark
                           text-white text-sm font-bold uppercase tracking-[0.12em]
                           px-7 py-3.5 rounded-[var(--radius-md)]
                           shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/30
                           transition-all duration-300 hover:-translate-y-0.5"
              >
                Shop Now
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/book-installation"
                className="group inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em]
                           text-white/50 hover:text-white transition-colors duration-300
                           border-b border-white/10 hover:border-white/30 pb-0.5"
              >
                Find a Studio
                <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Trust bar */}
            <div className="flex items-center gap-6 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.12em]">4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={12} className="text-brand" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.12em]">Fitment Guarantee</span>
              </div>
            </div>
          </div>

          {/* Right — Feature badges */}
          <div className="lg:col-span-2 hidden lg:flex flex-col gap-5 pl-12 border-l border-white/[0.06]">
            {features.map((item, idx) => {
              const Icon = item.icon
              return (
                <div key={idx} className="flex items-start gap-4 group">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)]
                                  bg-white/[0.04] border border-white/[0.06]
                                  group-hover:bg-brand/10 group-hover:border-brand/30
                                  transition-all duration-500">
                    <Icon size={20} className="text-brand" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-white">{item.label}</p>
                    <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-brand via-brand/40 to-transparent" />
    </section>
  )
}

export default PromoBanner
