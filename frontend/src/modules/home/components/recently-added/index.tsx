import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"

export default async function RecentlyAdded({
  region,
}: {
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      limit: 8,
      fields: "*variants.calculated_price",
      order: "-created_at",
    },
  })

  if (!products || products.length === 0) {
    return null
  }

  return (
    <section className="bg-white border-t border-gray-100 py-16 lg:py-20">
      <div className="content-container">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div className="space-y-2">
            <span className="eyebrow">Just Landed</span>
            <h2
              className="font-display font-black uppercase text-gray-900 leading-none"
              style={{ fontSize: "clamp(32px, 4vw, 52px)", letterSpacing: "-0.02em" }}
            >
              Recently
              <br />
              <span className="text-[var(--color-brand)]">Added</span>
            </h2>
            <div className="w-10 h-[3px] bg-[var(--color-brand)] mt-3" />
          </div>
          <p className="text-sm text-gray-500 max-w-xs font-medium leading-relaxed">
            Fresh drops added this week — be the first to upgrade your ride.
          </p>
        </div>

        {/* Product grid */}
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {products.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} isFeatured />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
