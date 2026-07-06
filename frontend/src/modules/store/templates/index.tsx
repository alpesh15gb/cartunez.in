import { Suspense } from "react"

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
    <div className="bg-white min-h-screen">
      {/* Page header */}
      <div className="border-b border-gray-100 py-12">
        <div className="content-container">
          <span className="eyebrow mb-3">Explore</span>
          <h1
            className="font-display font-black uppercase text-gray-900 leading-none"
            style={{ fontSize: "clamp(40px, 5vw, 72px)", letterSpacing: "-0.02em" }}
            data-testid="store-page-title"
          >
            All Products
          </h1>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex flex-col small:flex-row small:items-start py-8 content-container gap-8"
        data-testid="category-container"
      >
        <RefinementList sortBy={sort} />
        <div className="w-full">
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
