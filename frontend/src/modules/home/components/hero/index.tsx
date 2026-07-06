import Link from "next/link"

const Hero = () => {
  return (
    <div className="relative w-full overflow-hidden bg-gray-50" style={{ minHeight: "100svh" }}>
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/hero-bg.jpg')",
          transform: "scale(1.05)",
        }}
      />
      {/* Light overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-white/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent opacity-90" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center h-full content-container text-gray-900 pt-24 pb-32 min-h-screen">
        <div className="max-w-3xl space-y-8">
          {/* Eyebrow */}
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-brand" />
            <span className="text-[11px] font-bold text-brand uppercase tracking-[0.3em]">
              Premium Automotive Customization
            </span>
          </div>

          {/* Display headline */}
          <div className="space-y-0 leading-none">
            <h1
              className="font-display font-black uppercase leading-none text-gray-900"
              style={{ fontSize: "clamp(64px, 8vw, 120px)", letterSpacing: "-0.02em" }}
            >
              ELEVATE
            </h1>
            <h1
              className="font-display font-black uppercase leading-none"
              style={{ fontSize: "clamp(64px, 8vw, 120px)", letterSpacing: "-0.02em", color: "#c91c1c" }}
            >
              YOUR RIDE.
            </h1>
          </div>

          {/* Sub-headline */}
          <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed max-w-lg tracking-wide">
            Precision-engineered accessories built to fit your exact vehicle.
            Android stereos, 7D floor mats, LED systems — custom fitment guaranteed.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 pt-4">
            <Link href="/store">
              <span className="btn-primary">
                Explore Accessories
              </span>
            </Link>
            <Link href="/categories/android-stereos">
              <span className="btn-ghost">
                Shop Stereos
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom badge strip */}
      <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 py-4 z-20 hidden md:block">
        <div className="content-container flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            <span>Custom Fitment Guaranteed</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            <span>Free Delivery Pan-India</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            <span>Professional Installation</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            <span>OEM-Grade Quality</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
