import { request } from "./http-client"
import type { StoreCollection, StoreCollectionListResponse } from "./types"
export const listCollectionsV1 = (query: Record<string, unknown> = {}) => request<StoreCollectionListResponse>("list collections", "/store/collections", { query })
export const retrieveCollectionV1 = (id: string) => request<{ collection: StoreCollection }>("retrieve collection", `/store/collections/${encodeURIComponent(id)}`)

