import { Suspense } from "react"
import Link from "next/link"

import { OptionValueIds } from "@lib/util/product-option-filters"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  sortBy,
  page,
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
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
  minPrice?: number
  maxPrice?: number
  brand?: string
  make?: string
  model?: string
  year?: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* -- Premium Header -- */}
      <div className="border-b border-gray-100 bg-white py-12 sm:py-16 lg:py-20">
        <div className="content-container">
          <nav className="flex items-center gap-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-5">
            <Link href="/" className="hover:text-gray-900 transition-colors duration-200">Home</Link>
            <span className="text-gray-300 mx-1">/</span>
            <span className="text-gray-900 font-semibold">Store</span>
          </nav>

          <div className="space-y-3">
            <span className="eyebrow">Premium Automotive Accessories</span>
            <h1
              className="text-h1 text-[clamp(2.5rem,5.5vw,5rem)] text-gray-950"
              data-testid="store-page-title"
            >
              All Products
            </h1>
            <p className="text-sm text-gray-500 font-medium max-w-xl">
              Discover curated performance accessories for your vehicle. Each product is verified for quality and fitment.
            </p>
          </div>
        </div>
      </div>

      {/* -- Content -- */}
      <div
        className="content-container flex flex-col gap-8 py-8 lg:flex-row lg:items-start lg:gap-10 lg:py-12"
        data-testid="category-container"
      >
        <details className="surface-card group lg:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-sm font-bold text-gray-900 marker:content-none">
            Filters and sorting
            <span aria-hidden="true" className="text-brand transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="border-t border-gray-200 p-5"><RefinementList sortBy={sort} hideOptionsPicker /></div>
        </details>
        <aside className="hidden w-72 shrink-0 lg:block" aria-label="Product filters">
          <div className="sticky top-28 space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Filters</h3>
              <RefinementList sortBy={sort} hideOptionsPicker />
            </div>
          </div>
        </aside>
        <div className="flex-1 min-w-0">
          <Suspense fallback={<SkeletonProductGrid />}>
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              countryCode={countryCode}
              optionValueIds={optionValueIds}
              minPrice={minPrice}
              maxPrice={maxPrice}
              brand={brand}
              make={make}
              model={model}
              year={year}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default StoreTemplate
