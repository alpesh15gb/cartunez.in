"use client"

import { Button, Heading } from "@modules/common/components/ui"

import CartTotals from "@modules/common/components/cart-totals"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { Truck, RotateCcw, Lock } from "lucide-react"

type SummaryProps = {
  cart: HttpTypes.StoreCart
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)

  return (
    <div className="flex flex-col gap-y-5">
      <Heading level="h2" className="text-lg font-display font-bold text-gray-900 tracking-tight">
        Order Summary
      </Heading>

      <CartTotals totals={cart} />

      <div className="h-px w-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />

      {/* Coupon code */}
      <div className="bg-gray-50/80 rounded-[var(--radius-md)] p-4">
        <DiscountCode cart={cart} />
      </div>

      <div className="h-px w-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />

      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
      >
        <Button
          variant="primary"
          size="large"
          className="w-full h-12 text-sm font-bold tracking-wider rounded-[var(--radius-md)] shadow-sm hover:shadow-md transition-all duration-200"
        >
          Proceed to Checkout
        </Button>
      </LocalizedClientLink>

      {/* Trust badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <Lock size={12} className="text-green-500" />
          <span>Secure checkout</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <Truck size={12} className="text-gray-400" />
          <span>Free shipping over Rs. 999</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <RotateCcw size={12} className="text-gray-400" />
          <span>Easy returns</span>
        </div>
      </div>
    </div>
  )
}

export default Summary
