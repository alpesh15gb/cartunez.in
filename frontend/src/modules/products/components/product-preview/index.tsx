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
      className="group flex flex-col h-full bg-white border border-gray-200
                 hover:border-brand/30 transition-all duration-400 overflow-hidden"
      data-testid="product-link"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 img-zoom-container">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          isFeatured={isFeatured}
          className="w-full h-full object-cover bg-transparent shadow-none border-none p-0 rounded-none"
        />
        {/* Quick-view label */}
        <div
          className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0
                      transition-transform duration-300 bg-brand text-white
                      text-[10px] font-bold uppercase tracking-widest
                      text-center py-2.5"
        >
          View Details →
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex-grow flex flex-col justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-brand uppercase tracking-widest block">
            {((product.metadata || {}).brand as string) || "Cartunez"}
          </span>
          <h3
            className="text-xs sm:text-sm font-bold text-gray-700 line-clamp-2 leading-snug
                       group-hover:text-gray-900 transition-colors duration-200"
            data-testid="product-title"
          >
            {product.title}
          </h3>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>{cheapestPrice && <PreviewPrice price={cheapestPrice} />}</div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider
                           group-hover:text-brand transition-colors duration-200">
            ₹
          </span>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
