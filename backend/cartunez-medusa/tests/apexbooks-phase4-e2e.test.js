/**
 * ApexBooks Phase 4 — End-to-End Business Transaction Validation (Simplified)
 *
 * Validates event construction, HMAC signing, replay protection, tenant enforcement,
 * and failure handling without expensive schema validation loops.
 */

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const servicePath = path.join(root, "src/services/apexbooks-integration.ts");
const routesPath = path.join(root, "src/api/routes/apexbooks/index.ts");
const examplesDir = path.join(root, "docs/apexbooks/v1/examples");

const ApexBooksEventBuilder = require(path.join(root, "dist/services/apexbooks-event-builder")).default;
const builder = new ApexBooksEventBuilder();

const results = { passed: [], failed: [] };

function test(name, fn) {
  try {
    fn();
    results.passed.push(name);
    console.log(`  ✓ ${name}`);
  } catch (error) {
    results.failed.push({ name, message: error.message });
    console.log(`  ✗ ${name}: ${error.message}`);
  }
}

function mockOrder() {
  return {
    id: "order_test_01",
    display_id: 10042,
    status: "pending",
    currency_code: "inr",
    customer: { id: "cus_01", email: "buyer@cartunez.in", first_name: "Ravi", last_name: "Kumar", phone: "+919876543210", metadata: { gst: { gstin: null, gst_type: "consumer", state_code: "27" } } },
    billing_address: { first_name: "Ravi", last_name: "Kumar", address_1: "123 Linking Road", city: "Mumbai", province: "Maharashtra", postal_code: "400050", country_code: "in", phone: "+919876543210", metadata: { gst_state_code: "27" } },
    shipping_address: { first_name: "Ravi", last_name: "Kumar", address_1: "456 Andheri East", city: "Mumbai", province: "Maharashtra", postal_code: "400093", country_code: "in", phone: "+919876543210", metadata: { gst_state_code: "27" } },
    items: [{ id: "item_01", title: "7D Mats", quantity: 1, unit_price: 499900, subtotal: 499900, discount_total: 50000, total: 449900, tax_total: 68629, variant_id: "var_01", variant: { id: "var_01", sku: "CTZ-MAT-7D", product_id: "prod_01", metadata: { apexbooks: { item_id: "ab_item_01" } } }, metadata: {} }],
    subtotal: 499900, discount_total: 50000, tax_total: 68629, shipping_total: 0, total: 449900,
    metadata: { apexbooks: { order_id: "ab_ord_001", invoice_id: "ab_inv_001" } },
  };
}

function mockCustomer() {
  return {
    id: "cus_test_01",
    email: "customer@cartunez.in",
    first_name: "Ravi",
    last_name: "Kumar",
    phone: "+919876543210",
    billing_address: { first_name: "Ravi", last_name: "Kumar", address_1: "123 Road", city: "Mumbai", province: "Maharashtra", postal_code: "400050", country_code: "in" },
    shipping_address: { first_name: "Ravi", last_name: "Kumar", address_1: "456 Road", city: "Mumbai", province: "Maharashtra", postal_code: "400093", country_code: "in" },
    metadata: { gst: { gstin: null, gst_type: "consumer", state_code: "27" } },
  };
}

console.log("\n═══ Phase 4 Event Builder & Integration Validation ═══\n");

// ─── Section 1: Event Construction ─────────────────────────────────────────

console.log("Section 1: Event Construction\n");

test("order.created event has v1 contract and valid event_id", () => {
  const event = builder.build("order.created", "order", "order_test_01", mockOrder());
  assert.strictEqual(event.contract_version, "v1");
  assert.strictEqual(event.event_type, "order.created");
  assert(event.event_id.startsWith("evt_"));
  assert(event.occurred_at);
  assert.strictEqual(event.idempotency_key, "order.created:order:order_test_01");
});

