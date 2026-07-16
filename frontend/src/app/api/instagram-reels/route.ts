import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || process.env.FASTAPI_BACKEND_URL || 'https://api.cartunez.in'

export async function GET(_request: NextRequest) {
  try {
    const response = await fetch(`${FASTAPI_URL}/api/v1/social/instagram/reels?limit=8`, {
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      // Return empty reels on API failure
      return NextResponse.json({ reels: [] })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API] Instagram reels error:', error)
    return NextResponse.json({ reels: [] }, { status: 200 })
  }
}
