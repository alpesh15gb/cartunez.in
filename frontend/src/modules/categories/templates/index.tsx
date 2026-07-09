import { notFound } from "next/navigation"
import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { OptionValueIds } from "@lib/util/product-option-filters"

export default function CategoryTemplate({
  category,
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
  category: HttpTypes.StoreProductCategory
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
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!category || !countryCode) notFound()

  const parents = [] as HttpTypes.StoreProductCategory[]

  const getParents = (category: HttpTypes.StoreProductCategory) => {
    if (category.parent_category) {
      parents.push(category.parent_category)
      getParents(category.parent_category)
    }
  }

  getParents(category)

  const reversedParents = [...parents].reverse()

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* -- Premium Header -- */}
      <div className="border-b border-gray-100 bg-white py-16 sm:py-20">
        <div className="content-container">
          {/* Breadcrumb */}
          {reversedParents.length > 0 && (
            <nav className="flex items-center gap-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-5">
              <LocalizedClientLink href="/" className="hover:text-gray-900 transition-colors duration-200">Home</LocalizedClientLink>
              <span className="text-gray-300">/</span>
              <LocalizedClientLink href="/store" className="hover:text-gray-900 transition-colors duration-200">Store</LocalizedClientLink>
              {reversedParents.map((parent) => (
                <span key={parent.id} className="flex items-center gap-2">
                  <span className="text-gray-300">/</span>
                  <LocalizedClientLink
                    href={"/categories/" + parent.handle}
                    className="hover:text-gray-900 transition-colors duration-200"
                    data-testid="sort-by-link"
                  >
                    {parent.name}
                  </LocalizedClientLink>
                </span>
              ))}
              <span className="text-gray-300">/</span>
              <span className="text-gray-900 font-semibold">{category.name}</span>
            </nav>
          )}

          <div className="space-y-3">
            <h1
              className="text-h1 text-gray-950"
              style={{ fontSize: "clamp(40px, 5vw, 72px)", letterSpacing: "-0.02em" }}
              data-testid="category-page-title"
            >
              {category.name}
            </h1>
            {category.description && (
              <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-2xl">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* -- Subcategories -- */}
      {category.category_children && category.category_children.length > 0 && (
        <div className="border-b border-gray-100 bg-white">
          <div className="content-container py-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mr-2">Browse:</span>
              {category.category_children?.map((c) => (
                <LocalizedClientLink
                  key={c.id}
                  href={"/categories/" + c.handle}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-[11px] font-bold text-gray-700 transition-all duration-200 hover:border-brand hover:text-brand hover:bg-brand/5"
                >
                  {c.name}
                </LocalizedClientLink>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -- Content -- */}
      <div
        className="flex flex-col small:flex-row small:items-start py-12 content-container gap-10"
        data-testid="category-container"
      >
        <div className="w-full small:w-72 shrink-0">
          <div className="sticky top-32 space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Filters</h3>
              <RefinementList sortBy={sort} data-testid="sort-by-container" hideOptionsPicker />
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <Suspense
            fallback={
              <SkeletonProductGrid
                numberOfProducts={category.products?.length ?? 8}
              />
            }
          >
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              categoryId={category.id}
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
