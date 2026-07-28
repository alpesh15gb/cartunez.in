import { CommerceApiError } from "@lib/commerce/medusa-v1"

/** Preserve the normalized, user-safe v1 error without logging response data. */
export default function medusaError(error: unknown): never {
  if (error instanceof CommerceApiError) throw error
  throw new CommerceApiError(
    error instanceof Error ? error.message : "The commerce request could not be completed.",
    "storefront commerce action"
  )
}
