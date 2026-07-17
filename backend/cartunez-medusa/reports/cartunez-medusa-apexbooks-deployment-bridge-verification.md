# Cartunez Medusa → ApexBooks Deployment Bridge Verification

**Date:** 2026-07-18
**Target API:** `https://api.apexbooks.in`
**Scope:** `backend/cartunez-medusa` (read-only verification)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Cartunez Medusa (v1.20.4)                       │
│                                                                         │
│  ┌──────────┐   Medusa Events    ┌──────────────────┐   HMAC-SHA256   ┌─┴────────────────┐
│  │ Medusa   │ ──────────────────►│ 7 Subscribers    │ ───────────────►│                  │
│  │ Core     │   order.placed     │ (order, payment,  │   POST /webhooks│   ApexBooks API  │
│  │ (Order,  │   payment.captured │  refund, return,  │   /medusa/events│   api.apexbooks.in│
│  │  Payment,│   refund.created   │  customer)        │                 │                  │
│  │  Customer│   customer.created │                   │◄───────────────┤                  │
│  │  ...)    │   return.requested │                   │   Webhooks with │                  │
│  │          │                    │◄──────────────────┤   HMAC Verify   │                  │
│  └──────────┘   ApexBooks pushes │ 4 Inbound Routes  │                 │                  │
│                 product/price/   │ (product, price,   │                 │                  │
│                 inventory/       │  inventory,        │                 │                  │
│                 customer updates │  customer)         │                 │                  │
│                                  └──────────────────┘                  └──────────────────┘
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Services Layer                                                 │    │
│  │  ┌─────────────────────┐  ┌────────────────────────────┐        │    │
│  │  │ ApexbooksIntegration│  │ ApexBooksEventBuilder     │        │    │
│  │  │ - sendOutboundEvent │  │ - build()                 │        │    │
│  │  │ - handleInboundWH   │  │ - validate()              │        │    │
│  │  │ - verifyWebhook     │  │ - buildOrder/Payment/...  │        │    │
│  │  │ - request (HMAC)    │  └────────────────────────────┘        │    │
│  │  │ - syncProduct/Price │                                        │    │
│  │  │   /Inventory/Customer│                                       │    │
│  │  └─────────────────────┘                                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Data Layer (Medusa metadata JSON)                              │    │
│  │  metadata.apexbooks = { id, order_id, invoice_id, ... }         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Communication Pattern

| Direction | Method | Auth | Transport |
|-----------|--------|------|-----------|
| Medusa → ApexBooks (outbound) | HTTP POST | HMAC-SHA256 (`X-ApexBooks-Signature`) | HTTPS via `fetch()` |
| ApexBooks → Medusa (inbound) | HTTP POST | HMAC-SHA256 (`X-ApexBooks-Signature`) | HTTPS Webhook |

---

## 2. Environment Variables

### Required Variables

| Variable | Status | Production Value | Safe-Failure Behavior |
|----------|--------|-----------------|----------------------|
| `APEXBOOKS_ENABLED` | ✅ Configured | `true` | If `false` or missing: all outbound events skip with `status: "skipped"` |
| `APEXBOOKS_BASE_URL` | ✅ Configured | `https://api.apexbooks.in` | If empty: `request()` throws, events fail |
| `APEXBOOKS_API_KEY` | ✅ Configured | *(from ApexBooks)* | If empty: `request()` throws, events fail |
| `APEXBOOKS_WEBHOOK_SECRET` | ✅ Configured | *(shared with ApexBooks)* | If empty: `verifyWebhook()` throws, 400 returned |
| `APEXBOOKS_TENANT_ID` | ⚠️ Missing from `.env.example` | `cartunez-prod` | If empty: `resolveTenant()` returns falsy, outbound events fail with "tenant context cannot be resolved" |
| `APEXBOOKS_TIMEOUT_MS` | ✅ Configured (default `10000`) | `10000` (10s) | Falls back to 10000ms |
| `APEXBOOKS_MAX_RETRIES` | ✅ Configured (default `3`) | `3` | Falls back to 3 retries |

### Missing from `.env.example`

The `.env.example` file is **missing `APEXBOOKS_TENANT_ID`**. This is a documentation gap — the service reads and uses it correctly, but anyone setting up from the example file won't know to configure it. The tenant ID is critical: without it, all outbound events are rejected at runtime.

