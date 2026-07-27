"use server"

import { CommerceApiError } from "@lib/commerce/medusa-v1"
import type * as HttpTypes from "@lib/commerce/medusa-v1/types"
import { commerceClient } from "@lib/config"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheTag,
  getCartId,
  removeAuthToken,
  setAuthToken,
} from "./cookies"

export type CustomerAuthState =
  | { state: "error"; error: string }
  | { state: "verification_required"; email: string }
  | { state: "success" }
  | null

const userMessage = (error: unknown) =>
  error instanceof CommerceApiError ? error.message : "The customer request could not be completed."

async function refreshCustomerCache() {
  revalidateTag(await getCacheTag("customers"))
}

export async function retrieveCustomer(): Promise<HttpTypes.StoreCustomer | null> {
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) return null
  try {
    return (await commerceClient.fetch<{ customer: HttpTypes.StoreCustomer }>("/store/customers/me", {
      headers,
      cache: "no-store",
    })).customer
  } catch (error) {
    if (error instanceof CommerceApiError && error.authenticationExpired) await removeAuthToken()
    return null
  }
}

export async function updateCustomer(body: HttpTypes.StoreUpdateCustomer) {
  const response = await commerceClient.fetch<{ customer: HttpTypes.StoreCustomer }>("/store/customers/me", {
    method: "POST",
    body,
    headers: await getAuthHeaders(),
    cache: "no-store",
  })
  await refreshCustomerCache()
  return response.customer
}

export async function signup(_state: unknown, formData: FormData): Promise<CustomerAuthState> {
  const input = {
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    first_name: String(formData.get("first_name") || ""),
    last_name: String(formData.get("last_name") || ""),
    phone: String(formData.get("phone") || ""),
  }
  try {
    await commerceClient.fetch<{ customer: HttpTypes.StoreCustomer }>("/store/customers", {
      method: "POST", body: input, cache: "no-store",
    })
    return completeLogin(input.email, input.password)
  } catch (error) {
    return { state: "error", error: userMessage(error) }
  }
}

export async function login(_state: unknown, formData: FormData): Promise<CustomerAuthState> {
  return completeLogin(String(formData.get("email") || ""), String(formData.get("password") || ""))
}

async function completeLogin(email: string, password: string): Promise<CustomerAuthState> {
  try {
    const { access_token } = await commerceClient.fetch<{ access_token: string }>("/store/auth/token", {
      method: "POST", body: { email, password }, cache: "no-store",
    })
    if (!access_token) return { state: "error", error: "The commerce service did not return a customer session." }
    await setAuthToken(access_token)
    await refreshCustomerCache()
    // The existing anonymous cart ID is intentionally retained. Medusa remains
    // authoritative and it is re-fetched with the customer token on the next request.
    return { state: "success" }
  } catch (error) {
    return { state: "error", error: userMessage(error) }
  }
}

export async function confirmEmailVerification(_token?: string): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: "Email verification is not enabled by the Medusa v1 customer-auth contract." }
}

export async function signout(countryCode: string) {
  // JWT auth is stateless in Medusa v1; deleting the storefront's HTTP-only
  // token ends the local session. No browser storage is used.
  await removeAuthToken()
  await refreshCustomerCache()
  revalidateTag(await getCacheTag("carts"))
  redirect(`/${countryCode}/account`)
}

export async function transferCart() {
  // Medusa v1 has no v2 transfer-cart endpoint. Preserve the anonymous cart ID
  // and retrieve it with the authenticated request instead of discarding it.
  return Boolean(await getCartId())
}

function addressFrom(formData: FormData): HttpTypes.StoreUpdateCustomerAddress {
  return {
    first_name: String(formData.get("first_name") || ""),
    last_name: String(formData.get("last_name") || ""),
    company: String(formData.get("company") || ""),
    address_1: String(formData.get("address_1") || ""),
    address_2: String(formData.get("address_2") || ""),
    city: String(formData.get("city") || ""),
    postal_code: String(formData.get("postal_code") || ""),
    province: String(formData.get("province") || ""),
    country_code: String(formData.get("country_code") || "").toLowerCase(),
    phone: String(formData.get("phone") || ""),
  }
}

export async function addCustomerAddress(currentState: Record<string, unknown>, formData: FormData) {
  try {
    await commerceClient.fetch<{ customer: HttpTypes.StoreCustomer }>("/store/customers/me/addresses", {
      method: "POST",
      body: {
        ...addressFrom(formData),
        is_default_billing: Boolean(currentState.isDefaultBilling),
        is_default_shipping: Boolean(currentState.isDefaultShipping),
      },
      headers: await getAuthHeaders(), cache: "no-store",
    })
    await refreshCustomerCache()
    return { success: true, error: null }
  } catch (error) { return { success: false, error: userMessage(error) } }
}

export async function deleteCustomerAddress(addressId: string): Promise<void> {
  await commerceClient.fetch(`/store/customers/me/addresses/${addressId}`, {
    method: "DELETE", headers: await getAuthHeaders(), cache: "no-store",
  })
  await refreshCustomerCache()
}

export async function updateCustomerAddress(currentState: Record<string, unknown>, formData: FormData) {
  const addressId = String(currentState.addressId || formData.get("addressId") || "")
  if (!addressId) return { success: false, error: "Address ID is required" }
  try {
    await commerceClient.fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me/addresses/${addressId}`, {
      method: "POST", body: addressFrom(formData), headers: await getAuthHeaders(), cache: "no-store",
    })
    await refreshCustomerCache()
    return { success: true, error: null }
  } catch (error) { return { success: false, error: userMessage(error) } }
}
