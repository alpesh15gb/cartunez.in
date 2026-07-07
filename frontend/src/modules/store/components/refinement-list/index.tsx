"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react"

import {
  OPTION_VALUE_QUERY_KEY,
  parseOptionValueIds,
} from "@lib/util/product-option-filters"
import OptionsPicker from "./options-picker"
import SortProducts, { SortOptions } from "./sort-products"

type RefinementListProps = {
  sortBy: SortOptions
  search?: boolean
  hideOptionsPicker?: boolean
  "data-testid"?: string
}

const RefinementList = ({
  sortBy,
  hideOptionsPicker = false,
  "data-testid": dataTestId,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateQueryParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      updater(params)
      params.delete("page")
      const queryString = params.toString()
      const currentQuery = searchParams.toString()
      const nextPath = queryString ? `${pathname}?${queryString}` : pathname
      const currentPath = currentQuery ? `${pathname}?${currentQuery}` : pathname
      if (nextPath !== currentPath) router.push(nextPath)
    },
    [pathname, router, searchParams]
  )

  const setQueryParams = (name: string, value: string) =>
    updateQueryParams((params) => params.set(name, value))

  const selectedOptionValueIds = useMemo(
    () => parseOptionValueIds(searchParams),
    [searchParams]
  )

  const setOptionValueIds = (valueIds: string[]) =>
    updateQueryParams((params) => {
      params.delete(OPTION_VALUE_QUERY_KEY)
      valueIds.forEach((valueId) => params.append(OPTION_VALUE_QUERY_KEY, valueId))
    })

  const minPrice = searchParams.get("minPrice") || ""
  const maxPrice = searchParams.get("maxPrice") || ""
  const brand = searchParams.get("brand") || ""
  const make = searchParams.get("make") || ""
  const model = searchParams.get("model") || ""

  return (
    <div
      className="flex flex-col gap-8 py-4 mb-8 small:min-w-[240px]
                 border-r border-gray-200 pr-8"
      data-testid={dataTestId}
    >
      <div className="flex flex-col gap-3">
        <span className="text-label text-gray-500">Sort By</span>
        <SortProducts
          sortBy={sortBy}
          setQueryParams={setQueryParams}
          data-testid={dataTestId}
        />
      </div>

      {/* Brand Filter */}
      <div className="flex flex-col gap-3">
        <span className="text-label text-gray-500">Brand</span>
        <select
          value={brand}
          onChange={(e) => setQueryParams("brand", e.target.value)}
          className="select-dark"
        >
          <option value="">All Brands</option>
          <option value="Onkyo">Onkyo</option>
          <option value="Blaupunkt">Blaupunkt</option>
          <option value="Cartunez">Cartunez</option>
          <option value="Osram">Osram</option>
          <option value="Philips">Philips</option>
        </select>
      </div>

      {/* Price Filter */}
      <div className="flex flex-col gap-3">
        <span className="text-label text-gray-500">Price Range (₹)</span>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setQueryParams("minPrice", e.target.value)}
            className="input-dark"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setQueryParams("maxPrice", e.target.value)}
            className="input-dark"
          />
        </div>
      </div>

      {/* Active vehicle fitment badge */}
      {(make || model) && (
        <div className="bg-brand/10 border border-brand/20 p-4 space-y-2">
          <span className="text-[9px] font-bold text-brand uppercase tracking-widest block">
            Compatible Vehicle
          </span>
          <span className="text-xs font-bold text-gray-900 block uppercase tracking-wide">
            {make} {model}
          </span>
          <button
            onClick={() => {
              updateQueryParams((params) => {
                params.delete("make")
                params.delete("model")
                params.delete("year")
              })
            }}
            className="text-[10px] text-brand hover:underline font-bold uppercase tracking-wider block"
          >
            Clear Vehicle Fitment
          </button>
        </div>
      )}

      {!hideOptionsPicker && (
        <OptionsPicker
          selectedValueIds={selectedOptionValueIds}
          setOptionValueIds={setOptionValueIds}
        />
      )}
    </div>
  )
}

export default RefinementList