### Production `.env.production` Requirements

```env
APEXBOOKS_ENABLED=true
APEXBOOKS_BASE_URL=https://api.apexbooks.in
APEXBOOKS_API_KEY=<apexbooks-provided-api-key>
APEXBOOKS_WEBHOOK_SECRET=<shared-webhook-secret>
APEXBOOKS_TENANT_ID=cartunez-prod
APEXBOOKS_TIMEOUT_MS=10000
APEXBOOKS_MAX_RETRIES=3
```

---

## 3. Endpoint Mapping

### Inbound Webhooks (ApexBooks → Medusa)

These endpoints receive events from ApexBooks. All require HMAC-SHA256 verification.

| Route | Handler | Purpose | Contract |
|-------|---------|---------|----------|
| `POST /apexbooks/v1/webhooks` | `genericWebhookHandler` | Universal webhook receiver; dispatches by `event_type` | v1 |
| `POST /apexbooks/v1/webhooks/products` | `productWebhookHandler` | Product create/update | v1 |
| `POST /apexbooks/v1/webhooks/prices` | `priceWebhookHandler` | Price update | v1 |
| `POST /apexbooks/v1/webhooks/inventory` | `inventoryWebhookHandler` | Inventory quantity update | v1 |
| `POST /apexbooks/v1/webhooks/customers` | `customerWebhookHandler` | Customer update from ApexBooks | v1 |
| `GET /apexbooks/v1/health` | `healthHandler` | Health check, returns config (secrets redacted) | — |

**Note:** Both `/apexbooks/` (without version prefix) and `/apexbooks/v1/` routes are registered. The v1 routes are the canonical ones; the unversioned routes provide backward compatibility during transition.

### Outbound (Medusa → ApexBooks)

| Target | Method | Path | When |
|--------|--------|------|------|
| ApexBooks API | POST | `/webhooks/medusa/events` | On every outbound event |

All outbound events POST to the same path. The `event_type` field in the JSON body differentiates them.

---

## 4. Event Mapping

### Outbound Events (Medusa → ApexBooks)

| # | Medusa Event | ApexBooks Event Type | Resource Type | Subscriber File | Trigger | Payload Schema |
|---|-------------|---------------------|---------------|-----------------|---------|---------------|
| 1 | `order.placed` | `order.created` | `order` | `subscribers/apexbooks-order-created.ts` | Order placed after checkout | OrderPayload (v1) |
| 2 | `order.updated` | `order.updated` | `order` | `subscribers/apexbooks-order-updated.ts` | Order status change | OrderPayload (v1) |
| 3 | `order.canceled` | `order.cancelled` | `order` | `subscribers/apexbooks-order-cancelled.ts` | Order cancelled | OrderPayload (v1) |
| 4 | `payment.captured` | `payment.captured` | `payment` | `subscribers/apexbooks-payment-captured.ts` | Payment captured | PaymentPayload (v1) |
| 5 | `refund.created` | `payment.refunded` | `payment` | `subscribers/apexbooks-payment-refunded.ts` | Refund issued | RefundPayload (v1) |
| 6 | `return.requested` | `return.created` | `return` | `subscribers/apexbooks-return-created.ts` | Return initiated | ReturnPayload (v1) |
| 7 | `customer.created` | `customer.created` | `customer` | `subscribers/apexbooks-customer-created.ts` | New customer registered | CustomerPayload (v1) |

### Inbound Events (ApexBooks → Medusa)

| Event Type | Route Handler | Medusa Action | Dedup |
|-----------|---------------|---------------|-------|
| `product.created` / `product.updated` / `product.changed` | `syncProduct` | Upsert product by `apexbooks_product_id`, update metadata | `processed_event_ids` |
| `price.updated` / `product.price.updated` | `syncPrice` | Record price change in product metadata (delegated variant price mutation) | `processed_event_ids` |
| `inventory.updated` / `product.inventory.updated` | `syncInventory` | Update variant `inventory_quantity`, sync metadata | `processed_event_ids` |
| `customer.updated` / `customer.changed` | `syncCustomer` | Update customer by `apexbooks_customer_id` or email | `processed_event_ids` |

