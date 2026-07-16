"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react"
import { X, SlidersHorizontal } from "lucide-react"

import {
  OPTION_VALUE_QUERY_KEY,
  parseOptionValueIds,
} from "@lib/util/product-option-filters"
import OptionsPicker from "./options-picker"
import SortProducts, { SortOptions } from "./sort-products"

const FILTER_KEYS = [
  "brand",
  "minPrice",
  "maxPrice",
  "make",
  "model",
  "year",
  OPTION_VALUE_QUERY_KEY,
] as const

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
  const safeParams = useMemo(
    () => searchParams ?? new URLSearchParams(),
    [searchParams]
  )

  const updateQueryParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(safeParams.toString())
      updater(params)
      params.delete("page")
      const queryString = params.toString()
      const currentQuery = safeParams.toString()
      const nextPath = queryString ? `${pathname}?${queryString}` : pathname
      const currentPath = currentQuery ? `${pathname}?${currentQuery}` : pathname

      if (nextPath !== currentPath) router.push(nextPath!)
    },
    [pathname, router, safeParams]
  )

  const setQueryParams = useCallback(
    (name: string, value: string) =>
      updateQueryParams((params) => {
        if (value) {
          params.set(name, value)
        } else {
          params.delete(name)
        }
      }),
    [updateQueryParams]
  )

  const selectedOptionValueIds = useMemo(
    () => parseOptionValueIds(searchParams ?? new URLSearchParams()),
    [searchParams]
  )

  const setOptionValueIds = useCallback(
    (valueIds: string[]) =>
      updateQueryParams((params) => {
        params.delete(OPTION_VALUE_QUERY_KEY)
        valueIds.forEach((valueId) => params.append(OPTION_VALUE_QUERY_KEY, valueId))
      }),
    [updateQueryParams]
  )

  const minPrice = safeParams.get("minPrice") || ""
  const maxPrice = safeParams.get("maxPrice") || ""
  const brand = safeParams.get("brand") || ""
  const make = safeParams.get("make") || ""
  const model = safeParams.get("model") || ""

  const hasActiveFilters = useMemo(() => {
    return FILTER_KEYS.some((key) => {
      if (key === OPTION_VALUE_QUERY_KEY) {
        return selectedOptionValueIds.length > 0
      }

      return !!safeParams.get(key)
    })
  }, [selectedOptionValueIds, safeParams])

  const activeFilters = useMemo(() => {
    const chips: { label: string; onRemove: () => void }[] = []

    if (brand) {
      chips.push({
        label: `Brand: ${brand}`,
        onRemove: () => setQueryParams("brand", ""),
      })
    }

    if (minPrice || maxPrice) {
      const label =
        minPrice && maxPrice
          ? `Rs. ${minPrice} - Rs. ${maxPrice}`
          : minPrice
            ? `Min: Rs. ${minPrice}`
            : `Max: Rs. ${maxPrice}`

      chips.push({
        label,
        onRemove: () =>
          updateQueryParams((params) => {
            params.delete("minPrice")
            params.delete("maxPrice")
          }),
      })
    }

    if (make && model) {
      chips.push({
        label: `${make} ${model}`,
        onRemove: () =>
          updateQueryParams((params) => {
            params.delete("make")
            params.delete("model")
            params.delete("year")
          }),
      })
    } else if (make) {
      chips.push({
        label: `Make: ${make}`,
        onRemove: () =>
          updateQueryParams((params) => {
            params.delete("make")
            params.delete("model")
            params.delete("year")
          }),
      })
    }

    if (selectedOptionValueIds.length > 0) {
      chips.push({
        label: `${selectedOptionValueIds.length} option${selectedOptionValueIds.length > 1 ? "s" : ""} selected`,
        onRemove: () => setOptionValueIds([]),
      })
    }

    return chips
  }, [brand, minPrice, maxPrice, make, model, selectedOptionValueIds, setQueryParams, updateQueryParams, setOptionValueIds])

  const clearAllFilters = useCallback(() => {
    updateQueryParams((params) => {
      FILTER_KEYS.forEach((key) => params.delete(key))
    })
  }, [updateQueryParams])

  return (
    <aside
      className="mb-8 flex flex-col gap-y-8 py-4 pr-0 small:sticky small:top-24 small:max-h-[calc(100vh-8rem)] small:min-w-[240px] small:overflow-y-auto small:border-r small:border-gray-200 small:pr-8"
      data-testid={dataTestId}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-gray-900">
            Filters
          </h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-[10px] font-bold uppercase tracking-wider text-brand transition-colors hover:text-brand-dark"
            data-testid="clear-all-filters"
          >
            Clear All
          </button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="active-filter-chips">
          {activeFilters.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-brand/15 bg-brand/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-brand"
            >
              {chip.label}
              <button
                onClick={chip.onRemove}
                className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand/15 text-brand transition-colors hover:bg-brand/25"
                aria-label={`Remove ${chip.label} filter`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h3 className="label flex items-center gap-2">
          <span className="h-px w-4 bg-gray-300" />
          Sort By
        </h3>
        <SortProducts
          sortBy={sortBy}
          setQueryParams={setQueryParams}
          data-testid={dataTestId}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="label flex items-center gap-2">
          <span className="h-px w-4 bg-gray-300" />
          Brand
        </h3>
        <select
          value={brand}
          onChange={(event) => setQueryParams("brand", event.target.value)}
          className="select-dark"
          data-testid="brand-select"
        >
          <option value="">All Brands</option>
          <option value="Onkyo">Onkyo</option>
          <option value="Blaupunkt">Blaupunkt</option>
          <option value="Cartunez">Cartunez</option>
          <option value="Osram">Osram</option>
          <option value="Philips">Philips</option>
        </select>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="label flex items-center gap-2">
          <span className="h-px w-4 bg-gray-300" />
          Price Range (Rs.)
        </h3>
        <div className="space-y-3 rounded-[var(--radius-md)] border border-gray-100 bg-gray-50/50 p-4">
          <div className="relative h-2 rounded-full bg-gray-200">
            <div
              className="absolute inset-y-0 rounded-full bg-brand"
              style={{
                left: minPrice ? `${Math.min(Number(minPrice) / 200, 100)}%` : "0%",
                right: maxPrice ? `${100 - Math.min(Number(maxPrice) / 200, 100)}%` : "0%",
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="range"
              min={0}
              max={20000}
              step={500}
              value={minPrice || 0}
              onChange={(event) => {
                const value = event.target.value
                const numericValue = Number(value)
                const maxValue = Number(maxPrice) || 20000

                if (numericValue <= maxValue) {
                  setQueryParams("minPrice", numericValue === 0 ? "" : value)
                }
              }}
              className="input-range"
              aria-label="Minimum price"
              data-testid="min-price-slider"
            />
            <input
              type="range"
              min={0}
              max={20000}
              step={500}
              value={maxPrice || 20000}
              onChange={(event) => {
                const value = event.target.value
                const numericValue = Number(value)
                const minValue = Number(minPrice) || 0

                if (numericValue >= minValue) {
                  setQueryParams("maxPrice", numericValue >= 20000 ? "" : value)
                }
              }}
              className="input-range"
              aria-label="Maximum price"
              data-testid="max-price-slider"
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-medium">
            <span className="font-semibold text-gray-700">
              {minPrice ? `Rs. ${Number(minPrice).toLocaleString()}` : "Rs. 0"}
            </span>
            <span className="text-gray-300">-</span>
            <span className="font-semibold text-gray-700">
              {maxPrice ? `Rs. ${Number(maxPrice).toLocaleString()}` : "Rs. 20,000+"}
            </span>
          </div>
        </div>
      </section>

      {(make || model) && (
        <section className="space-y-3 rounded-[var(--radius-md)] border border-brand/20 bg-brand-surface p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-brand" />
            <h3 className="text-[9px] font-bold uppercase tracking-widest text-brand">
              Compatible Vehicle
            </h3>
          </div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-900">
            {make} {model}
          </p>
          <button
            onClick={() => {
              updateQueryParams((params) => {
                params.delete("make")
                params.delete("model")
                params.delete("year")
              })
            }}
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand transition-colors hover:text-brand-dark"
            data-testid="clear-vehicle-fitment"
          >
            <X className="h-3 w-3" />
            Clear Vehicle
          </button>
        </section>
      )}

      {!hideOptionsPicker && (
        <section>
          <OptionsPicker
            selectedValueIds={selectedOptionValueIds}
            setOptionValueIds={setOptionValueIds}
          />
        </section>
      )}
    </aside>
  )
}

export default RefinementList
