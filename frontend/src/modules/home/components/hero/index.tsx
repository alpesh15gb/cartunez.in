"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"

/* ── Easing presets ── */
const easeOut = [0.16, 1, 0.3, 1] as const

/* ── Animation Variants ── */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.2 } },
}

const childUp = {
  hidden: { opacity: 0, y: 48 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeOut },
  },
}

const childScale = {
  hidden: { opacity: 0, scale: 0.9, y: 24 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOut },
  },
}

const lineReveal = {
  hidden: { width: 0 },
  show: { width: 32, transition: { duration: 0.6, ease: easeOut } },
}

/* ── Rotating taglines ── */
const taglines = [
  "Precision-engineered accessories built to fit your exact vehicle.",
  "Android stereos, 7D floor mats, LED systems — custom fitment guaranteed.",
  "OEM-grade quality. Professional installation. Pan-India delivery.",
]

const Hero = () => {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [taglineIdx, setTaglineIdx] = useState(0)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)

  /* Scroll-driven parallax */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const opacityScale = useTransform(scrollYProgress, [0, 0.7], [1, 0.4])

  /* Rotate taglines every 4s */
  useEffect(() => {
    const t = setInterval(() => setTaglineIdx((i) => (i + 1) % taglines.length), 4000)
    return () => clearInterval(t)
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-neutral-950"
      style={{ minHeight: "100svh" }}
    >
      {/* ── Background video with fallback ── */}
      {!videoError && (
        <video
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => setVideoError(true)}
          className="absolute inset-0 h-full w-full object-cover will-change-transform"
          style={{ opacity: videoLoaded ? 1 : 0, transition: "opacity 1s ease" }}
          poster="/hero-bg.jpg"
        >
          <source
            src="https://cdn.coverr.co/videos/coverr-black-luxury-car-driving-on-highway-5763/1080p.mp4"
            type="video/mp4"
          />
        </video>
      )}

      {/* Fallback image (shown until video loads or on error) */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
        style={{
          backgroundImage: "url('/hero-bg.jpg')",
          y: bgY,
          scale: 1.05,
          opacity: opacityScale,
        }}
      />

      {/* Overlays */}
      <div
        className="absolute inset-0 transition-colors duration-1000"
        style={{
          background: videoLoaded
            ? "linear-gradient(to right, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.25) 100%)"
            : "linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.50) 50%, rgba(0,0,0,0.30) 100%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-80" />

      {/* Speed glow accent */}
      <div className="absolute top-1/4 right-0 w-[40vw] h-[50vh] bg-brand/10 blur-[120px] rounded-full pointer-events-none" />

      {/* ── Content ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col justify-center h-full content-container text-white pt-24 pb-32 min-h-screen"
      >
        <div className="max-w-4xl space-y-8">
          {/* Eyebrow */}
          <motion.div variants={childUp} className="flex items-center gap-3">
            <motion.span variants={lineReveal} className="h-px bg-brand" />
            <span className="text-[11px] font-bold text-brand uppercase tracking-[0.3em]">
              Premium Automotive Customization
            </span>
          </motion.div>

          {/* Display headline */}
          <motion.div variants={childUp} className="space-y-0 leading-none">
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
          </motion.div>

          {/* Rotating tagline */}
          <motion.div variants={childScale} className="relative h-12 sm:h-10">
            <AnimatePresence mode="wait">
              <motion.p
                key={taglineIdx}
                initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
                transition={{ duration: 0.5, ease: easeOut }}
                className="absolute inset-0 text-sm sm:text-base text-neutral-300 font-medium leading-relaxed max-w-lg tracking-wide"
              >
                {taglines[taglineIdx]}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          {/* CTAs */}
          <motion.div variants={childUp} className="flex flex-wrap gap-4 pt-4">
            <Link href="/store">
              <motion.span
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary inline-flex items-center gap-2"
              >
                Explore Accessories
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </motion.span>
            </Link>
            <Link href="/categories/android-stereos">
              <motion.span
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn-ghost inline-flex items-center gap-2 border-white/20 text-white hover:bg-white hover:text-neutral-900"
              >
                Shop Stereos
              </motion.span>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Bottom badge strip ── */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6, ease: easeOut }}
        className="absolute bottom-0 inset-x-0 bg-neutral-900/80 backdrop-blur-md border-t border-white/5 py-4 z-20 hidden md:block"
      >
        <div className="content-container flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <span>Custom Fitment Guaranteed</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <span>Free Delivery Pan-India</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <span>Professional Installation</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <span>OEM-Grade Quality</span>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

export default Hero