# Medusa v1 storefront migration inventory

**Status:** implemented for the active Next.js storefront. No database operation was performed.

## Call-site inventory

All calls below execute in server actions/components unless explicitly marked client-side. Native
responses remain Medusa v1 envelopes (`{ region }`, `{ products, count }`, `{ customer }`,
`{ cart }`, `{ order }`, or cart completion `{ type, data }`); no transport-wide response
mutation remains.

| Call site | Previous operation/assumption | Native v1 endpoint and response | Migration/risk |
| --- | --- | --- | --- |
| `src/lib/data/regions.ts`, middleware | v2 region type via SDK fetch | `GET /store/regions`, `GET /store/regions/:id`; `{regions}`/`{region}` | Native currency/providers retained; medium (routing depends on country map) |
| `src/lib/data/products.ts`, product/category/collection/home pages, header search, option picker | v2 query fields and synthetic calculated-price object | `GET /store/products` with v1 `region_id`, pagination/search/taxonomy query; `{products,count,offset,limit}` | Missing regional price is unavailable, never zero; high |
| `src/lib/data/variants.ts` | v2 `fields=*images` | `GET /store/product-variants/:id?expand=images,product`; `{variant}` | Native numeric `calculated_price`; medium |
| `src/lib/data/categories.ts` | v2 star-field syntax | `GET /store/product-categories` with v1 `expand`; `{product_categories,count,...}` | Category plugin must be enabled; medium |
| `src/lib/data/collections.ts` | v2 collection types | `GET /store/collections`, `GET /store/collections/:id`; native envelopes | Low |
| `src/lib/data/customer.ts` | v2 actor register/login/verification and transfer-cart APIs | `POST /store/customers`, `POST /store/auth/token`, `GET/POST /store/customers/me`, v1 address routes | JWT stored only in HTTP-only cookie; v2 verification/transfer are explicitly unsupported; high |
| `src/lib/data/cart.ts` | v2 `/items`, promo arrays, payment collections and rewritten completion | v1 cart create/retrieve/update, `/line-items`, `/discounts/:code`, `/shipping-methods`, `/payment-sessions`, `/payment-session`, `/complete`; native `{cart}` or `{type,data}` | Cart ID remains HTTP-only cookie and is refreshed from Medusa; critical |
| `src/lib/data/fulfillment.ts` | rewritten shipping query | `GET /store/shipping-options/:cartId`, calculate endpoint; native shipping options | No eligible option remains a distinct empty state; high |
| `src/lib/data/payment.ts`, checkout payment UI | v2 provider/session IDs and `payment_collection` | `GET /store/payment-providers?region_id=…`, create/select v1 sessions on cart | Manual provider ID supported; no payment success is fabricated; critical |
| `src/lib/data/orders.ts`, order/account pages | v2 fields, payment collections and order-transfer APIs | `GET /store/orders/:id`, `GET /store/customers/me/orders`; native payments and items | v2-only transfer routes return an explicit unsupported result; critical |
| `src/lib/data/locale-actions.ts` | v2 locale field written to cart | Locale remains a storefront cookie only | Medusa v1 cart is not sent an unsupported locale field; low |
| `src/modules/shipping/components/free-shipping-price-nudge` (client) | v2 shipping price-rule graph | No equivalent v1 Store response | Narrow adapter returns no nudge rather than fabricating a threshold; low |

## Boundary

`src/lib/commerce/medusa-v1/` contains explicit contracts, transport/error normalization, and
domain operations. The transport selects `MEDUSA_BACKEND_URL` on the server and
`NEXT_PUBLIC_MEDUSA_BACKEND_URL` in the browser, sends JSON with a ten-second default timeout,
uses credentials where required, supports caller abort, and never exposes server credentials.

The only retained adapters are:

1. `regionalVariantPrice`, which pairs Medusa v1's numeric calculated price with the currency
   from the returned regional price list and returns `null` if either is absent.
