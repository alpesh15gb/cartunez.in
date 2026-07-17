import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

export default async function ProductPreview({
  product,
  isFeatured,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({ product })
  const hasMultipleVariants = (product.variants?.length ?? 0) > 1
  const isOnSale = cheapestPrice?.price_type === "sale"

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group relative flex h-full min-h-[360px] flex-col overflow-hidden rounded-[var(--radius-md)] border border-gray-200 bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-brand/20 hover:shadow-[var(--shadow-card-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
      data-testid="product-link"
    >
      {/* ─── Image Container - 4:5 cinematic ─────────────────────── */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-50 img-zoom-container">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          productTitle={product.title}
          size="full"
          isFeatured={isFeatured}
          className="h-full w-full rounded-none border-none bg-transparent p-0 shadow-none"
        />

        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Discount Badge - top left */}
        {isOnSale && cheapestPrice?.percentage_diff && (
          <div
            className="absolute left-3 top-3 z-10 rounded-full bg-gradient-to-r from-brand to-brand-dark px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-brand/30"
            data-testid="discount-badge"
          >
            -{cheapestPrice.percentage_diff}%
          </div>
        )}

        {/* Stock Indicator */}
        {!isOnSale && (
          <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-emerald-700 shadow-sm ring-1 ring-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />
            In stock
          </div>
        )}

        {/* Quick Add to Cart Bar (bottom of image) */}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
          <span className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-900 shadow-sm transition-colors duration-200 group-hover:bg-brand group-hover:text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            View Details
          </span>
        </div>
      </div>

      {/* ─── Info Section ────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col justify-between gap-2.5 p-4 sm:p-5">
        <div className="space-y-1.5">
          {/* Brand Eyebrow */}
          <div className="flex items-center justify-between">
            <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-brand font-display">
              {((product.metadata || {}).brand as string) || "Cartunez"}
            </span>
            {/* Rating */}
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={star <= 4 ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="w-2.5 h-2.5 text-yellow-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z"
                  />
                </svg>
              ))}
              <span className="text-[9px] text-gray-400 ml-1 font-medium">(4.0)</span>
            </div>
          </div>

          {/* Product Title */}
          <h3
            className="line-clamp-2 min-h-[38px] text-sm font-bold leading-snug text-gray-900 transition-colors duration-200 group-hover:text-brand"
            data-testid="product-title"
          >
            {product.title}
          </h3>

          {/* Variant count indicator */}
          {hasMultipleVariants && (
            <p className="text-[10px] text-gray-400 font-medium">
              {product.variants?.length} options available
            </p>
          )}
        </div>

        {/* Price Footer */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col">
              {hasMultipleVariants && cheapestPrice && (
                <span className="mb-0.5 text-[8px] font-semibold uppercase tracking-wider text-gray-400 font-display">
                  From
                </span>
              )}
              {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
            </div>

            {/* Fitment Badge */}
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest text-gray-500 ring-1 ring-gray-200 font-display">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Fitment
            </span>
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
