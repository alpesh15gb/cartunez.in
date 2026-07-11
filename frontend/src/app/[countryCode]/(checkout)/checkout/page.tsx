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
      {/* Premium Progress Indicator */}
      <div className="mb-8 small:mb-12">
        <div className="flex items-center justify-center gap-2 small:gap-4">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-2 small:gap-4">
              <div className="flex items-center gap-2">
                <div className="relative flex h-9 w-9 small:h-10 small:w-10 items-center justify-center rounded-full bg-brand text-white text-xs small:text-sm font-bold shadow-sm shadow-brand/20">
                  <span className="relative z-10">{index + 1}</span>
                  {/* Active ring decoration */}
                  {index === 0 && (
                    <span className="absolute inset-[-2px] rounded-full border-2 border-brand/30 animate-pulse-soft" />
                  )}
                </div>
                <span className="hidden small:block text-xs font-bold uppercase tracking-[0.12em] text-gray-900">
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-px w-8 small:w-16 ${index === 0 ? "bg-gradient-to-r from-brand to-gray-200" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
        {/* Mobile step indicator */}
        <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mt-3 small:hidden">
          Step 1 of 4 &middot; Shipping Information
        </p>
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
