"use server"
import { cookies as nextCookies } from "next/headers"
import { redirect } from "next/navigation"

export async function resetOnboardingState(orderId: string) {
  const cookies = await nextCookies()
  cookies.set("_medusa_onboarding", "false", { maxAge: -1 })
  // Use environment variable for admin URL, fallback to production admin
  const adminBaseUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.cartunez.in"
  redirect(`${adminBaseUrl}/a/orders/${orderId}`)
}
