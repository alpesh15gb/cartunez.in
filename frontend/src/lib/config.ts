import { getLocaleHeader } from "@lib/util/get-locale-header"
import Medusa, { FetchArgs, FetchInput } from "@medusajs/js-sdk"

// Defaults to standard port for Medusa server
let MEDUSA_BACKEND_URL = "http://localhost:9000"

if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
  MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
}

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})

const originalFetch = sdk.client.fetch.bind(sdk.client)

function mapProduct(product: unknown): unknown {
  if (!product || typeof product !== "object") return product
  const p = product as Record<string, unknown>
  const variants = p.variants
  if (Array.isArray(variants)) {
    const mappedVariants = variants.map((variant) => {
      if (!variant || typeof variant !== "object") return variant
      const v = variant as Record<string, unknown>
      const prices = v.prices
      let calculatedPrice = {
        calculated_amount: 0,
        original_amount: 0,
        currency_code: "inr",
        calculated_price: {
          price_list_type: "default",
        },
      }
      if (Array.isArray(prices) && prices.length > 0) {
        const primaryPrice = prices[0]
        if (primaryPrice && typeof primaryPrice === "object") {
          const pr = primaryPrice as Record<string, unknown>
          calculatedPrice = {
            calculated_amount: typeof pr.amount === "number" ? pr.amount : 0,
            original_amount: typeof pr.amount === "number" ? pr.amount : 0,
            currency_code:
              typeof pr.currency_code === "string"
                ? pr.currency_code.toLowerCase()
                : "inr",
            calculated_price: {
              price_list_type: "default",
            },
          }
        }
      }
      return {
        ...v,
        calculated_price: calculatedPrice,
      }
    })
    return {
      ...p,
      variants: mappedVariants,
    }
  }
  return product
}

function mapCart(cart: unknown): unknown {
  if (!cart || typeof cart !== "object") return cart
  const c = cart as Record<string, unknown>
  const paymentSessions = c.payment_sessions
  const selectedSession = c.payment_session as
    | Record<string, unknown>
    | undefined
  let paymentCollection = c.payment_collection
  if (Array.isArray(paymentSessions)) {
    paymentCollection = {
      payment_sessions: paymentSessions.map((s) => {
        if (!s || typeof s !== "object") return s
        const session = s as Record<string, unknown>
        const isSelected =
          selectedSession &&
          selectedSession.provider_id === session.provider_id
        return {
          ...session,
          status: isSelected ? "pending" : "active",
        }
      }),
    }
  }
  const items = c.items
  let mappedItems = items
  if (Array.isArray(items)) {
    mappedItems = items.map((item) => {
      if (!item || typeof item !== "object") return item
      const i = item as Record<string, unknown>
      if (i.product) {
        return {
          ...i,
          product: mapProduct(i.product),
        }
      }
      return i
    })
  }
  return {
    ...c,
    payment_collection: paymentCollection,
    items: mappedItems,
  }
}

function mapOrder(order: unknown): unknown {
  if (!order || typeof order !== "object") return order
  const o = order as Record<string, unknown>
  const payments = o.payments
  let paymentCollections = o.payment_collections
  if (Array.isArray(payments)) {
    paymentCollections = [
      {
        payments,
      },
    ]
  }
  const items = o.items
  let mappedItems = items
  if (Array.isArray(items)) {
    mappedItems = items.map((item) => {
      if (!item || typeof item !== "object") return item
      const i = item as Record<string, unknown>
      if (i.product) {
        return {
          ...i,
          product: mapProduct(i.product),
        }
      }
      return i
    })
  }
  return {
    ...o,
    payment_collections: paymentCollections,
    items: mappedItems,
  }
}

sdk.client.fetch = async <T>(
  input: FetchInput,
  init?: FetchArgs
): Promise<T> => {
  // ── Medusa v2→v1 path rewriting ──
  const rawUrl = typeof input === "string" ? input : input instanceof Request ? input.url : String(input)
  let rewritten = rawUrl
  // POST /store/carts/:id/items → POST /store/carts/:id/line-items
  rewritten = rewritten.replace(/\/store\/carts\/([^/]+)\/items\/?(\?|$)/, "/store/carts/$1/line-items$2")
  // DELETE/PATCH /store/carts/:id/items/:itemId → /store/carts/:id/line-items/:itemId
  rewritten = rewritten.replace(/\/store\/carts\/([^/]+)\/items\/([^/?]+)/, "/store/carts/$1/line-items/$2")
  // POST /store/shipping-options with query cart_id → path param
  rewritten = rewritten.replace(/\/store\/shipping-options\?cart_id=([^&]+)/, "/store/shipping-options/$1")
  if (rewritten !== rawUrl) {
    if (typeof input === "string") {
      input = rewritten
    } else if (input instanceof Request) {
      input = new Request(rewritten, input)
    }
  }
  const headers = init?.headers ?? {}
  let localeHeader: Record<string, string | null> | undefined
  try {
    localeHeader = await getLocaleHeader()
    headers["x-medusa-locale"] ??= localeHeader["x-medusa-locale"]
  } catch {}

  const newHeaders = {
    ...localeHeader,
    ...headers,
  }

  const query = init?.query
    ? ({ ...init.query } as Record<string, unknown>)
    : undefined
  if (query) {
    delete query.fields
    delete query.expand
  }

  let body = init?.body
  if (body) {
    if (typeof body === "string") {
      try {
        const parsedBody = JSON.parse(body) as Record<string, unknown>
        if (parsedBody.promo_codes && Array.isArray(parsedBody.promo_codes)) {
          parsedBody.discounts = parsedBody.promo_codes.map((code) => ({
            code,
          }))
          delete parsedBody.promo_codes
        }
        body = JSON.stringify(parsedBody)
      } catch {}
    } else if (typeof body === "object") {
      const bodyObj = { ...body } as Record<string, unknown>
      if (bodyObj.promo_codes && Array.isArray(bodyObj.promo_codes)) {
        bodyObj.discounts = bodyObj.promo_codes.map((code) => ({ code }))
        delete bodyObj.promo_codes
      }
      body = bodyObj
    }
  }

  const newInit = {
    ...init,
    headers: newHeaders,
    query,
    body,
  }

  const response = await originalFetch(input, newInit)
  if (response && typeof response === "object") {
    const resp = response as Record<string, unknown>
    if (resp.type === "order" && resp.data) {
      resp.order = mapOrder(resp.data)
    } else if (resp.type === "cart" && resp.data) {
      resp.cart = mapCart(resp.data)
    }
    if (resp.products && Array.isArray(resp.products)) {
      resp.products = resp.products.map(mapProduct)
    }
    if (resp.product) {
      resp.product = mapProduct(resp.product)
    }
    if (resp.cart) {
      resp.cart = mapCart(resp.cart)
    }
    if (resp.carts && Array.isArray(resp.carts)) {
      resp.carts = resp.carts.map(mapCart)
    }
    if (resp.order) {
      resp.order = mapOrder(resp.order)
    }
    if (resp.orders && Array.isArray(resp.orders)) {
      resp.orders = resp.orders.map(mapOrder)
    }
  }
  return response as T
}
