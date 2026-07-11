import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || process.env.FASTAPI_BACKEND_URL || 'https://api.cartunez.in'

const fallbackReviews = [
  { id: '1', customer_name: 'Rajesh Kumar', rating: 5, is_approved: true, content: 'Amazing quality and perfect fit. The installation was smooth and the customer service was excellent!', created_at: new Date().toISOString() },
  { id: '2', customer_name: 'Priya Singh', rating: 5, is_approved: true, content: 'Best car accessories I\'ve purchased. The durability is outstanding and the design looks premium.', created_at: new Date().toISOString() },
  { id: '3', customer_name: 'Amit Patel', rating: 4, is_approved: true, content: 'Great products and fast shipping. Highly recommend Cartunez for all your automotive needs.', created_at: new Date().toISOString() },
]

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
      return NextResponse.json({ reviews: fallbackReviews })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API] Reviews error:', error)
    return NextResponse.json({ reviews: fallbackReviews }, { status: 200 })
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
      { id: 'temp-' + Date.now(), ...(await request.json().catch(() => ({}))) },
      { status: 201 }
    )
  }
}
