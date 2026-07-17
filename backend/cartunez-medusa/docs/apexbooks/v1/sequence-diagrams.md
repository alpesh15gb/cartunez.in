# ApexBooks Integration Contract v1 - Sequence Diagrams

## Order Created

```mermaid
sequenceDiagram
  participant Buyer
  participant Medusa
  participant ApexBooks
  Buyer->>Medusa: Complete checkout
  Medusa->>Medusa: Emit order.placed
  Medusa->>ApexBooks: POST order.created (Idempotency-Key)
  ApexBooks-->>Medusa: 202 accepted + apexbooks_order_id/invoice_id
  Medusa->>Medusa: Store ApexBooks IDs in order metadata
```

## Payment Captured

```mermaid
sequenceDiagram
  participant Medusa
  participant ApexBooks
  Medusa->>Medusa: Emit payment.captured
  Medusa->>ApexBooks: POST payment.captured
  ApexBooks-->>Medusa: 202 accepted + apexbooks_payment_id
  Medusa->>Medusa: Store ApexBooks payment ID in metadata
```

## Refund Created

```mermaid
sequenceDiagram
  participant Medusa
  participant ApexBooks
  Medusa->>Medusa: Emit refund.created
  Medusa->>ApexBooks: POST payment.refunded with original invoice reference
  ApexBooks-->>Medusa: 202 accepted + credit note/refund reference
  Medusa->>Medusa: Store ApexBooks refund metadata
```

## Product Update From ApexBooks

```mermaid
sequenceDiagram
  participant ApexBooks
  participant Medusa
  ApexBooks->>Medusa: POST /apexbooks/v1/webhooks/products
  Medusa->>Medusa: Verify HMAC signature
  Medusa->>Medusa: Check processed_event_ids
  Medusa->>Medusa: Upsert product metadata and storefront fields
  Medusa-->>ApexBooks: 202 accepted
```

## Inventory Update From ApexBooks

```mermaid
sequenceDiagram
  participant ApexBooks
  participant Medusa
  ApexBooks->>Medusa: POST /apexbooks/v1/webhooks/inventory
  Medusa->>Medusa: Verify HMAC signature
  Medusa->>Medusa: Update variant inventory by ApexBooks variant ID
  Medusa-->>ApexBooks: 202 accepted
```

## Retry And Idempotency

```mermaid
sequenceDiagram
  participant Medusa
  participant ApexBooks
  Medusa->>ApexBooks: POST event with Idempotency-Key
  ApexBooks--xMedusa: 500/network timeout
  Medusa->>Medusa: Exponential backoff
  Medusa->>ApexBooks: Retry same payload and Idempotency-Key
  ApexBooks-->>Medusa: Existing result or accepted result
```