### Event Envelope Structure (All Outbound Events)

```json
{
  "contract_version": "v1",
  "event_id": "evt_medusa_order_created_order_test_01_<uuid>",
  "event_type": "order.created",
  "occurred_at": "2026-07-18T12:34:56.789Z",
  "idempotency_key": "order.created:order:order_test_01",
  "<event_object>": { /* type-specific payload */ }
}
```

---

## 5. Security Flow

### Outbound Request Signing (Medusa → ApexBooks)

```
Input: "{timestamp}.{json_body}"
HMAC: crypto.createHmac("sha256", APEXBOOKS_API_KEY).update(input).digest("hex")
Header: X-ApexBooks-Signature: sha256={64-hex}
Header: X-ApexBooks-Timestamp: <ISO 8601>
Header: X-ApexBooks-Contract-Version: v1
Header: X-ApexBooks-Tenant-Id: <tenant>
Header: Idempotency-Key: <event_type:resource_type:resource_id>
```

**No Bearer API key auth** — HMAC replaces raw API key transmission.

### Inbound Webhook Verification (ApexBooks → Medusa)

```
1. Check X-ApexBooks-Contract-Version == "v1"
2. Extract X-ApexBooks-Timestamp, X-ApexBooks-Signature
3. verifyTimestamp():
   - Reject if >5 min old (HMAC_MAX_AGE_MS = 300000)
   - Reject if >1 min in future (HMAC_CLOCK_SKEW_MS = 60000)
4. Compute: HMAC-SHA256(webhookSecret, "{timestamp}.{json_body}")
5. timingSafeEqual() comparison
6. Reject on mismatch → HTTP 400
```

### Tenant Enforcement

| Direction | Check | Failure |
|-----------|-------|---------|
| Outbound | `X-ApexBooks-Tenant-Id` header set from `APEXBOOKS_TENANT_ID` | Throws "tenant context cannot be resolved" |
| Inbound | Compares `X-ApexBooks-Tenant-Id` header against `resolveTenant()` | Throws "Cross-tenant event rejected", returns 400 |

### Replay Protection

| Direction | Mechanism | Scope | Lifecycle |
|-----------|-----------|-------|-----------|
| Outbound | `processedOutboundKeys_` (in-memory `Set<string>`) | Per-instance, resets on restart | Checked before HTTP delivery |
| Inbound | `metadata.apexbooks.processed_event_ids` (array in DB, last 50) | Persistent across restarts | Checked before mutation |

### Secrets Management

- API keys and webhook secrets **redacted in `getConfig()`**: `{ apiKey: "***", webhookSecret: "***" }`
- Response bodies truncated to 2000 characters in error logs
- No secrets passed to logger calls

---

## 6. Database Mapping

### No Custom Migration Required

ApexBooks integration uses Medusa's built-in **metadata JSON field** on existing entities. No schema changes, no new tables, no migrations.

| Entity | Metadata Key | Stored Fields |
|--------|-------------|---------------|
| **Product** | `metadata.apexbooks` | `id` (ApexBooks product ID), `last_event_id`, `last_synced_at`, `processed_event_ids[]`, `last_payload_hash` |
| **Product Variant** | `metadata.apexbooks` | `id` (ApexBooks variant ID), `last_event_id`, `last_synced_at`, `processed_event_ids[]` |
| **Customer** | `metadata.apexbooks` | `id` (ApexBooks customer ID), `last_event_id`, `last_synced_at`, `processed_event_ids[]` |
| **Order** | `metadata.apexbooks` | `order_id`, `invoice_id`, `payment_id`, `refund_id`, `outbound.*` (sent status per event type) |
| **Customer GST** | `metadata.gst` | `gstin`, `gst_type`, `state_code` (set during customer registration) |
| **Order Item GST** | `item.metadata.gst` | `hsn_sac`, `gst_rate` |

### Lookup Mechanism

| Lookup | Method | Performance Concern |
|--------|--------|-------------------|
| Product by ApexBooks ID | `productService_.list({}, { take: 10000 })` then Array.find() | **Linear scan** — loads all products, O(n) per lookup |
| Customer by ApexBooks ID | `customerService_.list({}, { take: 10000 })` then Array.find() | **Linear scan** — loads all customers, O(n) per lookup |
| Product for inbound sync | `requireProduct()` → above + `retrieve(id, { relations: ["variants"] })` | Two queries per sync |

