import { Button } from "@modules/common/components/ui"
import { useMemo } from "react"

import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Package, Eye } from "lucide-react"

type OrderCardProps = {
  order: HttpTypes.StoreOrder
}

const OrderCard = ({ order }: OrderCardProps) => {
  const numberOfLines = useMemo(() => {
    return (
      order.items?.reduce((acc, item) => {
        return acc + item.quantity
      }, 0) ?? 0
    )
  }, [order])

  const numberOfProducts = useMemo(() => {
    return order.items?.length ?? 0
  }, [order])

  return (
    <div className="bg-white rounded-[var(--radius-lg)] border border-gray-200 p-5 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] transition-all duration-300" data-testid="order-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Package size={18} className="text-gray-500" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">
              #<span data-testid="order-display-id">{order.display_id}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <span data-testid="order-created-at">
                {new Date(order.created_at).toDateString()}
              </span>
              <span className="text-gray-300">|</span>
              <span data-testid="order-amount">
                {convertToLocale({
                  amount: order.total,
                  currency_code: order.currency_code,
                })}
              </span>
              <span className="text-gray-300">|</span>
              <span>{`${numberOfLines} ${
                numberOfLines > 1 ? "items" : "item"
              }`}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {order.items?.slice(0, 3).map((i) => {
          return (
            <div
              key={i.id}
              className="flex flex-col gap-y-1.5 p-2 rounded-[var(--radius-sm)] bg-gray-50/50"
              data-testid="order-item"
            >
              <Thumbnail thumbnail={i.thumbnail} images={[]} size="full" />
              <div className="flex items-center text-xs text-gray-600">
                <span
                  className="font-semibold text-gray-900 truncate"
                  data-testid="item-title"
                >
                  {i.title}
                </span>
                <span className="ml-1 text-gray-400">x</span>
                <span className="text-gray-500" data-testid="item-quantity">{i.quantity}</span>
              </div>
            </div>
          )
        })}
        {numberOfProducts > 4 && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-[var(--radius-sm)]">
            <span className="text-sm font-semibold text-gray-500">
              + {numberOfLines - 4}
            </span>
            <span className="text-xs text-gray-400">more</span>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
          <Button
            data-testid="order-details-link"
            variant="secondary"
            className="rounded-[var(--radius-sm)] text-sm font-semibold"
          >
            <span className="flex items-center gap-1.5">
              <Eye size={14} />
              See details
            </span>
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderCard