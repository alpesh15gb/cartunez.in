"use client"

import { Button } from "@modules/common/components/ui"

import OrderCard from "../order-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { ShoppingBag } from "lucide-react"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  if (orders?.length) {
    return (
      <div className="flex flex-col gap-y-6 w-full">
        {orders.map((o) => (
          <div key={o.id}>
            <OrderCard order={o} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="w-full flex flex-col items-center gap-y-4 py-16"
      data-testid="no-orders-container"
    >
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
        <ShoppingBag size={36} className="text-gray-300" strokeWidth={1} />
      </div>
      <h2 className="text-xl font-bold text-gray-900">Nothing to see here</h2>
      <p className="text-sm text-gray-500">
        You don&apos;t have any orders yet, let us change that :)
      </p>
      <div className="mt-2">
        <LocalizedClientLink href="/" passHref>
          <Button
            data-testid="continue-shopping-button"
            className="rounded-[var(--radius-md)] shadow-sm hover:shadow-md transition-all duration-200"
          >
            Continue shopping
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderOverview