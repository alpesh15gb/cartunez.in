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
    <section className="bg-white border-t border-gray-100 py-24">
      <div className="content-container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-3">
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

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div
                key={idx}
                className="bg-white p-8 flex flex-col gap-6 group
                           hover:bg-gray-50 transition-colors duration-300"
              >
                {/* Stat */}
                <div className="space-y-1">
                  <span
                    className="font-display font-black text-gray-900"
                    style={{ fontSize: "clamp(40px, 4vw, 56px)", lineHeight: 1 }}
                  >
                    {feature.stat}
                  </span>
                  <span className="text-[10px] font-bold text-brand uppercase tracking-widest block">
                    {feature.statLabel}
                  </span>
                </div>

                {/* Divider */}
                <span className="red-line group-hover:w-full transition-all duration-500" />

                {/* Content */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Icon size={16} className="text-brand stroke-[1.5px] shrink-0" />
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
