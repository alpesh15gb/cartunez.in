import { request } from "./http-client"
import type { StoreOrderListResponse, StoreOrderResponse } from "./types"
export const retrieveOrderV1 = (id: string, headers?: HeadersInit) => request<StoreOrderResponse>("retrieve order", `/store/orders/${encodeURIComponent(id)}`, { headers, query: { expand: "items,items.variant,items.variant.product,shipping_methods,payments" } })
export const listCustomerOrdersV1 = (headers: HeadersInit, limit = 10, offset = 0) => request<StoreOrderListResponse>("list customer orders", "/store/customers/me/orders", { headers, query: { limit, offset, order: "-created_at", expand: "items,items.variant,items.variant.product" } })

