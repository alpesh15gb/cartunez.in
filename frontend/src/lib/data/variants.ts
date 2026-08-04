"use server"

import { commerceClient } from "@lib/config"
import type * as HttpTypes from "@lib/commerce/medusa-v1/types"

import { getAuthHeaders, getCacheOptions } from "./cookies"

export const retrieveVariant = async (
  variant_id: string
): Promise<HttpTypes.StoreProductVariant | null> => {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) return null

  const headers = {
    ...authHeaders,
  }

  const next = {
    ...(await getCacheOptions("variants")),
  }

  // Medusa v1 exposes variants at /store/variants/:id (the
  // /store/product-variants/:id path is v2-only and 404s on v1).
  return await commerceClient
    .fetch<{ variant: HttpTypes.StoreProductVariant }>(
      `/store/variants/${variant_id}`,
      {
        method: "GET",
        query: { expand: "images,product" },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ variant }) => variant)
    .catch(() => null)
}
