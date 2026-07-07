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
    return <div className="skeleton block h-11 w-40 rounded-lg" />
  }

  return (
    <div className="flex flex-col gap-2 text-gray-900">
      <span className="text-label text-gray-500">Price</span>
      <div className="flex flex-wrap items-end gap-3">
        <span
          className={clx("text-price text-gray-950", {
            "text-brand": selectedPrice.price_type === "sale",
          })}
        >
          {!variant && <span className="mr-1 text-base font-semibold text-gray-500">From</span>}
          <span
            data-testid="product-price"
            data-value={selectedPrice.calculated_price_number}
          >
            {selectedPrice.calculated_price}
          </span>
        </span>
        {selectedPrice.price_type === "sale" && (
          <span className="mb-1 rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand">
            Save {selectedPrice.percentage_diff}%
          </span>
        )}
      </div>
      {selectedPrice.price_type === "sale" && (
        <p className="text-body-sm text-gray-500">
          Original: {" "}
          <span
            className="line-through"
            data-testid="original-product-price"
            data-value={selectedPrice.original_price_number}
          >
            {selectedPrice.original_price}
          </span>
        </p>
      )}
    </div>
  )
}
