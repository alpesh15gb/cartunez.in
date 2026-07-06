import React from "react"
import Link from "next/link"

export default function PromoBanners() {
  const promos = [
    {
      title: "Custom 7D\nFloor Mats",
      desc: "Precision-cut all-weather floor protection. OEM-grade fitment for your exact vehicle.",
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop",
      link: "/categories/floor-mats",
      tag: "Guaranteed Fit",
      cta: "Shop Floor Mats",
    },
    {
      title: "Android\nStereo Systems",
      desc: "Smart CarPlay & Android Auto displays. Precision wired for seamless OEM integration.",
      image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200&auto=format&fit=crop",
      link: "/categories/android-stereos",
      tag: "Tech Upgrade",
      cta: "Shop Stereos",
    },
  ]

  return (
    <section className="bg-white border-t border-gray-100 py-4">
      <div className="content-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promos.map((promo, idx) => (
            <Link href={promo.link} key={idx} className="block group">
              <div className="relative overflow-hidden" style={{ height: "420px" }}>
                {/* Background image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url('${promo.image}')` }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent" />

                {/* Top tag */}
                <div className="absolute top-6 left-6 z-10">
                  <span className="text-[10px] font-bold text-white bg-brand px-3 py-1.5 uppercase tracking-widest">
                    {promo.tag}
                  </span>
                </div>

                {/* Bottom content */}
                <div className="absolute bottom-0 inset-x-0 p-8 z-10">
                  <h3
                    className="font-display font-black uppercase text-gray-900 leading-tight mb-3"
                    style={{ fontSize: "clamp(32px, 3vw, 48px)", letterSpacing: "-0.02em", whiteSpace: "pre-line" }}
                  >
                    {promo.title}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed mb-5 max-w-xs">
                    {promo.desc}
                  </p>
                  <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest
                                   text-gray-900 border-b border-brand pb-0.5
                                   group-hover:text-brand transition-colors duration-300">
                    {promo.cta}
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
