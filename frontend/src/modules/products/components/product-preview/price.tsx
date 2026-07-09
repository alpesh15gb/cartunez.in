import { VariantPrice } from "types/global"

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  const isOnSale = price.price_type === "sale"
  const savingsPercent = price.percentage_diff
    ? Number(price.percentage_diff)
    : 0

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <div className="flex items-baseline gap-x-1.5">
        {isOnSale && (
          <span
            className="text-xs font-medium text-gray-400 line-through"
            data-testid="original-price"
          >
            {price.original_price}
          </span>
        )}
        <span
          className={"text-base font-black tracking-tight " +
            (isOnSale ? "text-brand" : "text-gray-900")}
          data-testid="price"
        >
          {price.calculated_price}
        </span>
      </div>

      {isOnSale && savingsPercent > 0 && (
        <span
          className="inline-flex items-center rounded-lg bg-brand/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand ring-1 ring-brand/20"
          data-testid="savings-badge"
        >
          Save {savingsPercent}%
        </span>
      )}
    </div>
  )
}
