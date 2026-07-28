import { request } from "./http-client"
import type { StoreCart, StoreOrder, StoreUpdateCart } from "./types"
const cartPath = (id: string) => `/store/carts/${encodeURIComponent(id)}`
export const createCartV1 = (regionId: string, headers?: HeadersInit) => request<{ cart: StoreCart }>("create cart", "/store/carts", { method: "POST", body: { region_id: regionId }, headers, cache: "no-store" })
export const retrieveCartV1 = (id: string, headers?: HeadersInit) => request<{ cart: StoreCart }>("retrieve cart", cartPath(id), { headers, cache: "no-store" })
export const updateCartV1 = (id: string, body: StoreUpdateCart, headers?: HeadersInit) => request<{ cart: StoreCart }>("update cart", cartPath(id), { method: "POST", body, headers, cache: "no-store" })
export const addLineItemV1 = (id: string, variantId: string, quantity: number, headers?: HeadersInit) => request<{ cart: StoreCart }>("add line item", `${cartPath(id)}/line-items`, { method: "POST", body: { variant_id: variantId, quantity }, headers, cache: "no-store" })
export const updateLineItemV1 = (id: string, lineId: string, quantity: number, headers?: HeadersInit) => request<{ cart: StoreCart }>("update line item", `${cartPath(id)}/line-items/${encodeURIComponent(lineId)}`, { method: "POST", body: { quantity }, headers, cache: "no-store" })
export const removeLineItemV1 = (id: string, lineId: string, headers?: HeadersInit) => request<{ cart: StoreCart }>("remove line item", `${cartPath(id)}/line-items/${encodeURIComponent(lineId)}`, { method: "DELETE", headers, cache: "no-store" })
export const completeCartV1 = (id: string, headers?: HeadersInit) => request<{ type: "order"; data: StoreOrder } | { type: "cart"; data: StoreCart }>("complete cart", `${cartPath(id)}/complete`, { method: "POST", headers, cache: "no-store" })

