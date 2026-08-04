"use server"

import { commerceClient } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import type * as HttpTypes from "@lib/commerce/medusa-v1/types"

export const listCartPaymentMethods = async (regionId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("payment_providers")),
  }

  // Medusa v1 has no /store/payment-providers route; providers are
  // exposed on the region, so fetch the region instead of a 404.
  return commerceClient
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${regionId}`, {
      method: "GET",
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ region }) =>
      (region?.payment_providers || []).sort((a, b) => {
        return a.id > b.id ? 1 : -1
      })
    )
}