2. The free-shipping nudge's `null` rendering because v1 does not return the v2 conditional
   price-rule graph. It does not infer or hard-code a threshold.
3. Explicit “unsupported” results for v2-only order transfer and email-verification pages.

## Authentication and cart state

Customer registration uses the v1 customer endpoint and login uses `/store/auth/token`. The JWT
is persisted in an HTTP-only, secure-in-production, SameSite cookie; it is never exposed to
browser JavaScript or local storage. `/store/customers/me` is always authoritative and clears
an expired local token. Logout deletes the local v1 JWT.

The anonymous cart ID remains in its existing HTTP-only cookie. Login intentionally retains the
cart instead of calling the nonexistent v2 transfer endpoint or silently dropping it. Every
mutation returns and invalidates the authoritative Medusa cart. A missing cart response is
classified as `cart_expired`; the UI can create a replacement on the next deliberate cart action.

## Pricing, shipping, payment, and completion

Medusa monetary values stay integer minor units until `Intl.NumberFormat` presentation. A missing
regional amount is `null`/unavailable. Shipping methods and payment sessions are selected only
through native cart endpoints. Manual payment is labelled explicitly. Cart completion redirects
and clears the cart cookie only when Medusa returns `type: "order"`; a `type: "cart"` or error
retains the cart for correction/retry.

## Registry investigation

- Effective registry: `https://registry.npmjs.org/`.
- No repository, user, or parent `.npmrc` was found and no scoped Medusa registry override is
  committed.
- No npm authentication token is expected for public `@medusajs/admin`.
- The environment injects an HTTP(S) proxy; proxied scoped-package requests returned HTTP 403.
- Direct access without the proxy failed DNS resolution, confirming an execution-environment
  network restriction rather than an invalid repository registry.
- No Medusa lockfile exists in reachable repository history.
- Clean Medusa installation on standard registry access still requires external CI verification;
  it is not claimed here. No TLS weakening, mirror, vendoring, stub, or fabricated lockfile was used.

## Safe live verification

`npm run smoke:medusa` defaults to localhost, refuses an HTTPS/non-local URL unless
`ALLOW_PRODUCTION_SMOKE=true`, never logs supplied credentials, exercises region/product/cart
line-item lifecycle, optionally checks an explicitly supplied test customer, and never completes
an order.

## Environment, CORS, and proxy requirements

- `MEDUSA_BACKEND_URL` is the server-only origin used by SSR and server actions (for Compose,
  `http://medusa:9000`). `NEXT_PUBLIC_MEDUSA_BACKEND_URL` is the HTTPS Store API origin usable
  by browser-only search interactions. `NEXT_PUBLIC_BASE_URL` is the storefront origin.
- Medusa v1 uses `STORE_CORS` for both Store API and customer-auth requests; list the exact
  storefront origins. `ADMIN_CORS` lists only trusted admin origins. Medusa v1 has no separate
  v2 `AUTH_CORS` setting.
- The storefront JWT and cart cookies are HTTP-only, SameSite `Strict`, host-only by default,
  and `Secure` in production. A cookie domain is intentionally not configured: cookies belong
  to the storefront host and server actions forward the JWT as a Bearer header. If direct
  cross-site browser authentication is introduced later, it requires an explicit CSRF/cookie
  design rather than weakening SameSite globally.
- Production requires HTTPS. The reverse proxy must preserve `Host`, forwarding protocol, and
  request IDs; only trusted proxy hops may influence secure-request detection. `COOKIE_SECURE`
  remains true in production.
- Medusa requires PostgreSQL via `DATABASE_URL` and Redis via `REDIS_URL`; the latter backs its
  event bus/cache. `MEDUSA_PUBLIC_URL` is the externally reachable origin for local-provider
  file URLs. Local files remain a single-instance limitation.
- Only manual payment and fulfillment are configured. A selected manual payment session is a
  checkout prerequisite, not proof that funds were captured. No new provider was added here.
