import { Truck, ShieldCheck, RefreshCcw, CreditCard } from "lucide-react"

const items = [
  {
    icon: Truck,
    title: "Free Pan-India Delivery",
    sub: "On every order, no minimums",
  },
  {
    icon: RefreshCcw,
    title: "7-Day Easy Returns",
    sub: "Hassle-free exchange policy",
  },
  {
    icon: ShieldCheck,
    title: "Fitment Guaranteed",
    sub: "Verified for your car before it ships",
  },
  {
    icon: CreditCard,
    title: "EMI & COD Available",
    sub: "No-cost EMI on all major cards",
  },
]

/**
 * Value-proposition bar rendered directly below the hero.
 * The hero's old badge strip was desktop-only; this is visible on every
 * viewport and gives mobile visitors the same trust signals Shopify
 * stores place above the fold.
 */
export default function TrustBar() {
  return (
    <section
      className="border-b border-gray-100 bg-white"
      aria-label="Why shop with Cartunez"
    >
      <div className="content-container">
        <div className="grid grid-cols-2 gap-2.5 py-4 sm:gap-3 sm:py-5 lg:grid-cols-4 lg:gap-4 lg:py-6">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-[var(--radius-md)] bg-gray-50/80 px-3.5 py-3.5 sm:px-4 lg:bg-transparent lg:px-0"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-brand/5">
                  <Icon size={17} className="text-brand" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase leading-tight tracking-wide text-gray-900 line-clamp-2 sm:text-xs">
                    {item.title}
                  </p>
                  <p className="mt-0.5 hidden text-[11px] font-medium text-gray-500 sm:block">
                    {item.sub}
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
