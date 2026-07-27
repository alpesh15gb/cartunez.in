import { CommerceApiError, commerceErrorFromResponse } from "./errors"

export interface RequestOptions<TBody = unknown> {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  query?: Record<string, unknown>
  body?: TBody
  headers?: HeadersInit
  signal?: AbortSignal
  timeoutMs?: number
  cache?: RequestCache
  next?: { revalidate?: number | false; tags?: string[] }
  credentials?: RequestCredentials
}

function baseUrl() {
  const configured = typeof window === "undefined"
    ? process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
    : process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  return (configured || "http://localhost:9000").replace(/\/$/, "")
}

function queryString(query?: Record<string, unknown>) {
  const params = new URLSearchParams()
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return
    const values = Array.isArray(value) ? value : [value]
    values.forEach((entry) => params.append(key, String(entry)))
  })
  const encoded = params.toString()
  return encoded ? `?${encoded}` : ""
}

export async function request<TResponse, TBody = unknown>(operation: string, path: string, options: RequestOptions<TBody> = {}): Promise<TResponse> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort("timeout"), options.timeoutMs ?? 10_000)
  const abort = () => controller.abort(options.signal?.reason)
  if (options.signal?.aborted) abort()
  else options.signal?.addEventListener("abort", abort, { once: true })
  try {
    const init: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
      method: options.method || "GET",
      headers: { Accept: "application/json", ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}), ...options.headers },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: options.credentials || "include",
      signal: controller.signal,
      cache: options.cache,
      next: options.next,
    }
    const response = await fetch(`${baseUrl()}${path}${queryString(options.query)}`, init)
    const contentType = response.headers.get("content-type") || ""
    const payload: unknown = contentType.includes("application/json") ? await response.json() : await response.text()
    if (!response.ok) throw commerceErrorFromResponse(response.status, operation, payload, response.headers.get("x-request-id") || undefined)
    if (response.status === 204) return undefined as TResponse
    return payload as TResponse
  } catch (error) {
    if (error instanceof CommerceApiError) throw error
    if (controller.signal.aborted) {
      const timedOut = !options.signal?.aborted
      throw new CommerceApiError(timedOut ? "The commerce request timed out." : "The commerce request was cancelled.", operation, 0, undefined, timedOut ? "timeout" : "aborted")
    }
    throw new CommerceApiError("The commerce service could not be reached.", operation, 0, undefined, "network")
  } finally {
    clearTimeout(timeout)
    options.signal?.removeEventListener("abort", abort)
  }
}
