/* Brand strip — a lightweight CSS marquee of the real brands stocked in the
   catalog (no images, no network calls, pure typography). The `marquee`
   keyframes live in styles/globals.css. */

const BRANDS = [
  "Onkyo",
  "Nakamichi",
  "Pioneer",
  "Blaupunkt",
  "Morel",
  "Infinity",
  "Yuemi",
  "Glider",
  "Mtrax",
  "Nippon",
  "SoundTech",
  "CARDi",
  "Axxlink",
  "Toro",
]

const Row = () => (
  <div className="flex shrink-0 items-center gap-14 pr-14">
    {BRANDS.map((brand) => (
      <span
        key={brand}
        className="whitespace-nowrap font-display text-lg font-black uppercase tracking-[0.18em] text-gray-300 transition-colors duration-300 hover:text-brand sm:text-xl"
      >
        {brand}
      </span>
    ))}
  </div>
)

export default function BrandStrip() {
  return (
    <section
      className="overflow-hidden border-y border-gray-100 bg-white py-10 sm:py-12"
      aria-label="Brands we carry"
    >
      <div className="mb-6 text-center">
        <span className="eyebrow">Trusted Brands</span>
      </div>
      <div className="relative">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />
        {/* Marquee — two identical rows translate -50% for a seamless loop */}
        <div
          className="flex w-max"
          style={{
            animation: "marquee 38s linear infinite",
            willChange: "transform",
          }}
        >
          <Row />
          <Row />
        </div>
      </div>
    </section>
  )
}
