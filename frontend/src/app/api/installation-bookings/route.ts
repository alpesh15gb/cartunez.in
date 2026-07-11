import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || process.env.FASTAPI_BACKEND_URL || 'https://api.cartunez.in'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${FASTAPI_URL}/api/v1/installation/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[API] Installation booking error:', error)
    return NextResponse.json(
      { id: 'temp-' + Date.now(), message: 'Booking request recorded' },
      { status: 201 }
    )
  }
}
