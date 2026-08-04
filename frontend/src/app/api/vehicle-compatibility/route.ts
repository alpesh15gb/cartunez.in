import { NextRequest, NextResponse } from "next/server"

import { checkProductFitment } from "@lib/data/vehicle-compatibility"

/**
 * GET /api/vehicle-compatibility?product_id=...&make_id=...&model_id=...&year_id=...
 *
 * Resolves the selected vehicle against the real product_vehicle_compatibility
 * data (via Medusa) and reports whether the product is specifically listed
 * for it, or is a universal (fits-all) accessory.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const productId = searchParams.get("product_id")
  if (!productId) {
    return NextResponse.json({ error: "product_id is required" }, { status: 400 })
  }

  try {
    const fitment = await checkProductFitment(productId, {
      make: searchParams.get("make") || undefined,
      model: searchParams.get("model") || undefined,
      year: searchParams.get("year") || undefined,
      make_id: searchParams.get("make_id") || undefined,
      model_id: searchParams.get("model_id") || undefined,
      year_id: searchParams.get("year_id") || undefined,
    })
    return NextResponse.json(fitment)
  } catch (error) {
    console.error("[API] Vehicle compatibility error:", error)
    return NextResponse.json({ error: "Fitment check failed" }, { status: 500 })
  }
}