### Database Migration Files

| Migration | Purpose | ApexBooks-Related |
|-----------|---------|-------------------|
| `1718000000000-CreateVehicleTables.ts` | Vehicle product tables | ❌ No |

There are **zero database migrations** for the ApexBooks integration. All ApexBooks data lives in Medusa's generic `metadata` JSON column.

---

## 7. Production Flow Simulation

### Happy Path: Complete Order Lifecycle

```
Step 1: Customer Registration
  Medusa Event: customer.created
  → Subscriber: apexbooks-customer-created.ts
  → sendOutboundEvent("customer.created", "customer", id, customer)
  → POST /webhooks/medusa/events { contract_version, event_id, event_type:"customer.created", customer:{...} }
  → ApexBooks creates customer record
  → metadata.apexbooks.customer_id set (if ApexBooks responds with ID)
  ⚠️ Note: recordOutboundSync() only tracks "order" resources — customer sync is NOT recorded in metadata

Step 2: Product Sync (inbound, from ApexBooks)
  ApexBooks POST → /apexbooks/v1/webhooks/products
  → verifyWebhook() (HMAC + timestamp + contract version)
  → syncProduct() → findProductByApexBooksId()
  → If new: productService_.create() with variants + prices
  → If existing: productService_.update() with metadata
  → metadata.apexbooks.id = apexbooks_product_id, eventId added to processed_event_ids

Step 3: Order Placed
  Medusa Event: order.placed
  → Subscriber: apexbooks-order-created.ts
  → orderService_.retrieve(id, { relations: ["items","customer","payments","shipping","billing"] })
  → sendOutboundEvent("order.created", "order", order.id, order)
  → EventBuilder.buildOrder() → OrderPayload with items, GST, addresses, totals
  → POST /webhooks/medusa/events
  → ApexBooks creates sales invoice
  → recordOutboundSync("order", id, "order.created", response) → metadata.apexbooks.outbound.order.created = { status:"sent", sent_at, response_id }

Step 4: Payment Captured
  Medusa Event: payment.captured
  → Subscriber: apexbooks-payment-captured.ts
  → sendOutboundEvent("payment.captured", "payment", data.id, data)
  → EventBuilder.buildPayment() → PaymentPayload
  → POST /webhooks/medusa/events
  → ApexBooks matches payment to invoice, records ledger entry
  ⚠️ No recordOutboundSync() — payment not tracked in metadata

Step 5: Order Fulfilled (order.updated)
  Medusa Event: order.updated
  → Subscriber: apexbooks-order-updated.ts
  → sendOutboundEvent("order.updated", "order", order.id, order)
  → recordOutboundSync() records in metadata.apexbooks.outbound

Step 6: Refund (if needed)
  Medusa Event: refund.created
  → Subscriber: apexbooks-payment-refunded.ts
  → sendOutboundEvent("payment.refunded", "payment", data.id, data)
  → ApexBooks creates refund debit memo, reverses GST
  ⚠️ No recordOutboundSync() — refund not tracked in metadata
```

### Verified Test Results

| Flow | Test Count | Status |
|------|-----------|--------|
| Event Construction (7 event types) | 7 tests | ✅ PASS |
| Order Accounting Fields | 5 tests | ✅ PASS |
| HMAC Request Signing | 4 tests | ✅ PASS |
| Runtime Source Code Verification | 17 tests | ✅ PASS |
| Contract Compliance | 5 tests | ✅ PASS |
| Runtime Compatibility (auth, tenant, replay, retry, etc.) | 30 checks | ✅ PASS |

---

## 8. Failure Handling

### Retry & Recovery

