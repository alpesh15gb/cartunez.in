import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://cartunez.in'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')
    const limit = searchParams.get('limit') || '10'

    let url = `${FASTAPI_URL}/api/v1/reviews?limit=${limit}`
    if (productId) url += `&product_id=${encodeURIComponent(productId)}`

    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      // Never fabricate reviews: return an empty list on failure.
      return NextResponse.json({ reviews: [] })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API] Reviews error:', error)
    return NextResponse.json({ reviews: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${FASTAPI_URL}/api/v1/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[API] Create review error:', error)
    return NextResponse.json(
      { error: 'Failed to create review. Please try again.' },
      { status: 500 }
    )
  }
}
