import { clx } from "@modules/common/components/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="skeleton block h-12 w-44 rounded-xl" />
  }

  const isSale = selectedPrice.price_type === "sale"
  const savingsPct = selectedPrice.percentage_diff
    ? Number(selectedPrice.percentage_diff)
    : 0

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Price</span>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex items-baseline gap-2">
          {!variant && (
            <span className="text-sm font-semibold text-gray-400">From</span>
          )}
          <span
            className={clx(
              "text-3xl font-black tracking-tight text-gray-950",
              { "text-brand": isSale }
            )}
          >
            <span
              data-testid="product-price"
              data-value={selectedPrice.calculated_price_number}
            >
              {selectedPrice.calculated_price}
            </span>
          </span>
        </div>
        {isSale && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand ring-1 ring-brand/20">
            Save {savingsPct}%
          </span>
        )}
      </div>
      {isSale && (
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <span>Original price:</span>
          <span
            className="font-bold text-gray-400 line-through"
            data-testid="original-product-price"
            data-value={selectedPrice.original_price_number}
          >
            {selectedPrice.original_price}
          </span>
        </p>
      )}
      {!isSale && (
        <p className="text-xs text-gray-400 font-medium">
          Inclusive of all taxes &bull; Free shipping above ?999
        </p>
      )}
    </div>
  )
}