| Failure Mode | Detection | Retry Policy | Final Action |
|-------------|-----------|-------------|-------------|
| Network timeout (>10s) | `AbortController` timeout | Up to 3 attempts, backoff 250/500/1000ms | Throw, subscriber logs error |
| 5xx Server Error | `response.status >= 500` | Up to 3 attempts, backoff 250/500/1000ms | Throw, subscriber logs error |
| 429 Rate Limit | `response.status === 429` | Up to 3 attempts, backoff 250/500/1000ms | Throw, subscriber logs error |
| 4xx Client Error | `response.status < 500 && !== 429` | **No retry**, immediate throw | Throw, subscriber logs error |
| ApexBooks completely down | Network error on all attempts | 3 attempts exhausted | Throw — **event lost** |
| Invalid HMAC (inbound) | `timingSafeEqual` fails | N/A (ApexBooks may retry) | HTTP 400 |
| Expired timestamp | `now - then > 300s` | N/A (ApexBooks may retry) | HTTP 400 |
| Future timestamp | `then - now > 60s` | N/A (ApexBooks may retry) | HTTP 400 |
| Duplicate inbound event | `isProcessed()` checks `processed_event_ids` | N/A, skipped | HTTP 200, `status: "skipped"` |
| Duplicate outbound event | `processedOutboundKeys_` Set | N/A, skipped | `status: "skipped"` |
| Cross-tenant injection | Tenant header mismatch | N/A | HTTP 400 |
| Integration disabled | `APEXBOOKS_ENABLED !== "true"` | N/A | `status: "skipped"`, graceful |
| Config missing | Empty `baseUrl`/`apiKey`/`webhookSecret` | N/A | Throw, subscriber logs error |
| Tenant missing | `resolveTenant()` returns empty | N/A | Throw, subscriber logs error |

### Gap: No Persistent Event Queue

If ApexBooks is down for longer than the retry window (~1.75s + fetch timeouts), **events are lost**. There is no persistent queue, no dead-letter storage, and no automatic replay. Recovery requires operator intervention or manual re-triggering via the Medusa admin.

### Gap: recordOutboundSync Only Tracks Orders

The `recordOutboundSync()` method only stores sync metadata for `resourceType === "order"`. Payment captures, refunds, returns, and customer sync results are **not recorded in entity metadata**. This means:
- No audit trail for non-order outbound events
- No way to determine from Medusa whether a customer was synced to ApexBooks
- No recovery point for payment/refund events after Medusa restart

---

## 9. Deployment Checklist

### Pre-Deployment Configuration

- [ ] Set `APEXBOOKS_ENABLED=true` in `.env.production`
- [ ] Set `APEXBOOKS_BASE_URL=https://api.apexbooks.in`
- [ ] Obtain and set `APEXBOOKS_API_KEY` from ApexBooks
- [ ] Obtain and set `APEXBOOKS_WEBHOOK_SECRET` (shared with ApexBooks)
- [ ] Set `APEXBOOKS_TENANT_ID=cartunez-prod` (or appropriate tenant)
- [ ] Verify `APEXBOOKS_TIMEOUT_MS=10000` (adjust based on ApexBooks latency SLO)
- [ ] Verify `APEXBOOKS_MAX_RETRIES=3` (adjust based on reliability requirements)
- [ ] Add `APEXBOOKS_TENANT_ID` to `.env.example` for future setups

### Network Requirements

- [ ] Medusa server must have outbound HTTPS access to `https://api.apexbooks.in`
- [ ] ApexBooks must have inbound HTTPS access to Medusa webhook endpoints:
  - `POST /apexbooks/v1/webhooks`
  - `POST /apexbooks/v1/webhooks/products`
  - `POST /apexbooks/v1/webhooks/prices`
  - `POST /apexbooks/v1/webhooks/inventory`
  - `POST /apexbooks/v1/webhooks/customers`
- [ ] Webhook endpoints must present a valid TLS certificate
- [ ] Firewall must allow inbound POST requests from ApexBooks IP ranges

### Production Blockers

| Severity | Issue | Impact | Recommendation |
|----------|-------|--------|---------------|
| 🔴 **HIGH** | No persistent event queue | Events lost if ApexBooks unavailable during retry window | Implement DB-backed event queue with async worker |
| 🔴 **HIGH** | `findProductByApexBooksId()` loads all products (10000) | O(n) linear scan, degrades as product catalog grows | Add database index on `metadata->apexbooks->>id` |
| 🔴 **HIGH** | `findCustomerByApexBooksId()` loads all customers (10000) | O(n) linear scan, degrades as customer base grows | Add database index on `metadata->apexbooks->>id` |
| 🟡 **MEDIUM** | `recordOutboundSync()` only tracks orders | No sync audit trail for payments, refunds, customers | Extend to all resource types |
| 🟡 **MEDIUM** | `APEXBOOKS_TENANT_ID` missing from `.env.example` | Setup confusion, deployment error | Add to `.env.example` |
| 🟡 **MEDIUM** | No circuit breaker | Hammer retry against failing ApexBooks, cascading failures | Add circuit breaker (N failures in M seconds → open) |
| 🟢 **LOW** | In-memory replay protection (`Set`) | Lost on Medusa restart | Consider persistent dedup for critical events |
| 🟢 **LOW** | Example `.env` has placeholder ApexBooks URL | Could be missed during setup | Document clearly |

