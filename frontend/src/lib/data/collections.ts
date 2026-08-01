"use server"

import { commerceClient } from "@lib/config"
import type * as HttpTypes from "@lib/commerce/medusa-v1/types"
import { getCacheOptions } from "./cookies"

export const retrieveCollection = async (id: string) => {
  const next = {
    ...(await getCacheOptions("collections")),
  }

  return await commerceClient
    .fetch<{ collection: HttpTypes.StoreCollection }>(
      `/store/collections/${id}`,
      {
        next,
        cache: "force-cache",
      }
    )
    .then(({ collection }) => collection)
}

export const listCollections = async (
  queryParams: Record<string, string> = {}
): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> => {
  const next = {
    ...(await getCacheOptions("collections")),
  }

  // Medusa v1 store API rejects the v2-only `fields` query param
  const { fields: _fields, ...nativeQuery } = queryParams
  nativeQuery.limit = nativeQuery.limit || "100"
  nativeQuery.offset = nativeQuery.offset || "0"

  return await commerceClient
    .fetch<{ collections: HttpTypes.StoreCollection[]; count: number }>(
      "/store/collections",
      {
        query: nativeQuery,
        next,
        cache: "force-cache",
      }
    )
    .then(({ collections }) => ({ collections, count: collections.length }))
}

export const getCollectionByHandle = async (
  handle: string
): Promise<HttpTypes.StoreCollection | null> => {
  const next = {
    ...(await getCacheOptions("collections")),
  }

  return await commerceClient
    .fetch<HttpTypes.StoreCollectionListResponse>(`/store/collections`, {
      query: { "handle[]": handle },
      next,
      cache: "force-cache",
    })
    .then(({ collections }) => collections[0] || null)
}
