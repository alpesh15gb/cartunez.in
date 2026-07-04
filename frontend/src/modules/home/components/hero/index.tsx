import Link from "next/link"

const Hero = () => {
  return (
    <div className="relative w-full overflow-hidden bg-carbon-dark" style={{ minHeight: "100svh" }}>
      {/* Cinematic background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('/hero-bg.jpg')",
          transform: "scale(1.05)",
        }}
      />
      {/* Multi-layer gradient overlay for drama */}
      <div className="absolute inset-0 bg-gradient-to-r from-carbon/95 via-carbon/70 to-carbon/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-carbon via-transparent to-transparent opacity-80" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center h-full content-container text-white pt-24 pb-32 min-h-screen">
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
              className="font-display font-black uppercase leading-none text-white"
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
          <p className="text-sm sm:text-base text-gray-300 font-medium leading-relaxed max-w-lg tracking-wide">
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
      <div className="absolute bottom-0 inset-x-0 bg-carbon/90 backdrop-blur-sm border-t border-white/5 py-4 z-20 hidden md:block">
        <div className="content-container flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
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
