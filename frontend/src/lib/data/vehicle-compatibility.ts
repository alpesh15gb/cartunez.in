"use server"

// Server-side vehicle-fitment resolution.
//
// Flow:
//   1. Resolve make/model/year (by ID or name) against the FastAPI catalog
//      -> year_id + variant_ids (deterministic UUIDs shared with Medusa).
//   2. Ask Medusa for the products linked to that year, plus the products
//      with NO compatibility links (universal / fits-all).
// Returns the union, which the store filter uses to show only products
// that fit the selected vehicle.

const API_URL = process.env.FASTAPI_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "https://cartunez.in"
const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://cartunez.in"

export interface VehicleResolveParams {
  make?: string
  model?: string
  year?: string
  make_id?: string
  model_id?: string
  year_id?: string
}

export interface VehicleResolution {
  found: boolean
  make?: { id: string; name: string; slug: string } | null
  model?: { id: string; name: string; slug: string } | null
  year?: { id: string; year: number } | null
  year_id?: string
  variant_ids?: string[]
}

async function apiFetch<T>(url: string, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      cache: "no-store",
    })
    if (!res.ok) {
      throw new Error(`API ${res.status}: ${res.statusText}`)
    }
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

export async function resolveVehicle(
  params: VehicleResolveParams
): Promise<VehicleResolution> {
  const q = new URLSearchParams()
  if (params.make) q.set("make", params.make)
  if (params.model) q.set("model", params.model)
  if (params.year) q.set("year", params.year)
  if (params.make_id) q.set("make_id", params.make_id)
  if (params.model_id) q.set("model_id", params.model_id)
  if (params.year_id) q.set("year_id", params.year_id)

  return apiFetch<VehicleResolution>(`${API_URL}/api/v1/vehicles/resolve?${q}`)
}

export interface VehicleProductIds {
  found: boolean
  product_ids: string[]
  universal_product_ids: string[]
}

/**
 * Resolve the vehicle and return the set of product IDs that fit it
 * (vehicle-specific links + universal products). Returns `found: false`
 * when the vehicle isn't in the catalog; throws on API errors so callers
 * can degrade gracefully.
 */
export async function getVehicleProductIds(
  params: VehicleResolveParams
): Promise<VehicleProductIds> {
  const resolution = await resolveVehicle(params)

  if (!resolution.found || !resolution.year_id) {
    return { found: false, product_ids: [], universal_product_ids: [] }
  }

  const medusa = await apiFetch<{
    products: { product_id: string }[]
    universal_product_ids?: string[]
  }>(`${MEDUSA_URL}/vehicle/products-by-year/${encodeURIComponent(resolution.year_id)}`)

  return {
    found: true,
    product_ids: (medusa.products || []).map((p) => p.product_id),
    universal_product_ids: medusa.universal_product_ids || [],
  }
}

export interface FitmentCheck {
  found: boolean
  specific: boolean
  universal: boolean
}

/**
 * Check whether a single product fits the selected vehicle.
 * Used by the product-page fitment checker.
 */
export async function checkProductFitment(
  productId: string,
  params: VehicleResolveParams
): Promise<FitmentCheck> {
  const resolution = await resolveVehicle(params)

  if (!resolution.found || !resolution.year_id) {
    return { found: false, specific: false, universal: false }
  }

  const medusa = await apiFetch<{
    products: { product_id: string }[]
    universal_product_ids?: string[]
  }>(`${MEDUSA_URL}/vehicle/products-by-year/${encodeURIComponent(resolution.year_id)}`)

  const specific = (medusa.products || []).some((p) => p.product_id === productId)
  const universal = (medusa.universal_product_ids || []).includes(productId)

  return { found: true, specific, universal }
}
