"use client"

import { loadStripe } from "@stripe/stripe-js"
import React from "react"
import StripeWrapper from "./stripe-wrapper"
import type * as HttpTypes from "@lib/commerce/medusa-v1/types"
import { isStripeLike } from "@lib/constants"

type PaymentWrapperProps = {
  cart: HttpTypes.StoreCart
  children: React.ReactNode
}

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY
const stripePromise = stripeKey
  ? loadStripe(stripeKey)
  : null

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ cart, children }) => {
  const paymentSession = cart.payment_session || cart.payment_sessions?.find((s) => s.is_selected)

  if (
    isStripeLike(paymentSession?.provider_id) &&
    paymentSession &&
    stripePromise
  ) {
    return (
      <StripeWrapper
        paymentSession={paymentSession}
        stripeKey={stripeKey}
        stripePromise={stripePromise}
      >
        {children}
      </StripeWrapper>
    )
  }

  return <div>{children}</div>
}

export default PaymentWrapper
