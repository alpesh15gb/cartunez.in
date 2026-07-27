import { request } from "./http-client"
import type { PaymentProvider, StoreCart } from "./types"
export const listPaymentProvidersV1 = (regionId: string) => request<{ payment_providers: PaymentProvider[] }>("list payment providers", "/store/payment-providers", { query: { region_id: regionId } })
export const createPaymentSessionsV1 = (cartId: string, headers?: HeadersInit) => request<{ cart: StoreCart }>("create payment sessions", `/store/carts/${encodeURIComponent(cartId)}/payment-sessions`, { method: "POST", headers, cache: "no-store" })
export const selectPaymentSessionV1 = (cartId: string, providerId: string, headers?: HeadersInit) => request<{ cart: StoreCart }>("select payment session", `/store/carts/${encodeURIComponent(cartId)}/payment-session`, { method: "POST", body: { provider_id: providerId }, headers, cache: "no-store" })

