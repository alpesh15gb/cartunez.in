import React from "react"
import { Truck, ShieldCheck, HelpCircle, BadgeCheck } from "lucide-react"

export default function WhyChooseUs() {
  const features = [
    {
      title: "Guaranteed Compatibility",
      desc: "Every item verified against your make, model, and year before it ships.",
      icon: BadgeCheck,
      stat: "100%",
      statLabel: "Fitment rate",
    },
    {
      title: "Free Shipping India-wide",
      desc: "Safe, fast delivery across India at zero additional cost. Always.",
      icon: Truck,
      stat: "2–5",
      statLabel: "Day delivery",
    },
    {
      title: "OEM-Grade Quality",
      desc: "Premium materials built to withstand harsh weather and daily driving.",
      icon: ShieldCheck,
      stat: "5yr",
      statLabel: "Durability tested",
    },
    {
      title: "Expert Assistance",
      desc: "Speak directly to our fitment crew. Guided installation support included.",
      icon: HelpCircle,
      stat: "24/7",
      statLabel: "Support available",
    },
  ]

  return (
    <section className="relative bg-white border-t border-gray-100 py-24 sm:py-28">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(201,28,28,0.03),transparent_60%)] pointer-events-none" />

      <div className="content-container relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-4">
            <span className="eyebrow">The Cartunez Edge</span>
            <h2
              className="font-display font-black uppercase text-gray-900 leading-none"
              style={{ fontSize: "clamp(36px, 4vw, 56px)", letterSpacing: "-0.02em" }}
            >
              Why Enthusiasts
              <br />
              <span className="text-brand">Choose Us</span>
            </h2>
          </div>
          <p className="text-sm text-gray-500 max-w-xs font-medium leading-relaxed">
            Premium service and exact fitment engineering at the core of everything we do.
          </p>
        </div>

        {/* Feature grid — premium cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div
                key={idx}
                className="relative bg-white rounded-[var(--radius-lg)]
                           border border-gray-200/80
                           p-8 flex flex-col gap-6
                           transition-all duration-500 ease-out
                           group
                           hover:-translate-y-1 hover:border-brand/15 hover:shadow-[var(--shadow-card-hover)]"
              >
                {/* Top accent bar */}
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-0 rounded-full bg-brand
                                 transition-all duration-500 ease-out group-hover:w-2/3" />

                {/* Stat */}
                <div className="space-y-1">
                  <span
                    className="font-display font-black text-gray-900"
                    style={{ fontSize: "clamp(40px, 4vw, 56px)", lineHeight: 1 }}
                  >
                    {feature.stat}
                  </span>
                  <span className="text-[10px] font-bold text-brand uppercase tracking-[0.15em] block">
                    {feature.statLabel}
                  </span>
                </div>

                {/* Divider */}
                <span className="block w-10 h-0.5 bg-brand transition-all duration-500 ease-out group-hover:w-16" />

                {/* Content */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]
                                    bg-brand/5 group-hover:bg-brand/10 transition-colors duration-500">
                      <Icon size={14} className="text-brand" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    {feature.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
