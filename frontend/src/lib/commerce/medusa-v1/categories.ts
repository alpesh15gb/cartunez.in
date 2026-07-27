import { request } from "./http-client"
import type { StoreProductCategory, StoreProductCategoryListResponse } from "./types"
export const listCategoriesV1 = (query: Record<string, unknown> = {}) => request<StoreProductCategoryListResponse>("list categories", "/store/product-categories", { query })
export const retrieveCategoryV1 = (id: string) => request<{ product_category: StoreProductCategory }>("retrieve category", `/store/product-categories/${encodeURIComponent(id)}`)

