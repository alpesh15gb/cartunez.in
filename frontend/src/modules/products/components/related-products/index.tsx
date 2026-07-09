import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import Product from "../product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const queryParams: HttpTypes.StoreProductListParams = {}
  if (region?.id) {
    queryParams.region_id = region.id
  }
  if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }
  if (product.tags) {
    queryParams.tag_id = product.tags
      .map((t) => t.id)
      .filter(Boolean) as string[]
  }
  queryParams.is_giftcard = false

  const products = await listProducts({
    queryParams,
    countryCode,
  }).then(({ response }) => {
    return response.products.filter(
      (responseProduct) => responseProduct.id !== product.id
    )
  })

  if (!products.length) {
    return null
  }

  return (
    <div className="relative">
      <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x snap-mandatory -mx-4 sm:-mx-6 lg:-mx-10 xl:-mx-12 px-4 sm:px-6 lg:px-10 xl:px-12">
        {products.map((product) => (
          <div
            key={product.id}
            className="min-w-[260px] sm:min-w-[280px] lg:min-w-[300px] max-w-[300px] flex-shrink-0 snap-start"
          >
            <Product region={region} product={product} />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute right-0 top-0 bottom-6 w-24 bg-gradient-to-l from-gray-50 to-transparent" />
      <div className="pointer-events-none absolute left-0 top-0 bottom-6 w-24 bg-gradient-to-r from-gray-50 to-transparent" />
    </div>
  )
}