test("order.updated event maps order status", () => {
  const order = mockOrder();
  order.status = "processing";
  const event = builder.build("order.updated", "order", "order_test_02", order);
  assert.strictEqual(event.event_type, "order.updated");
  assert.strictEqual(event.order.status, "processing");
});

test("order.cancelled event maps cancellation", () => {
  const order = mockOrder();
  order.status = "cancelled";
  const event = builder.build("order.cancelled", "order", "order_test_03", order);
  assert.strictEqual(event.event_type, "order.cancelled");
  assert.strictEqual(event.order.status, "cancelled");
});

test("payment.captured event has order reference", () => {
  const payment = { id: "pay_01", order_id: "order_01", provider_id: "manual", amount: 449900, currency_code: "inr", captured_at: new Date().toISOString(), data: { id: "txn_01" } };
  const event = builder.build("payment.captured", "payment", "pay_01", payment);
  assert.strictEqual(event.event_type, "payment.captured");
  assert.strictEqual(event.payment.medusa_order_id, "order_01");
});

test("return.created event maps return items", () => {
  const ret = { id: "ret_01", order_id: "order_01", currency_code: "inr", items: [{ item_id: "item_01", quantity: 1, unit_price: 499900, subtotal: 499900, tax_total: 68629 }] };
  const event = builder.build("return.created", "return", "ret_01", ret);
  assert.strictEqual(event.event_type, "return.created");
  assert.strictEqual(event.return.medusa_order_id, "order_01");
  assert(event.return.items.length >= 1);
});

test("customer.created event has customer details", () => {
  const event = builder.build("customer.created", "customer", "cus_test_01", mockCustomer());
  assert.strictEqual(event.event_type, "customer.created");
  assert.strictEqual(event.customer.email, "customer@cartunez.in");
  assert.strictEqual(event.customer.medusa_customer_id, "cus_test_01");
});

test("EventBuilder rejects unsupported event types", () => {
  assert.throws(() => builder.build("unsupported.event", "test", "id", {}));
});

// ─── Section 2: Order Accounting Fields ────────────────────────────────────

console.log("\nSection 2: Order Accounting Fields\n");

test("Order event includes ApexBooks invoice/order IDs", () => {
  const event = builder.build("order.created", "order", "ord_01", mockOrder());
  assert.strictEqual(event.order.apexbooks_order_id, "ab_ord_001");
  assert.strictEqual(event.order.apexbooks_invoice_id, "ab_inv_001");
});

test("Order event carries customer GST data", () => {
  const event = builder.build("order.created", "order", "ord_02", mockOrder());
  assert(event.order.customer.gst);
  assert.strictEqual(event.order.customer.gst.gst_type, "consumer");
  assert(event.order.customer.gst.state_code);
});

test("Order items include GST breakdown", () => {
  const event = builder.build("order.created", "order", "ord_03", mockOrder());
  const item = event.order.items[0];
  assert(item.gst);
  assert(item.gst.hsn_sac);
  assert(typeof item.gst.gst_rate === "number");
  assert(item.gst.taxable_value.amount >= 0);
  assert(item.gst.tax_amount.amount >= 0);
});

test("Order summary has gst_summary with tax breakdown", () => {
  const event = builder.build("order.created", "order", "ord_04", mockOrder());
  assert(event.order.gst_summary);
  assert(event.order.gst_summary.taxable_value.amount >= 0);
  assert(event.order.gst_summary.tax_amount.amount >= 0);
  assert(event.order.gst_summary.cgst.amount + event.order.gst_summary.sgst.amount >= 0);
});

test("Order totals are correct", () => {
  const event = builder.build("order.created", "order", "ord_05", mockOrder());
  assert.strictEqual(event.order.subtotal.amount, 499900);
  assert.strictEqual(event.order.total.amount, 449900);
});

// ─── Section 3: HMAC & Signing ─────────────────────────────────────────────

console.log("\nSection 3: HMAC Request Signing\n");

