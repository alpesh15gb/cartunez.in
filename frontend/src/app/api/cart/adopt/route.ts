import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * Adopt a cart created by the AI chatbot into the storefront checkout.
 *
 * The chat widget runs client-side, so it cannot write the httpOnly
 * `_medusa_cart_id` cookie itself. This route does it server-side, then the
 * widget redirects to /checkout where the regular Medusa flow takes over
 * (addresses → delivery → payment).
 */
export async function POST(request: NextRequest) {
  let body: { cart_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 })
  }

  const cartId = body?.cart_id
  if (!cartId || typeof cartId !== "string" || cartId.length < 8) {
    return NextResponse.json({ ok: false, error: "cart_id required" }, { status: 400 })
  }

  const cookieStore = await cookies()
  cookieStore.set("_medusa_cart_id", cartId, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })

  return NextResponse.json({ ok: true })
}
