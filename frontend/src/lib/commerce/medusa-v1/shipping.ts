import { request } from "./http-client"
import type { StoreCart, StoreShippingOptionListResponse } from "./types"
export const listShippingOptionsV1 = (cartId: string, headers?: HeadersInit) => request<StoreShippingOptionListResponse>("list shipping options", `/store/shipping-options/${encodeURIComponent(cartId)}`, { headers, cache: "no-store" })
export const addShippingMethodV1 = (cartId: string, optionId: string, headers?: HeadersInit) => request<{ cart: StoreCart }>("add shipping method", `/store/carts/${encodeURIComponent(cartId)}/shipping-methods`, { method: "POST", body: { option_id: optionId }, headers, cache: "no-store" })

