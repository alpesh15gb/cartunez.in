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
      <div className="border-b border-gray-100 bg-white py-16 sm:py-20">
        <div className="content-container">
          <nav className="flex items-center gap-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-5">
            <Link href="/" className="hover:text-gray-900 transition-colors duration-200">Home</Link>
            <span className="text-gray-300 mx-1">/</span>
            <span className="text-gray-900 font-semibold">Store</span>
          </nav>

          <div className="space-y-3">
            <span className="eyebrow">Premium Automotive Accessories</span>
            <h1
              className="text-h1 text-gray-950"
              style={{ fontSize: "clamp(44px, 5.5vw, 80px)", letterSpacing: "-0.02em" }}
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
        className="flex flex-col small:flex-row small:items-start py-12 content-container gap-10"
        data-testid="category-container"
      >
        <div className="w-full small:w-72 shrink-0">
          <div className="sticky top-32 space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Filters</h3>
              <RefinementList sortBy={sort} hideOptionsPicker />
            </div>
          </div>
        </div>
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
