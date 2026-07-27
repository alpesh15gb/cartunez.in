#!/usr/bin/env node

const baseUrl = (process.env.MEDUSA_SMOKE_URL || "http://127.0.0.1:9000").replace(/\/$/, "");
const parsed = new URL(baseUrl);
if (!["localhost", "127.0.0.1"].includes(parsed.hostname) && process.env.ALLOW_NONLOCAL_INTEGRATION !== "true") {
  throw new Error("Live commerce integration tests are restricted to localhost by default");
}
if (process.env.CONFIRM_DISPOSABLE_DATABASE !== "yes") {
  throw new Error("Set CONFIRM_DISPOSABLE_DATABASE=yes only for a verified disposable database");
}

async function api(path, { method = "GET", body, token, cookie, expected = [200] } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!expected.includes(response.status)) throw new Error(`${method} ${path} returned ${response.status}`);
  return { status: response.status, payload, setCookie: response.headers.get("set-cookie") };
}

const unique = Date.now().toString(36);
const email = `commerce-${unique}@example.test`;
const password = `Test-${unique}-Password!`;

try {
  const health = await api("/health");
  if (health.payload.status !== "ok") throw new Error("Liveness response invalid");
  console.log("PASS liveness");
  const ready = await api("/ready");
  if (ready.payload.status !== "ready") throw new Error("Readiness response invalid");
  console.log("PASS PostgreSQL and Redis readiness");

  const { payload: regionPayload } = await api("/store/regions?limit=1");
  const region = regionPayload.regions?.[0];
  if (!region?.id) throw new Error("No seeded region");
  if (region.currency_code?.toLowerCase() !== "inr") throw new Error("Seeded region is not INR");
  console.log("PASS region availability");

  const { payload: productPayload } = await api(`/store/products?limit=20&region_id=${region.id}`);
  const variant = productPayload.products?.flatMap((product) => product.variants || []).find((item) => item.id && item.calculated_price > 0);
  if (!variant) throw new Error("No seeded priced variant");
  const product = productPayload.products.find((candidate) => candidate.variants?.some((item) => item.id === variant.id));
  if (!product?.id) throw new Error("Priced variant has no product");
  const { payload: productDetail } = await api(`/store/products/${product.id}?region_id=${region.id}`);
  if (productDetail.product?.id !== product.id) throw new Error("Product detail contract mismatch");
  console.log("PASS product and regional price");

  const customerInput = { email, password, first_name: "Integration", last_name: "Test" };
  await api("/store/customers", { method: "POST", body: customerInput, expected: [200, 201] });
  const duplicate = await api("/store/customers", { method: "POST", body: customerInput, expected: [400, 409, 422] });
  if (duplicate.status < 400) throw new Error("Duplicate registration unexpectedly succeeded");
  const { payload: login } = await api("/store/auth/token", { method: "POST", body: { email, password } });
  const token = login.access_token;
  if (!token) throw new Error("Customer login returned no token");
  await api("/store/auth/token", { method: "POST", body: { email, password: "invalid-password" }, expected: [400, 401] });
  await api("/store/customers/me", { token });
  await api("/store/customers/me", { method: "POST", token, body: { first_name: "Updated" } });
  const addressInput = { first_name: "Integration", last_name: "Test", address_1: "1 Test Road", city: "Hyderabad", country_code: "in", postal_code: "500001", phone: "0000000000" };
  const { payload: addressResponse } = await api("/store/customers/me/addresses", { method: "POST", token, body: addressInput });
  const addressId = addressResponse.customer?.shipping_addresses?.at(-1)?.id;
  if (!addressId) throw new Error("Customer address creation returned no address");
  await api(`/store/customers/me/addresses/${addressId}`, { method: "POST", token, body: { city: "Secunderabad" } });
  await api(`/store/customers/me/addresses/${addressId}`, { method: "DELETE", token });
  const sessionLogin = await api("/store/auth", { method: "POST", body: { email, password } });
  const sessionCookie = sessionLogin.setCookie?.split(";", 1)[0];
  if (!sessionCookie) throw new Error("Session login returned no cookie");
  await api("/store/customers/me", { cookie: sessionCookie });
  await api("/store/auth", { method: "DELETE", cookie: sessionCookie });
  await api("/store/customers/me", { cookie: sessionCookie, expected: [401] });
  console.log("PASS customer authentication and address lifecycle");

  const { payload: createdCart } = await api("/store/carts", { method: "POST", body: { region_id: region.id } });
  const cartId = createdCart.cart?.id;
  if (!cartId) throw new Error("Cart creation returned no ID");
  await api(`/store/carts/${cartId}`);
  await api(`/store/carts/${cartId}/line-items`, { method: "POST", body: { variant_id: "variant_invalid", quantity: 1 }, expected: [400, 404, 422] });
  const { payload: added } = await api(`/store/carts/${cartId}/line-items`, { method: "POST", body: { variant_id: variant.id, quantity: 1 } });
  let lineId = added.cart?.items?.[0]?.id;
  if (!lineId) throw new Error("Line item creation returned no ID");
  await api(`/store/carts/${cartId}/line-items/${lineId}`, { method: "POST", body: { quantity: 2 } });
  await api(`/store/carts/${cartId}/line-items/${lineId}`, { method: "POST", body: { quantity: 1001 }, expected: [400, 409, 422] });
  await api(`/store/carts/${cartId}/line-items/${lineId}`, { method: "POST", body: { quantity: 1 } });
  await api(`/store/carts/${cartId}/line-items/${lineId}`, { method: "DELETE" });
  const { payload: readded } = await api(`/store/carts/${cartId}/line-items`, { method: "POST", body: { variant_id: variant.id, quantity: 1 } });
  lineId = readded.cart?.items?.[0]?.id;
  if (!lineId) throw new Error("Line item could not be re-added after removal");
  console.log("PASS cart and inventory validation");

  await api(`/store/carts/${cartId}`, { method: "POST", token, body: { email, shipping_address: addressInput, billing_address: addressInput } });
  const { payload: shipping } = await api(`/store/shipping-options/${cartId}`);
  const shippingOption = shipping.shipping_options?.[0];
  if (!shippingOption?.id) throw new Error("No seeded shipping option");
  await api(`/store/carts/${cartId}/shipping-methods`, { method: "POST", body: { option_id: shippingOption.id } });
  await api(`/store/carts/${cartId}/payment-sessions`, { method: "POST" });
  const { payload: selected } = await api(`/store/carts/${cartId}/payment-session`, { method: "POST", body: { provider_id: "manual" } });
  if (selected.cart?.payment_session?.provider_id !== "manual") throw new Error("Manual payment session not selected");
  console.log("PASS shipping and manual payment session");

  const { payload: incomplete } = await api("/store/carts", { method: "POST", body: { region_id: region.id } });
  const failedCompletion = await api(`/store/carts/${incomplete.cart.id}/complete`, { method: "POST", expected: [200, 400, 409, 422] });
  if (failedCompletion.payload.type === "order") throw new Error("Incomplete cart created an order");
  await api(`/store/carts/${incomplete.cart.id}`);
  console.log("PASS incomplete cart creates no order");

  if (process.env.ALLOW_TEST_ORDER_COMPLETION === "true") {
    const { payload: completed } = await api(`/store/carts/${cartId}/complete`, { method: "POST" });
    if (completed.type !== "order" || !completed.data?.id) throw new Error("Safe completion returned no order");
    const { payload: retrievedOrder } = await api(`/store/orders/${completed.data.id}`);
    if (!retrievedOrder.order?.items?.some((item) => item.variant_id === variant.id)) throw new Error("Completed order has no expected line item");
    if (!Number.isInteger(retrievedOrder.order?.total) || retrievedOrder.order.total <= 0) throw new Error("Completed order has no authoritative total");
    const repeated = await api(`/store/carts/${cartId}/complete`, { method: "POST", expected: [200, 400, 404, 409] });
    if (repeated.payload.type === "order" && repeated.payload.data?.id !== completed.data.id) throw new Error("Repeated completion created a second order");
    console.log("PASS disposable manual-payment order completion");
  } else {
    console.log("SKIP order completion (ALLOW_TEST_ORDER_COMPLETION is not true)");
  }
} catch (error) {
  console.error(`FAIL ${error instanceof Error ? error.message : "unknown integration error"}`);
  process.exit(1);
}