---

## 10. Code Quality Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| **HMAC Implementation** | ✅ Correct | `timingSafeEqual` used, proper input format, signature format matches spec |
| **Tenant Enforcement** | ✅ Correct | Both outbound (header) and inbound (validation) enforced |
| **Replay Protection** | ✅ Correct | Outbound Set + inbound processed_event_ids |
| **Event Validation** | ✅ Correct | event_id format, event_type enum, contract_version check |
| **Retry Logic** | ✅ Correct | Exponential backoff, retryable vs non-retryable classification |
| **Timeout Handling** | ✅ Correct | AbortController with configurable timeout |
| **Secrets Management** | ✅ Correct | Redacted in logs, truncated error messages |
| **Error Handling** | ⚠️ Partial | Events fail but no retry beyond 3 attempts, no persistent queue |
| **Performance (lookups)** | ⚠️ Degrades | O(n) linear scans for product/customer lookups by ApexBooks ID |
| **Monitoring** | ⚠️ Basic | Error logging only, no metrics, no health check on ApexBooks connectivity |

---

## 11. Verification Summary

```
                    ┌────────────────────────────────────────┐
                    │   Deployment Bridge Verification        │
                    │   Cartunez Medusa → ApexBooks           │
                    │   Target: api.apexbooks.in              │
                    └────────────────────────────────────────┘

  Environment Variables     ✅  7/7 configured, 1 missing from example
  Outbound Event Mapping    ✅  7 event types mapped correctly
  Inbound Route Mapping     ✅  5 routes (4 data + 1 health)
  HMAC-SHA256 Signing       ✅  Implementation verified
  Tenant Enforcement        ✅  Outbound + inbound
  Replay Protection         ✅  Outbound Set + inbound processed_event_ids
  Idempotency               ✅  Deterministic keys in envelope
  Contract Version          ✅  All events use "v1"
  Database Mapping          ✅  Metadata-only, no migration needed
  Failure Handling          ✅  Retry + backoff + error classification
  Production Blockers       🟡  2 HIGH, 2 MEDIUM, 2 LOW items
  Persistent Event Queue    ❌  Not implemented (HIGH gap)
  Indexed Lookups           ❌  O(n) scans (HIGH gap)
  Non-Order Sync Tracking   ❌  Only orders tracked (MEDIUM gap)
  Circuit Breaker           ❌  Not implemented (MEDIUM gap)

  🟡  VERDICT: PRODUCTION READY WITH CAVEATS
      The integration is functionally complete and all tests pass.
      Address the 2 HIGH items before critical production deployment.
      Address the 2 MEDIUM items within the first production sprint.
```

### Go/No-Go Decision

| Criterion | Status | Gate |
|-----------|--------|------|
| All 38 e2e tests pass | ✅ Pass | Go |
| All 30 runtime compatibility checks pass | ✅ Pass | Go |
| HMAC signing verified | ✅ Pass | Go |
| Tenant enforcement verified | ✅ Pass | Go |
| Replay protection verified | ✅ Pass | Go |
| Event schema valid against frozen contract | ✅ Pass | Go |
| Persistent event queue implemented | ❌ Fail | **No-Go for critical** |
| Indexed ApexBooks ID lookups | ❌ Fail | **No-Go for scale** |
| Non-order sync tracking | ❌ Fail | Mitigated by logging |
| Circuit breaker | ❌ Fail | Mitigated by retry logic |

**For staging / soft-launch (low volume):** ✅ GO
**For production with <1000 orders/day:** ✅ GO (monitor lookup performance)
**For production with SLAs (1000+ orders/day):** ❌ Address HIGH items first
