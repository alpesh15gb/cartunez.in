import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || process.env.FASTAPI_BACKEND_URL || 'https://api.cartunez.in'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const makeId = searchParams.get('make_id')

    if (!makeId) {
      return NextResponse.json({ models: [] })
    }

    const response = await fetch(`${FASTAPI_URL}/api/v1/vehicles/models?make_id=${encodeURIComponent(makeId)}`, {
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return NextResponse.json({ models: [] })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API] Models error:', error)
    return NextResponse.json({ models: [] }, { status: 200 })
  }
}
