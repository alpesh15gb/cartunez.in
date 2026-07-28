/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import type * as HttpTypes from "@lib/commerce/medusa-v1/types"
import { getBaseURL } from "@lib/util/env"
import { productJsonLd } from "@lib/seo/jsonld"
export const dynamic = "force-dynamic"
type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}
function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
): HttpTypes.StoreProductImage[] {
  if (selectedVariantId && product.variants) {
    const variant = product.variants.find((v) => v.id === selectedVariantId)
    if (variant?.images?.length) {
      const variantImageIds = new Set(variant.images.map((i) => i.id))
      const filtered = product.images?.filter((i) => variantImageIds.has(i.id)) ?? []
      if (filtered.length > 0) return filtered
    }
  }
  if (product.images?.length) {
    return product.images
  }
  if (product.thumbnail) {
    return [
      {
        id: `thumb-${product.id}`,
        url: product.thumbnail,
      } as HttpTypes.StoreProductImage,
    ]
  }
  return []
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle },
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  const desc = product.description?.replace(/<[^>]*>/g, "").slice(0, 160) || `Shop ${product.title} at Cartunez.`

  return {
    title: `${product.title} | Cartunez`,
    description: desc,
    openGraph: {
      title: `${product.title} - Premium Car Accessories | Cartunez`,
      description: desc,
      images: product.thumbnail
        ? [{ url: product.thumbnail, width: 1200, height: 630, alt: product.title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} | Cartunez`,
      description: desc,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
    robots: { index: true, follow: true },
    alternates: { canonical: `${getBaseURL()}/products/${handle}` },
  }
}


export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)
  const searchParams = await props.searchParams

  const selectedVariantId = searchParams.v_id

  if (!region) {
    notFound()
  }

  const pricedProduct = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle: params.handle },
  }).then(({ response }) => response.products[0])

  if (!pricedProduct) {
    notFound()
  }

  const images = getImagesForVariant(pricedProduct, selectedVariantId)

  // Generate product JSON-LD
  const cheapestVariant = pricedProduct.variants?.reduce((min, v) => {
    const price = v.calculated_price ?? Number.POSITIVE_INFINITY
    const minPrice = min.calculated_price ?? Number.POSITIVE_INFINITY
    return price < minPrice ? v : min
  }, pricedProduct.variants?.[0])

  const productPrice = cheapestVariant?.calculated_price
  const brand = typeof pricedProduct.metadata?.brand === "string"
    ? pricedProduct.metadata.brand
    : "Cartunez"

  const productLd = productJsonLd({
    id: pricedProduct.id,
    title: pricedProduct.title,
    description: pricedProduct.description,
    thumbnail: pricedProduct.thumbnail,
    url: `${getBaseURL()}/products/${pricedProduct.handle}`,
    price: productPrice === undefined ? undefined : productPrice / 100,
    currency: region.currency_code.toUpperCase(),
    availability:
      pricedProduct.variants?.some(
        (v) => v.manage_inventory && (v.inventory_quantity || 0) > 0
      )
        ? "InStock"
        : "OutOfStock",
    brand,
    sku: cheapestVariant?.sku || undefined,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: productLd }}
      />
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode={params.countryCode}
        images={images ?? []}
      />
    </>
  )
}
