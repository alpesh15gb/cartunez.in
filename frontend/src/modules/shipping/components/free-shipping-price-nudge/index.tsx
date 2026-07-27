import type { StoreCart, StoreCartShippingOption } from "@lib/commerce/medusa-v1/types"

/**
 * Medusa v1 shipping options do not expose the v2 price-rule graph that the
 * starter's progress nudge consumed. Keep the component boundary so callers
 * remain stable, but do not fabricate a free-shipping threshold.
 */
export default function ShippingPriceNudge(_props: {
  variant?: "popup" | "inline"
  cart: StoreCart
  shippingOptions: StoreCartShippingOption[]
}) {
  return null
}
