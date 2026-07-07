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

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group flex h-full min-h-[360px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-premium-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
      data-testid="product-link"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          isFeatured={isFeatured}
          className="h-full w-full rounded-none border-none bg-transparent p-0 shadow-none"
        />
        <div className="absolute left-3 top-3 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-emerald-700 ring-1 ring-emerald-200">
          In stock
        </div>
        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-400 shadow-sm backdrop-blur transition-colors duration-200 hover:text-brand" aria-hidden="true">
          ♥
        </div>
        <div className="absolute inset-x-3 bottom-3 translate-y-3 rounded-full bg-gray-950 px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-white opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          Quick View
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between gap-4 p-4 sm:p-5">
        <div className="space-y-2">
          <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
            {((product.metadata || {}).brand as string) || "Cartunez"}
          </span>
          <h3
            className="line-clamp-2 min-h-[42px] text-sm font-bold leading-snug text-gray-900 transition-colors duration-200 group-hover:text-brand"
            data-testid="product-title"
          >
            {product.title}
          </h3>
        </div>

        <div className="mt-auto border-t border-gray-100 pt-4">
          <div className="flex items-end justify-between gap-3">
            <div>{cheapestPrice && <PreviewPrice price={cheapestPrice} />}</div>
            <span className="rounded-full bg-gray-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-gray-500 ring-1 ring-gray-200">
              Fitment
            </span>
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
