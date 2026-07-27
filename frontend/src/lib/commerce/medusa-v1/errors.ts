import type { StoreApiErrorBody } from "./types"

export type CommerceErrorKind =
  | "authentication"
  | "cart_expired"
  | "inventory_conflict"
  | "invalid_variant"
  | "not_found"
  | "timeout"
  | "aborted"
  | "validation"
  | "server"
  | "network"
  | "unknown"

export class CommerceApiError extends Error {
  constructor(
    message: string,
    readonly operation: string,
    readonly status = 0,
    readonly code?: string,
    readonly kind: CommerceErrorKind = "unknown",
    readonly fieldErrors?: Record<string, string[]>,
    readonly requestId?: string
  ) {
    super(message)
    this.name = "CommerceApiError"
  }

  get retryable() { return this.kind === "network" || this.kind === "timeout" || this.status >= 500 }
  get authenticationExpired() { return this.kind === "authentication" && this.status === 401 }
  get cartExpired() { return this.kind === "cart_expired" }
  get inventoryConflict() { return this.kind === "inventory_conflict" }
}

const safeMessage = (status: number, body?: StoreApiErrorBody) => {
  const detail = `${body?.code || ""} ${body?.type || ""} ${body?.message || ""}`.toLowerCase()
  if (status === 401) return "Your session has expired or the credentials are invalid."
  if (status === 404) return "The requested commerce resource was not found."
  if (detail.includes("inventory") || detail.includes("stock")) return "The requested quantity is no longer available."
  if (detail.includes("variant")) return "The selected product option is unavailable."
  if (detail.includes("address")) return "Please check the address and try again."
  if (detail.includes("shipping")) return "A valid shipping method is required."
  if (status === 409 || status === 422) return "The request conflicts with current availability."
  if (status >= 500) return "The commerce service is temporarily unavailable."
  return body?.message || "The commerce request could not be completed."
}

export function commerceErrorFromResponse(status: number, operation: string, value: unknown, requestId?: string) {
  const body = value && typeof value === "object" ? value as StoreApiErrorBody : undefined
  const text = `${body?.code || ""} ${body?.type || ""} ${body?.message || ""}`.toLowerCase()
  let kind: CommerceErrorKind = status === 401 ? "authentication" : status === 404 ? "not_found" : status === 422 ? "validation" : status >= 500 ? "server" : "unknown"
  if (text.includes("cart") && status === 404) kind = "cart_expired"
  if (text.includes("inventory") || text.includes("stock")) kind = "inventory_conflict"
  if (text.includes("variant") && status < 500) kind = "invalid_variant"
  return new CommerceApiError(safeMessage(status, body), operation, status, body?.code || body?.type, kind, body?.errors, requestId || body?.request_id)
}