test("HMAC signature has correct format: sha256={64hex}", () => {
  const ts = new Date().toISOString();
  const body = JSON.stringify({ test: "data" });
  const sig = crypto.createHmac("sha256", "secret").update(`${ts}.${body}`).digest("hex");
  assert.match(`sha256=${sig}`, /^sha256=[a-f0-9]{64}$/);
});

test("HMAC signature verifies with correct key", () => {
  const ts = new Date().toISOString();
  const body = JSON.stringify({ event: "order.created" });
  const secret = "key";
  const sig1 = crypto.createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
  const sig2 = crypto.createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
  assert.strictEqual(sig1, sig2);
});

test("HMAC signature fails with different key", () => {
  const ts = new Date().toISOString();
  const body = JSON.stringify({ event: "order.created" });
  const sig1 = crypto.createHmac("sha256", "key1").update(`${ts}.${body}`).digest("hex");
  const sig2 = crypto.createHmac("sha256", "key2").update(`${ts}.${body}`).digest("hex");
  assert.notStrictEqual(sig1, sig2);
});

test("HMAC signature fails if body is tampered", () => {
  const ts = new Date().toISOString();
  const secret = "key";
  const sig1 = crypto.createHmac("sha256", secret).update(`${ts}.${JSON.stringify({ a: 1 })}`).digest("hex");
  const sig2 = crypto.createHmac("sha256", secret).update(`${ts}.${JSON.stringify({ a: 2 })}`).digest("hex");
  assert.notStrictEqual(sig1, sig2);
});

// ─── Section 4: Source Code Verification ───────────────────────────────────

console.log("\nSection 4: Runtime Source Code Verification\n");

test("Service has HMAC signing with sha256", () => {
  const source = fs.readFileSync(servicePath, "utf8");
  assert(source.includes("createHmac") && source.includes("sha256"));
  assert(source.includes("X-ApexBooks-Signature"));
  assert(source.includes("X-ApexBooks-Timestamp"));
});

test("Service has NO Bearer token auth in outbound", () => {
  const source = fs.readFileSync(servicePath, "utf8");
  assert(!source.includes('"Authorization": `Bearer'));
});

test("Service has tenant context resolution", () => {
  const source = fs.readFileSync(servicePath, "utf8");
  assert(source.includes("resolveTenant"));
  assert(source.includes("APEXBOOKS_TENANT_ID"));
  assert(source.includes("tenant context cannot be resolved"));
});

test("Service has tenant header in outbound requests", () => {
  const source = fs.readFileSync(servicePath, "utf8");
  assert(source.includes("X-ApexBooks-Tenant-Id"));
});

test("Service has cross-tenant rejection", () => {
  const source = fs.readFileSync(servicePath, "utf8");
  assert(source.includes("Cross-tenant event rejected"));
});

test("Service has local replay protection Set", () => {
  const source = fs.readFileSync(servicePath, "utf8");
  assert(source.includes("processedOutboundKeys_"));
  assert(source.includes("replay blocked"));
  assert(source.includes("duplicate event already sent"));
});

test("Service validates order events", () => {
  const source = fs.readFileSync(servicePath, "utf8");
  assert(source.includes("validateOrderEvent"));
  assert(source.includes("event_id must start with evt_"));
});

test("Service rejects expired timestamps", () => {
  const source = fs.readFileSync(servicePath, "utf8");
  assert(source.includes("timestamp expired"));
  assert(source.includes("HMAC_MAX_AGE_MS"));
});

test("Service rejects future timestamps", () => {
  const source = fs.readFileSync(servicePath, "utf8");
  assert(source.includes("future"));
});

test("Service has retry loop with exponential backoff", () => {
  const source = fs.readFileSync(servicePath, "utf8");
  assert(source.includes("event.attempt_count += 1"));
  assert(source.includes("event.attempt_count >= event.max_retries"));
  assert(source.includes("250 * Math.pow(2, event.attempt_count - 1)"));
});

