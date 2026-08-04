import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://cartunez.in'

export async function GET(_request: NextRequest) {
  try {
    const response = await fetch(`${FASTAPI_URL}/api/v1/vehicles/makes?limit=100`, {
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return NextResponse.json({ makes: [] })
    }

    const data = await response.json()
    return NextResponse.json({ makes: Array.isArray(data) ? data : data.makes || [] })
  } catch (error) {
    console.error('[API] Makes error:', error)
    return NextResponse.json({ makes: [] }, { status: 200 })
  }
}
