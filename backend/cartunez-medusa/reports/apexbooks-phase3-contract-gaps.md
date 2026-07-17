# ApexBooks Phase 3 Contract Gaps — v2 Requirements

Date: 2026-07-18

Scope: `backend/cartunez-medusa`

The following items are **not implemented** in the Phase 3 runtime/security fixes. They require contract changes and are deferred to a future v2 contract.

---

### 1. ApexBooks Receiving URL

**Status: Not implemented — deferred to v2**

The frozen v1 artifacts define Medusa-side inbound webhook endpoints (`/apexbooks/v1/webhooks/...`) but do not define the ApexBooks-side receiving URL for Medusa → ApexBooks outbound calls. The runtime currently hardcodes:

```
POST {APEXBOOKS_BASE_URL}/webhooks/medusa/events
```

**v2 requirement:**
- Contract should specify the receiving ApexBooks endpoint path and method
- Consider making the URL configurable to support different environments (staging, production)
- Define response schema expectations for the ApexBooks receiving endpoint

---

### 2. Accounting Response Schema

**Status: Not implemented — deferred to v2**

The frozen v1 artifacts do not define an accounting response schema for Medusa → ApexBooks order events. The runtime currently accepts any successful JSON body and records `response.id || response.event_id || null` into order metadata.

**v2 requirement:**
- Define a response schema for ApexBooks → Medusa responses to outbound order events
- Include at minimum: `acknowledgement_id`, `status`, `invoice_reference` (if applicable), `errors` (if any)
- Define retry vs. abandon semantics based on response fields

---

### 3. Invoice Policy

**Status: Not implemented — deferred to v2**

The runtime maps `order.metadata.apexbooks.invoice_id` to the `order.apexbooks_invoice_id` field in outbound order payloads. The contract does not define:

- When an invoice must or must not exist for `order.created` / `order.updated` / `order.cancelled`
- Whether an invoice should be created before or after order event delivery
- The relationship between invoice lifecycle and order status transitions
- Invoice cancellation/reversal policy

**v2 requirement:**
- Define invoice creation trigger relative to order event flow
- Define which order statuses require an invoice and which prohibit one
- Document invoice cancellation and reversal procedures
- Define the expected `apexbooks_invoice_id` population rules in Medusa metadata

---

### 4. Immutable Field Rules

**Status: Not implemented — deferred to v2**

The frozen v1 contract does not specify which fields in order payloads are immutable after creation. Potential candidates for immutability:

- `medusa_order_id`
- `currency_code`
- `customer.medusa_customer_id`
- `items[].medusa_line_item_id`
- `items[].medusa_variant_id`

**v2 requirement:**
- Define immutable fields for order payloads
- Specify enforcement mechanism (reject vs. ignore on ApexBooks side)
- Document migration strategy if immutable fields need to change

---

### 5. Cancellation Policy

**Status: Noted — partial coverage in v1**

Medusa `order.canceled` maps to ApexBooks `order.cancelled`. The v1 contract defines the event mapping and British spelling convention but does not specify:

- Cancellation reason taxonomy
- Whether cancelled orders can transition to other states
- Refund obligation on cancellation
- Time window for cancellation after creation

---

### 6. Payment / Refund / Return Order Coupling

**Status: Noted — implicit in v1**

The relationships between `payment.captured`, `payment.refunded`, `return.created`, and their parent order are implicit in `medusa_order_id` fields. The contract does not define:

- Whether a refund requires a preceding captured payment
- Whether a return requires a preceding delivered order
- State machine constraints between these event types

---

### Summary

| Gap | Priority | Requires Schema Change | Requires Behavioral Spec |
|-----|----------|------------------------|--------------------------|
| ApexBooks receiving URL | High | No | Yes |
| Accounting response schema | High | Yes | Yes |
| Invoice policy | High | No | Yes |
| Immutable field rules | Medium | Yes | Yes |
| Cancellation policy | Low | No | Yes |
| Payment/Refund/Return coupling | Low | No | Yes |

These gaps should be addressed as part of a v2 contract design effort before production deployment.
