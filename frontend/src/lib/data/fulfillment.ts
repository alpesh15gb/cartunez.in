"use server"

import { commerceClient } from "@lib/config"
import type * as HttpTypes from "@lib/commerce/medusa-v1/types"
import { getAuthHeaders, getCacheOptions } from "./cookies"

export const listCartShippingMethods = async (cartId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return commerceClient
    .fetch<HttpTypes.StoreShippingOptionListResponse>(
      `/store/shipping-options/${cartId}`,
      {
        method: "GET",
        headers,
      }
    )
    .then(({ shipping_options }) => shipping_options)
}

export const calculatePriceForShippingOption = async (
  optionId: string,
  cartId: string,
  data?: Record<string, unknown>
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("fulfillment")),
  }

  const body = { cart_id: cartId, data }

  if (data) {
    body.data = data
  }

  return commerceClient
    .fetch<{ shipping_option: HttpTypes.StoreCartShippingOption }>(
      `/store/shipping-options/${optionId}/calculate`,
      {
        method: "POST",
        body,
        headers,
        next,
      }
    )
    .then(({ shipping_option }) => shipping_option)
}
