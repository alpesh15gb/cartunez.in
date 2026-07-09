import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
  alternates: { canonical: `${getBaseURL()}/checkout` },
}

const steps = ["Shipping", "Delivery", "Payment", "Review"]

export default async function Checkout() {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()

  return (
    <div className="content-container py-8 small:py-12">
      {/* Progress indicator */}
      <div className="mb-8 small:mb-12">
        <div className="flex items-center justify-center gap-2 small:gap-4">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-2 small:gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 small:h-10 small:w-10 items-center justify-center rounded-full bg-brand text-white text-xs small:text-sm font-bold">
                  {index + 1}
                </div>
                <span className="hidden small:block text-sm font-medium text-gray-900">
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="h-px w-8 small:w-16 bg-gray-200" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 small:grid-cols-[1fr_380px] gap-8 small:gap-16">
        <PaymentWrapper cart={cart}>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <CheckoutForm cart={cart} customer={customer} />
          </div>
        </PaymentWrapper>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-premium h-fit small:sticky small:top-24">
          <CheckoutSummary cart={cart} />
        </div>
      </div>
    </div>
  )
}
