import { medusaRequest } from "@lib/commerce/medusa-v1"
import type { RequestOptions } from "@lib/commerce/medusa-v1/http-client"

/** Native Medusa v1 transport. Domain operations live in lib/commerce/medusa-v1. */
export const commerceClient = {
  fetch<TResponse, TBody = unknown>(path: string, options: RequestOptions<TBody> = {}) {
    return medusaRequest<TResponse, TBody>(`${options.method || "GET"} ${path}`, path, options)
  },
}
