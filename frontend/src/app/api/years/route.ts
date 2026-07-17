import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.cartunez.in'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modelId = searchParams.get('model_id')

    if (!modelId) {
      return NextResponse.json({ years: [] })
    }

    const response = await fetch(`${FASTAPI_URL}/api/v1/vehicles/years?model_id=${encodeURIComponent(modelId)}`, {
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return NextResponse.json({ years: [] })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API] Years error:', error)
    return NextResponse.json({ years: [] }, { status: 200 })
  }
}
