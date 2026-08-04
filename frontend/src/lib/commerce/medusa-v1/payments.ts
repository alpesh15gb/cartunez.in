import { request } from "./http-client"
import type { StoreCart } from "./types"

// Medusa v1 has no `/store/payment-providers` route — payment providers are
// exposed on the region (`GET /store/regions/:id` → `region.payment_providers`).
// See `@lib/data/payment` for the live implementation.
export const createPaymentSessionsV1 = (cartId: string, headers?: HeadersInit) => request<{ cart: StoreCart }>("create payment sessions", `/store/carts/${encodeURIComponent(cartId)}/payment-sessions`, { method: "POST", headers, cache: "no-store" })
export const selectPaymentSessionV1 = (cartId: string, providerId: string, headers?: HeadersInit) => request<{ cart: StoreCart }>("select payment session", `/store/carts/${encodeURIComponent(cartId)}/payment-session`, { method: "POST", body: { provider_id: providerId }, headers, cache: "no-store" })
