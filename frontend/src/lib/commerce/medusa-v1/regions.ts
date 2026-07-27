import { request } from "./http-client"
import type { StoreRegion } from "./types"

export const listRegionsV1 = (options?: { signal?: AbortSignal }) =>
  request<{ regions: StoreRegion[] }>("list regions", "/store/regions", { signal: options?.signal })

export const retrieveRegionV1 = (id: string, options?: { signal?: AbortSignal }) =>
  request<{ region: StoreRegion }>("retrieve region", `/store/regions/${encodeURIComponent(id)}`, { signal: options?.signal })

