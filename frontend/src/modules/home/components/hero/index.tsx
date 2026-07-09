"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

/* â”€â”€ Easing presets â”€â”€ */
const easeOut = [0.16, 1, 0.3, 1] as const

/* â”€â”€ Animation Variants â”€â”€ */
const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.25 },
  },
}

const childFadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOut },
  },
}

const childScale = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOut },
  },
}

/* â”€â”€ Hero slides â”€â”€ */
const slides = [
  {
    title: "YOUR RIDE.",
    subtitle: "YOUR RULES.",
    description:
      "Precision-engineered automotive accessories built to fit your exact vehicle.",
    cta: "Explore Accessories",
    ctaLink: "/store",
    cta2: "Shop Android Stereos",
    cta2Link: "/categories/android-stereos",
    image: "/hero-bg.jpg",
    gradient: "from-black/70 via-black/40 to-transparent",
  },
  {
    title: "CUSTOM 7D",
    subtitle: "FLOOR MATS",
    description:
      "Precision-cut all-weather protection. OEM-grade fitment for your exact make and model.",
    cta: "Shop Floor Mats",
    ctaLink: "/categories/floor-mats",
    cta2: "View All Accessories",
    cta2Link: "/store",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2000&auto=format&fit=crop",
    gradient: "from-black/70 via-black/30 to-transparent",
  },
  {
    title: "ANDROID",
    subtitle: "STEREO SYSTEMS",
    description:
      "Smart CarPlay & Android Auto displays. Precision wired for seamless OEM integration.",
    cta: "Shop Stereos",
    ctaLink: "/categories/android-stereos",
    cta2: "Learn More",
    cta2Link: "/store",
    image:
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2000&auto=format&fit=crop",
    gradient: "from-black/70 via-black/30 to-transparent",
  },
]

const Hero = () => {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(0)

  /* Scroll-driven parallax */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  const opacityScale = useTransform(scrollYProgress, [0, 0.75], [1, 0.25])

  /* Auto-rotate slides */
  useEffect(() => {
    const t = setInterval(() => {
      setDirection(1)
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(t)
  }, [])

  const goToSlide = useCallback(
    (index: number) => {
      setDirection(index > currentSlide ? 1 : -1)
      setCurrentSlide(index)
    },
    [currentSlide]
  )

  const prevSlide = useCallback(() => {
    setDirection(-1)
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }, [])

  const nextSlide = useCallback(() => {
    setDirection(1)
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }, [])

  /* â”€â”€ Slide crossfade variants â”€â”€ */
  const slideVariants = {
    enter: () => ({
      opacity: 0,
      scale: 1.06,
    }),
    center: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.9, ease: easeOut },
    },
    exit: () => ({
      opacity: 0,
      scale: 0.96,
      transition: { duration: 0.5, ease: easeOut },
    }),
  }

  const slide = slides[currentSlide]

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-neutral-950"
      style={{ minHeight: "100svh" }}
      data-testid="hero-section"
    >
      {/* â”€â”€ Slide background with crossfade â”€â”€ */}
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
          style={{
            backgroundImage: "url(" + slide.image + ")",
          }}
        />
      </AnimatePresence>

      {/* Scroll-driven parallax overlay */}
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{ y: bgY, opacity: opacityScale }}
      >
        <div
          className={"absolute inset-0 bg-gradient-to-r " + slide.gradient}
        />
      </motion.div>

      {/* Subtle brand glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60vw] h-[40vh] bg-brand/5 blur-[120px] rounded-full pointer-events-none" />

      {/* â”€â”€ Navigation arrows â”€â”€ */}
      <button
        onClick={prevSlide}
        className="absolute left-3 md:left-8 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-11 md:h-11 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        aria-label="Previous slide"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-3 md:right-8 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-11 md:h-11 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        aria-label="Next slide"
      >
        <ChevronRight size={18} />
      </button>

      {/* â”€â”€ Slide indicators â”€â”€ */}
      <div className="absolute bottom-32 md:bottom-36 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={"rounded-full transition-all duration-500 " + (
              index === currentSlide
                ? "w-9 h-1.5 bg-white"
                : "w-1.5 h-1.5 bg-white/30 hover:bg-white/50"
            )}
            aria-label={"Go to slide " + (index + 1)}
          />
        ))}
      </div>

      {/* â”€â”€ Content â”€â”€ */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col justify-center h-full content-container text-white pt-24 pb-36 min-h-screen"
      >
        <div className="max-w-4xl space-y-6 md:space-y-8">
          {/* Eyebrow */}
          <motion.div variants={childFadeUp} className="flex items-center gap-3">
            <span className="w-6 h-[2px] bg-brand" />
            <span className="text-[10px] md:text-[11px] font-bold text-brand uppercase tracking-[0.28em]">
              Premium Automotive Customization
            </span>
          </motion.div>

          {/* Display headline */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.55, ease: easeOut }}
              className="space-y-0 leading-none"
            >
              <h1
                className="font-display font-black uppercase leading-none text-white"
                style={{
                  fontSize: "clamp(44px, 6.5vw, 100px)",
                  letterSpacing: "-0.03em",
                }}
              >
                {slide.title}
              </h1>
              <h1
                className="font-display font-black uppercase leading-none text-brand"
                style={{
                  fontSize: "clamp(44px, 6.5vw, 100px)",
                  letterSpacing: "-0.03em",
                }}
              >
                {slide.subtitle}
              </h1>
            </motion.div>
          </AnimatePresence>

          {/* Description */}
          <motion.p
            variants={childScale}
            className="text-sm sm:text-base text-neutral-300 font-normal leading-relaxed max-w-lg tracking-wide"
          >
            {slide.description}
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={childFadeUp}
            className="flex flex-wrap gap-3 md:gap-4 pt-2"
          >
            <Link href={slide.ctaLink}>
              <motion.span
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary inline-flex items-center gap-2"
              >
                {slide.cta}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </motion.span>
            </Link>
            <Link href={slide.cta2Link}>
              <motion.span
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-ghost inline-flex items-center gap-2 border-white/20 text-white hover:bg-white hover:text-neutral-900 text-sm"
              >
                {slide.cta2}
              </motion.span>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* â”€â”€ Bottom badge strip â”€â”€ */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.5, ease: easeOut }}
        className="absolute bottom-0 inset-x-0 bg-neutral-900/70 backdrop-blur-md border-t border-white/5 py-3 md:py-3.5 z-20 hidden md:block"
      >
        <div className="content-container flex justify-between items-center">
          {[
            { label: "Custom Fitment Guaranteed" },
            { label: "Free Delivery Pan-India" },
            { label: "Professional Installation" },
            { label: "OEM-Grade Quality" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2.5 text-[10px] text-neutral-400 font-bold uppercase tracking-[0.18em]"
            >
              <span className="w-1 h-1 rounded-full bg-brand shadow-[0_0_6px_rgba(201,28,28,0.5)]" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

export default Hero

