import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://cartunez.in'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const yearId = searchParams.get('year_id')

    if (!yearId) {
      return NextResponse.json({ variants: [] })
    }

    const response = await fetch(
      `${FASTAPI_URL}/api/v1/vehicles/variants?vehicle_year_id=${encodeURIComponent(yearId)}&limit=100`,
      {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 60 },
      }
    )

    if (!response.ok) {
      return NextResponse.json({ variants: [] })
    }

    const data = await response.json()
    return NextResponse.json({ variants: Array.isArray(data) ? data : data.variants || [] })
  } catch (error) {
    console.error('[API] Variants error:', error)
    return NextResponse.json({ variants: [] }, { status: 200 })
  }
}
