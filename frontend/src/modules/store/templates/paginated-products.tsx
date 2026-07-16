import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { OptionValueIds } from "@lib/util/product-option-filters"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import Link from "next/link"
import { SearchX } from "lucide-react"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  optionValueIds,
  minPrice,
  maxPrice,
  brand,
  make,
  model,
  year,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  optionValueIds?: OptionValueIds
  minPrice?: number
  maxPrice?: number
  brand?: string
  make?: string
  model?: string
  year?: string
}) {
  const queryParams: PaginatedProductsParams = {
    limit: 12,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const {
    response: { products, count },
  } = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
    optionValueIds,
    minPrice,
    maxPrice,
    brand,
    make,
    model,
    year,
  })

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  if (!products.length) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[var(--radius-lg)] border border-gray-200 bg-white px-6 py-16 text-center shadow-[var(--shadow-card)]">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 text-gray-400 ring-1 ring-gray-200">
          <SearchX size={24} strokeWidth={1.6} />
        </div>
        <h2 className="text-xl font-display font-black uppercase tracking-tight text-gray-900">
          No matching products
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
          Try clearing filters or adjusting your vehicle fitment to see more compatible accessories.
        </p>
        <Link
          href={`/${countryCode}/store`}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-[var(--radius-sm)] bg-brand px-6 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-all hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
        >
          Clear Filters
        </Link>
      </div>
    )
  }

  return (
    <>
      <ul
        className="grid grid-cols-2 w-full xsmall:grid-cols-3 small:grid-cols-3 medium:grid-cols-4 gap-4 xsmall:gap-5 small:gap-6 medium:gap-8"
        data-testid="products-list"
      >
        {products.map((p) => {
          return (
            <li key={p.id}>
              <ProductPreview product={p} region={region} />
            </li>
          )
        })}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