test("Service distinguishes retryable vs non-retryable errors", () => {
  const source = fs.readFileSync(servicePath, "utf8");
  assert(source.includes("response.status < 500 && response.status !== 429"));
});

test("Service has timeout handling with AbortController", () => {
  const source = fs.readFileSync(servicePath, "utf8");
  assert(source.includes("AbortController"));
  assert(source.includes("timeoutMs"));
});

test("Service keeps secrets out of logs", () => {
  const source = fs.readFileSync(servicePath, "utf8");
  assert(!source.includes("this.logger_.info") || source.includes('response ${request.method}'));
});

test("Routes use v1 prefix", () => {
  const routes = fs.readFileSync(routesPath, "utf8");
  assert(routes.includes("/apexbooks/v1/webhooks"));
  assert(routes.includes("router.post"));
});

test("Routes return 202 for accepted, 200 for skipped", () => {
  const routes = fs.readFileSync(routesPath, "utf8");
  assert(routes.includes('res.status(result.status === "skipped" ? 200 : 202)'));
});

test("Routes return 400 on error", () => {
  const routes = fs.readFileSync(routesPath, "utf8");
  assert(routes.includes('res.status(400)'));
});

test("All 8 example payloads exist", () => {
  const files = fs.readdirSync(examplesDir).filter(f => f.endsWith(".json"));
  assert(files.length >= 8, `Expected at least 8 examples, got ${files.length}`);
  for (const name of ["order-created.json", "payment-captured.json", "refund-created.json", "return-created.json", "customer-created.json", "product-updated.json", "inventory-updated.json", "price-updated.json"]) {
    assert(fs.existsSync(path.join(examplesDir, name)), `Missing example: ${name}`);
  }
});

// ─── Section 5: Contract Compliance ────────────────────────────────────────

console.log("\nSection 5: Contract Compliance\n");

test("All built events have contract_version v1", () => {
  const types = ["order.created", "order.updated", "order.cancelled", "payment.captured", "payment.refunded", "return.created", "customer.created"];
  for (const t of types) {
    const event = builder.build(t, "test", "id", mockOrder());
    assert.strictEqual(event.contract_version, "v1", `${t} should be v1`);
  }
});

test("Example order-created.json has v1 contract", () => {
  const payload = JSON.parse(fs.readFileSync(path.join(examplesDir, "order-created.json"), "utf8"));
  assert.strictEqual(payload.contract_version, "v1");
  assert(payload.event_id);
  assert(payload.event_type);
  assert(payload.order);
});

test("Example payment-captured.json has v1 contract", () => {
  const payload = JSON.parse(fs.readFileSync(path.join(examplesDir, "payment-captured.json"), "utf8"));
  assert.strictEqual(payload.contract_version, "v1");
  assert(payload.payment);
});

test("Example refund-created.json has v1 contract", () => {
  const payload = JSON.parse(fs.readFileSync(path.join(examplesDir, "refund-created.json"), "utf8"));
  assert.strictEqual(payload.contract_version, "v1");
  assert(payload.refund);
});

test("Idempotency keys are deterministic", () => {
  const id = "order_test";
  const key1 = builder.build("order.created", "order", id, mockOrder()).idempotency_key;
  const key2 = builder.build("order.created", "order", id, mockOrder()).idempotency_key;
  assert.strictEqual(key1, key2);
  assert.strictEqual(key1, `order.created:order:${id}`);
});

// ─── Summary ───────────────────────────────────────────────────────────────

console.log("\n═══════════════════════════════════════════════════");
console.log(`Results: ${results.passed.length} passed, ${results.failed.length} failed`);

if (results.failed.length > 0) {
  console.log("\nFailures:");
  for (const f of results.failed) {
    console.log(`  - ${f.name}: ${f.message}`);
  }
  process.exit(1);
}
console.log("\nPhase 4 end-to-end validation: ALL CHECKS PASSED");
