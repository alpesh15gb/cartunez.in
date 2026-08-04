#!/usr/bin/env node

const baseUrl = (process.env.MEDUSA_SMOKE_URL || "http://localhost:9000").replace(/\/$/, "")
const parsed = new URL(baseUrl)
const looksProduction = parsed.protocol === "https:" && !["localhost", "127.0.0.1"].includes(parsed.hostname)
if (looksProduction && process.env.ALLOW_PRODUCTION_SMOKE !== "true") {
  console.error("REFUSED: set ALLOW_PRODUCTION_SMOKE=true only for an explicitly approved production-safe run.")
  process.exit(2)
}

const call = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    signal: AbortSignal.timeout(10_000),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} returned HTTP ${response.status}`)
  return payload
}

let cartId
try {
  // /health is served by the project's custom API route. If it 404s the
  // docker healthcheck never passes and the stack deadlocks, so assert it.
  await call("/health")
  console.log("PASS /health custom route reachable")
  await call("/store/regions?limit=1")
  console.log("PASS Store API reachable")
  const { regions = [] } = await call("/store/regions?limit=1")
  if (!regions[0]?.id) throw new Error("No region is available")
  console.log("PASS region selected")
  const { products = [] } = await call(`/store/products?limit=20&region_id=${encodeURIComponent(regions[0].id)}`)
  const variant = products.flatMap((product) => product.variants || []).find((candidate) => candidate.id && (!candidate.manage_inventory || candidate.allow_backorder || candidate.inventory_quantity > 1))
  if (!variant) throw new Error("No safely purchasable variant is available")
  console.log("PASS purchasable product variant selected")
  const created = await call("/store/carts", { method: "POST", body: JSON.stringify({ region_id: regions[0].id }) })
  cartId = created.cart?.id
  if (!cartId) throw new Error("Cart creation returned no ID")
  console.log("PASS cart created")
  const added = await call(`/store/carts/${cartId}/line-items`, { method: "POST", body: JSON.stringify({ variant_id: variant.id, quantity: 1 }) })
  const lineId = added.cart?.items?.[0]?.id
  if (!lineId) throw new Error("Line item creation returned no ID")
  console.log("PASS line item added")
  await call(`/store/carts/${cartId}`)
  console.log("PASS cart retrieved")
  await call(`/store/carts/${cartId}/line-items/${lineId}`, { method: "POST", body: JSON.stringify({ quantity: 2 }) })
  console.log("PASS line item updated")
  await call(`/store/carts/${cartId}/line-items/${lineId}`, { method: "DELETE" })
  console.log("PASS line item removed")
  if (process.env.MEDUSA_TEST_EMAIL && process.env.MEDUSA_TEST_PASSWORD) {
    await call("/store/auth/token", { method: "POST", body: JSON.stringify({ email: process.env.MEDUSA_TEST_EMAIL, password: process.env.MEDUSA_TEST_PASSWORD }) })
    console.log("PASS optional customer authentication")
  } else console.log("SKIP customer authentication (test credentials not supplied)")
  console.log("SKIP cart completion (smoke harness never completes orders)")
} catch (error) {
  console.error(`FAIL ${error instanceof Error ? error.message : "unknown smoke error"}`)
  process.exit(1)
}
