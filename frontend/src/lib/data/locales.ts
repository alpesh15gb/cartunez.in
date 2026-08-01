"use server"

export type Locale = {
  code: string
  name: string
}

/**
 * Fetches available locales from the backend.
 * Returns null if the endpoint returns 404 (locales not configured).
 */
export const listLocales = async (): Promise<Locale[] | null> => {
  // Medusa v1 has no /store/locales endpoint; this store is single-region
  // (India), so return the one supported locale directly.
  return [{ code: "in", name: "India" }]
}
