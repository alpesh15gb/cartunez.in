import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { AlertCircle } from "lucide-react"

function CheckoutUnavailable({ message }: { message: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 p-6 text-amber-950">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <AlertCircle size={18} />
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em]">
            Checkout needs attention
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-900/80">{message}</p>
          <LocalizedClientLink
            href="/cart"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] bg-amber-900 px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-amber-950"
          >
            Return to cart
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return <CheckoutUnavailable message="Your cart could not be loaded. Please return to your cart and try again." />
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  if (!shippingMethods || !paymentMethods) {
    return <CheckoutUnavailable message="Shipping or payment options are temporarily unavailable for this cart. No order has been placed." />
  }

  return (
    <div className="w-full space-y-6">
      <Addresses cart={cart} customer={customer} />
      <Shipping cart={cart} availableShippingMethods={shippingMethods} />
      <Payment cart={cart} availablePaymentMethods={paymentMethods} />
      <Review cart={cart} />
    </div>
  )
}
