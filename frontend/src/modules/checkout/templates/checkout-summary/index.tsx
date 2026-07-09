import { Heading } from "@modules/common/components/ui"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"

const CheckoutSummary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  return (
    <div className="sticky top-0 flex flex-col-reverse small:flex-col gap-y-6 py-8 small:py-0">
      <div className="w-full bg-white rounded-[var(--radius-lg)] border border-gray-200 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]">
        <Divider className="my-4 small:hidden" />
        <Heading
          level="h2"
          className="flex flex-row text-lg font-display font-bold text-gray-900 tracking-tight items-baseline"
        >
          In your Cart
        </Heading>
        <Divider className="my-4" />
        <CartTotals totals={cart} />
        <div className="my-4">
          <ItemsPreviewTemplate cart={cart} />
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <DiscountCode cart={cart} />
        </div>
      </div>
    </div>
  )
}

export default CheckoutSummary