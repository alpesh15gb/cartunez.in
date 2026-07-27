const assert = require("node:assert/strict")
const { afterEach, test } = require("node:test")
const { CommerceApiError } = require("../../.commerce-test/errors.js")
const { request } = require("../../.commerce-test/http-client.js")
const { regionalVariantPrice } = require("../../.commerce-test/products.js")
const { addLineItemV1, completeCartV1, createCartV1, removeLineItemV1, retrieveCartV1, updateLineItemV1 } = require("../../.commerce-test/carts.js")
const { listRegionsV1 } = require("../../.commerce-test/regions.js")
const { loginCustomerV1, registerCustomerV1, retrieveCustomerV1 } = require("../../.commerce-test/customers.js")
const { createPaymentSessionsV1, selectPaymentSessionV1 } = require("../../.commerce-test/payments.js")

const originalFetch = global.fetch
afterEach(() => { global.fetch = originalFetch })
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } })

test("HTTP client returns native v1 JSON and includes credentials", async () => {
  let credentials
  global.fetch = async (_input, init) => { credentials = init.credentials; return json({ regions: [] }) }
  assert.deepEqual(await listRegionsV1(), { regions: [] })
  assert.equal(credentials, "include")
})

test("JSON authentication errors are normalized without backend-detail leakage", async () => {
  global.fetch = async () => json({ type: "unauthorized", message: "password hash service failed" }, 401, { "x-request-id": "req_1" })
  await assert.rejects(() => request("login customer", "/store/auth/token"), (error) => {
    assert.ok(error instanceof CommerceApiError); assert.equal(error.status, 401); assert.equal(error.kind, "authentication"); assert.equal(error.requestId, "req_1"); assert.equal(error.message.includes("hash"), false); return true
  })
})

test("non-JSON errors are normalized", async () => {
  global.fetch = async () => new Response("upstream exploded", { status: 502, headers: { "content-type": "text/plain" } })
  await assert.rejects(() => request("list products", "/store/products"), (error) => error instanceof CommerceApiError && error.kind === "server")
})

test("timeout and caller abort are distinct", async () => {
  global.fetch = async (_input, init) => new Promise((_resolve, reject) => {
    if (init.signal.aborted) reject(new DOMException("aborted", "AbortError"))
    else init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))
  })
  await assert.rejects(() => request("slow", "/store/regions", { timeoutMs: 1 }), (error) => error instanceof CommerceApiError && error.kind === "timeout")
  const controller = new AbortController(); controller.abort()
  await assert.rejects(() => request("aborted", "/store/regions", { signal: controller.signal }), (error) => error instanceof CommerceApiError && error.kind === "aborted")
})

test("region response preserves currency and providers", async () => {
  global.fetch = async () => json({ regions: [{ id: "reg_in", name: "India", currency_code: "inr", countries: [{ iso_2: "in" }], payment_providers: [{ id: "manual" }], fulfillment_providers: [{ id: "manual" }] }] })
  const region = (await listRegionsV1()).regions[0]
  assert.equal(region.currency_code, "inr"); assert.equal(region.payment_providers[0].id, "manual")
})

test("regional prices remain minor units and missing price is not zero", () => {
  assert.deepEqual(regionalVariantPrice({ id: "variant_1", title: "Default", calculated_price: 125000, prices: [{ amount: 125000, currency_code: "inr" }] }), { amount: 125000, currency_code: "inr" })
  assert.equal(regionalVariantPrice({ id: "variant_2", title: "Unavailable", prices: [] }), null)
})

test("cart lifecycle uses native Medusa v1 paths and bodies", async () => {
  const calls = []
  global.fetch = async (input, init) => { calls.push({ url: String(input), method: init.method, body: init.body }); return json({ cart: { id: "cart_1", region_id: "reg_1", currency_code: "inr", items: [] } }) }
  await createCartV1("reg_1"); await retrieveCartV1("cart_1"); await addLineItemV1("cart_1", "variant_1", 1); await updateLineItemV1("cart_1", "item_1", 2); await removeLineItemV1("cart_1", "item_1")
  assert.deepEqual(calls.map((call) => [call.method, new URL(call.url).pathname]), [["POST", "/store/carts"], ["GET", "/store/carts/cart_1"], ["POST", "/store/carts/cart_1/line-items"], ["POST", "/store/carts/cart_1/line-items/item_1"], ["DELETE", "/store/carts/cart_1/line-items/item_1"]])
  assert.deepEqual(JSON.parse(calls[2].body), { variant_id: "variant_1", quantity: 1 })
})

test("missing cart, invalid variant, and inventory conflict are distinguishable", async () => {
  global.fetch = async () => json({ type: "not_found", message: "Cart does not exist" }, 404)
  await assert.rejects(() => retrieveCartV1("gone"), (error) => error instanceof CommerceApiError && error.cartExpired)
  global.fetch = async () => json({ type: "invalid_data", message: "Variant does not exist" }, 422)
  await assert.rejects(() => addLineItemV1("cart_1", "bad", 1), (error) => error instanceof CommerceApiError && error.kind === "invalid_variant")
  global.fetch = async () => json({ type: "not_allowed", message: "Insufficient inventory" }, 409)
  await assert.rejects(() => addLineItemV1("cart_1", "variant_1", 999), (error) => error instanceof CommerceApiError && error.inventoryConflict)
})

test("completion preserves native order and propagates failure", async () => {
  global.fetch = async () => json({ type: "order", data: { id: "order_1" } })
  const completed = await completeCartV1("cart_1"); assert.equal(completed.type, "order"); assert.equal(completed.data.id, "order_1")
  global.fetch = async () => json({ type: "not_allowed", message: "A shipping method is required" }, 409)
  await assert.rejects(() => completeCartV1("cart_1"), CommerceApiError)
})

test("customer registration, login, and current-customer use native v1 contracts", async () => {
  const calls = []
  global.fetch = async (input, init) => {
    calls.push([init.method, new URL(String(input)).pathname, init.headers])
    if (String(input).endsWith("/store/auth/token")) return json({ access_token: "test-token" })
    return json({ customer: { id: "cus_1", email: "customer@example.com" } })
  }
  const customer = await registerCustomerV1({ email: "customer@example.com", password: "safe-test-password" })
  const login = await loginCustomerV1("customer@example.com", "safe-test-password")
  const current = await retrieveCustomerV1({ authorization: "Bearer test-token" })
  assert.equal(customer.customer.id, "cus_1"); assert.equal(login.access_token, "test-token"); assert.equal(current.customer.email, "customer@example.com")
  assert.deepEqual(calls.map((call) => call.slice(0, 2)), [["POST", "/store/customers"], ["POST", "/store/auth/token"], ["GET", "/store/customers/me"]])
})

test("payment sessions are created then selected without fabricating payment state", async () => {
  const calls = []
  global.fetch = async (input, init) => { calls.push([init.method, new URL(String(input)).pathname, init.body]); return json({ cart: { id: "cart_1", payment_sessions: [{ provider_id: "manual" }] } }) }
  await createPaymentSessionsV1("cart_1")
  await selectPaymentSessionV1("cart_1", "manual")
  assert.deepEqual(calls.map((call) => call.slice(0, 2)), [["POST", "/store/carts/cart_1/payment-sessions"], ["POST", "/store/carts/cart_1/payment-session"]])
  assert.deepEqual(JSON.parse(calls[1][2]), { provider_id: "manual" })
})
