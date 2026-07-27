import { request } from "./http-client"
import type { StoreProduct, StoreProductListParams, StoreProductVariant } from "./types"

export interface ProductListResponse { products: StoreProduct[]; count: number; offset: number; limit: number }
export const listProductsV1 = (query: StoreProductListParams, headers?: HeadersInit) =>
  request<ProductListResponse>("list products", "/store/products", { query: query as Record<string, unknown>, headers })
export const retrieveProductV1 = (id: string, query: { region_id?: string } = {}, headers?: HeadersInit) =>
  request<{ product: StoreProduct }>("retrieve product", `/store/products/${encodeURIComponent(id)}`, { query, headers })

export function regionalVariantPrice(variant: StoreProductVariant) {
  if (!variant || typeof variant !== "object" || !("calculated_price" in variant)) return null
  const amount = variant.calculated_price
  if (typeof amount !== "number") return null
  const currencyCode = variant.prices?.find((price) => price.amount === amount)?.currency_code
  return currencyCode ? { amount, currency_code: currencyCode } : null
}
