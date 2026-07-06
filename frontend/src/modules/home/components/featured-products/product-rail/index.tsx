import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import Link from "next/link"
import ProductPreview from "@modules/products/components/product-preview"

export default async function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "*variants.calculated_price",
    },
  })

  if (!pricedProducts || pricedProducts.length === 0) {
    return null
  }

  return (
    <section className="bg-white border-t border-gray-100 py-20">
      <div className="content-container">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div className="space-y-2">
            <span className="eyebrow">Featured Collection</span>
            <h2
              className="font-display font-black uppercase text-gray-900 leading-none"
              style={{ fontSize: "clamp(32px, 4vw, 52px)", letterSpacing: "-0.02em" }}
            >
              {collection.title}
            </h2>
          </div>
          <Link
            href={`/collections/${collection.handle}`}
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest
                       text-gray-400 hover:text-brand transition-colors duration-300 group"
          >
            <span>View All</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* Product grid */}
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {pricedProducts.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} isFeatured />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
