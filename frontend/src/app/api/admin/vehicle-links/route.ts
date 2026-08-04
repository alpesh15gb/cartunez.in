import { NextRequest, NextResponse } from 'next/server'

/**
 * Admin-only vehicle fitment management.
 *
 * Security model:
 *  - Requires `X-Admin-Key` matching `API_ADMIN_KEY` (same convention as FastAPI).
 *  - Runs server-side, so it talks to Medusa directly (MEDUSA_BACKEND_URL).
 *    In the docker stack that is `http://medusa:9000` on the internal network,
 *    bypassing nginx's GET-only `/vehicle/` edge rule for writes.
 *
 * GET ?product_id=<id>  -> current compatibility links for a product
 * GET ?q=<term>         -> search Medusa products (for the picker)
 * POST {product_id, variant_ids} -> replace a product's compatibility links
 */

const MEDUSA_URL = (process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000').replace(/\/$/, '')
const ADMIN_KEY = process.env.API_ADMIN_KEY || ''

interface CompatRow {
  id: string
  product_id: string
  vehicle_variant_id?: string
  fitment_type?: string
  notes?: string
  vehicle_variant?: {
    id: string
    name: string
    year?: {
      year: number
      model?: { name: string; make?: { name: string } }
    }
  }
}

function isAuthorized(request: NextRequest): boolean {
  if (!ADMIN_KEY) return false
  const key = request.headers.get('x-admin-key')
  return !!key && key === ADMIN_KEY
}

function flatLinks(rows: CompatRow[]) {
  return (rows || []).map((row) => {
    const variant = row.vehicle_variant
    return {
      id: row.id,
      variant_id: row.vehicle_variant_id || variant?.id || '',
      fitment_type: row.fitment_type || 'exact',
      make: variant?.year?.model?.make?.name || '',
      model: variant?.year?.model?.name || '',
      year: variant?.year?.year || null,
      variant_name: variant?.name || '',
    }
  })
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('product_id')
  const q = searchParams.get('q')

  try {
    // Product search for the picker
    if (q) {
      const response = await fetch(
        `${MEDUSA_URL}/store/products?q=${encodeURIComponent(q)}&limit=10&expand=images`,
        { headers: { Accept: 'application/json' }, next: { revalidate: 0 } }
      )
      if (!response.ok) {
        return NextResponse.json({ error: 'Product search failed' }, { status: 502 })
      }
      const data = await response.json()
      return NextResponse.json({
        products: (data.products || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          handle: p.handle,
          thumbnail: p.thumbnail,
        })),
      })
    }

    if (!productId) {
      return NextResponse.json({ error: 'Missing product_id' }, { status: 400 })
    }

    const response = await fetch(`${MEDUSA_URL}/vehicle/compatibility/${productId}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    })
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to load compatibility' }, { status: 502 })
    }
    const data = await response.json()
    return NextResponse.json({ links: flatLinks(data.compatibility || []) })
  } catch (error) {
    console.error('[Admin] vehicle-links GET error:', error)
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 502 })
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { product_id?: string; variant_ids?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { product_id, variant_ids } = body
  if (!product_id || !Array.isArray(variant_ids)) {
    return NextResponse.json({ error: 'product_id and variant_ids[] required' }, { status: 400 })
  }

  try {
    const response = await fetch(`${MEDUSA_URL}/vehicle/compatibility/${product_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ variant_ids }),
    })
    if (!response.ok) {
      const text = await response.text()
      console.error('[Admin] vehicle-links POST failed:', response.status, text)
      return NextResponse.json({ error: `Medusa returned ${response.status}` }, { status: 502 })
    }
    const data = await response.json()
    return NextResponse.json({ ok: true, compatibility: data.compatibility || [] })
  } catch (error) {
    console.error('[Admin] vehicle-links POST error:', error)
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 502 })
  }
}
