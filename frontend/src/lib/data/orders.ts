"use server"

import { CommerceApiError } from "@lib/commerce/medusa-v1"
import { commerceClient } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import type * as HttpTypes from "@lib/commerce/medusa-v1/types"

export const retrieveOrder = async (id: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("orders")),
  }

  return commerceClient
    .fetch<HttpTypes.StoreOrderResponse>(`/store/orders/${id}`, {
      method: "GET",
      query: { expand: "items,items.variant,shipping_methods,payments" },
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ order }) => order)
    .catch((err) => medusaError(err))
}

export const listOrders = async (
  limit: number = 10,
  offset: number = 0,
  filters?: Record<string, unknown>
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("orders")),
  }

  return commerceClient
    .fetch<HttpTypes.StoreOrderListResponse>(`/store/customers/me/orders`, {
      method: "GET",
      query: {
        limit,
        offset,
        // Medusa v1 rejects an `order` param on this endpoint
        expand: "items,items.variant",
        ...filters,
      },
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ orders }) => orders)
    .catch((err) => {
      // Unauthenticated (guest on an account page): don't crash the server
      // render — the account layout routes guests to login.
      if (err instanceof CommerceApiError && err.status === 401) return []
      throw medusaError(err)
    })
}

export const createTransferRequest = async (
  state: {
    success: boolean
    error: string | null
    order: HttpTypes.StoreOrder | null
  },
  formData: FormData
): Promise<{
  success: boolean
  error: string | null
  order: HttpTypes.StoreOrder | null
}> => {
  const id = formData.get("order_id") as string

  if (!id) {
    return { success: false, error: "Order ID is required", order: null }
  }

  return {
    success: false,
    error: "Order transfer is not supported by the Medusa v1 Store API.",
    order: null,
  }
}

export const acceptTransferRequest = async (_id: string, _token: string) => {
  return { success: false, error: "Order transfer is not supported by the Medusa v1 Store API.", order: null }
}

export const declineTransferRequest = async (_id: string, _token: string) => {
  return { success: false, error: "Order transfer is not supported by the Medusa v1 Store API.", order: null }
}
