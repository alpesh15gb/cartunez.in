import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { HttpTypes } from "@medusajs/types"
import { OptionValueIds } from "@lib/util/product-option-filters"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
  optionValueIds,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* -- Premium Header -- */}
      <div className="border-b border-gray-100 bg-white py-16 sm:py-20">
        <div className="content-container">
          <nav className="flex items-center gap-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-5">
            <LocalizedClientLink href="/" className="hover:text-gray-900 transition-colors duration-200">Home</LocalizedClientLink>
            <span className="text-gray-300">/</span>
            <LocalizedClientLink href="/store" className="hover:text-gray-900 transition-colors duration-200">Store</LocalizedClientLink>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-semibold">{collection.title}</span>
          </nav>

          <div className="space-y-3">
            <span className="eyebrow">Curated Collection</span>
            <h1
              className="text-h1 text-gray-950"
              style={{ fontSize: "clamp(40px, 5vw, 72px)", letterSpacing: "-0.02em" }}
            >
              {collection.title}
            </h1>
            {!!collection.metadata?.description && (
              <p className="text-sm text-gray-500 font-medium max-w-xl">
                {String(collection.metadata?.description)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* -- Content -- */}
      <div className="flex flex-col small:flex-row small:items-start py-12 content-container gap-10">
        <div className="w-full small:w-72 shrink-0">
          <div className="sticky top-32 space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Filters</h3>
              <RefinementList sortBy={sort} hideOptionsPicker />
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <Suspense
            fallback={
              <SkeletonProductGrid
                numberOfProducts={collection.products?.length}
              />
            }
          >
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              collectionId={collection.id}
              countryCode={countryCode}
              optionValueIds={optionValueIds}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
