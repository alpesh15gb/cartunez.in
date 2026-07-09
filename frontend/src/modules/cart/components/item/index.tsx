"use client"

import { Text } from "@modules/common/components/ui"
import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"
import { Minus, Plus } from "lucide-react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
}

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  const maxQtyFromInventory = 10
  const maxQuantity = item.variant?.manage_inventory ? 10 : maxQtyFromInventory

  if (type === "preview") {
    return (
      <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-b-0 group" data-testid="product-row">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className="w-14 h-14 shrink-0 rounded-[var(--radius-sm)] overflow-hidden bg-gray-50"
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            size="square"
          />
        </LocalizedClientLink>
        <div className="flex-1 min-w-0">
          <Text
            className="text-sm font-medium text-gray-900 truncate"
            data-testid="product-title"
          >
            {item.product_title}
          </Text>
          <LineItemOptions variant={item.variant} data-testid="product-variant" />
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400 font-medium">{item.quantity}x</span>
            <LineItemUnitPrice item={item} style="tight" currencyCode={currencyCode} />
          </div>
        </div>
        <div className="text-right shrink-0">
          <LineItemPrice item={item} style="tight" currencyCode={currencyCode} />
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5 rounded-[var(--radius-lg)] border border-gray-200 bg-white hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.12)] transition-all duration-300 group"
      data-testid="product-row"
    >
      {/* Thumbnail */}
      <LocalizedClientLink
        href={`/products/${item.product_handle}`}
        className="w-full sm:w-24 h-24 shrink-0 rounded-[var(--radius-md)] overflow-hidden bg-gray-100"
      >
        <Thumbnail
          thumbnail={item.thumbnail}
          images={item.variant?.product?.images}
          size="square"
        />
      </LocalizedClientLink>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 min-w-0">
          <LocalizedClientLink href={`/products/${item.product_handle}`}>
            <Text
              className="text-base font-semibold text-gray-900 hover:text-[var(--color-brand)] transition-colors truncate"
              data-testid="product-title"
            >
              {item.product_title}
            </Text>
          </LocalizedClientLink>
          <LineItemOptions variant={item.variant} data-testid="product-variant" />
          
          {/* Unit price */}
          <div className="mt-1.5">
            <LineItemUnitPrice item={item} style="tight" currencyCode={currencyCode} />
          </div>
        </div>

        {/* Quantity & Remove */}
        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2">
          {/* Quantity selector - premium style */}
          <div className="flex items-center border border-gray-200 rounded-[var(--radius-sm)] overflow-hidden bg-gray-50/50">
            <button
              className="flex items-center justify-center w-9 h-9 text-gray-500 hover:text-gray-900 hover:bg-white transition-colors disabled:opacity-30 active:bg-gray-100"
              onClick={() => changeQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1 || updating}
              data-testid="product-decrement-button"
            >
              <Minus size={14} strokeWidth={2} />
            </button>
            <span className="flex items-center justify-center w-10 h-9 text-sm font-semibold text-gray-900 border-x border-gray-200 bg-white">
              {updating ? (
                <Spinner />
              ) : (
                item.quantity
              )}
            </span>
            <button
              className="flex items-center justify-center w-9 h-9 text-gray-500 hover:text-gray-900 hover:bg-white transition-colors disabled:opacity-30 active:bg-gray-100"
              onClick={() => changeQuantity(item.quantity + 1)}
              disabled={item.quantity >= maxQuantity || updating}
              data-testid="product-increment-button"
            >
              <Plus size={14} strokeWidth={2} />
            </button>
          </div>

          {/* Remove button */}
          <DeleteButton id={item.id} data-testid="product-delete-button" className="!text-gray-300 hover:!text-rose-500 transition-colors" />
        </div>
      </div>

      {/* Total price */}
      <div className="flex sm:flex-col items-center justify-between sm:justify-start sm:items-end sm:min-w-[100px] pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
        <Text className="text-xs text-gray-400 sm:hidden font-medium">Total</Text>
        <LineItemPrice item={item} style="tight" currencyCode={currencyCode} />
      </div>

      {error && (
        <div className="col-span-full text-sm text-rose-500 mt-1 bg-rose-50/50 px-3 py-2 rounded-[var(--radius-sm)]" data-testid="product-error-message">
          {error}
        </div>
      )}
    </div>
  )
}

export default Item
