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
      updateQueryParams((params) => params.set(name, value)),
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

  /** Check if any filter is active */
  const hasActiveFilters = useMemo(() => {
    return FILTER_KEYS.some((key) => {
      if (key === OPTION_VALUE_QUERY_KEY) {
        return selectedOptionValueIds.length > 0
      }
      return !!safeParams.get(key)
    })
  }, [selectedOptionValueIds, safeParams])

  /** Build active filter chips */
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
          ? `₹${minPrice}–₹${maxPrice}`
          : minPrice
            ? `Min: ₹${minPrice}`
            : `Max: ₹${maxPrice}`
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

  /** Clear all filters */
  const clearAllFilters = useCallback(() => {
    updateQueryParams((params) => {
      FILTER_KEYS.forEach((key) => {
        params.delete(key)
      })
    })
  }, [updateQueryParams])

  return (
    <aside
      className="flex flex-col gap-y-8 py-4 mb-8 small:sticky small:top-24 small:max-h-[calc(100vh-8rem)] small:overflow-y-auto small:min-w-[240px] border-r border-gray-200 pr-8"
      data-testid={dataTestId}
    >
      {/* --- Premium Header --- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-gray-900">
            Filters
          </h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand)] hover:text-[var(--color-brand-dark)] transition-colors"
            data-testid="clear-all-filters"
          >
            Clear All
          </button>
        )}
      </div>

      {/* --- Active Filter Chips --- */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="active-filter-chips">
          {activeFilters.map((chip, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] bg-[var(--color-brand)]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand)] border border-[var(--color-brand)]/15"
            >
              {chip.label}
              <button
                onClick={chip.onRemove}
                className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--color-brand)]/20 text-[var(--color-brand)] hover:bg-[var(--color-brand)]/30 transition-colors"
                aria-label={`Remove ${chip.label} filter`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* --- Sort By --- */}
      <section className="flex flex-col gap-3">
        <h3 className="label flex items-center gap-2">
          <span className="w-4 h-px bg-gray-300" />
          Sort By
        </h3>
        <SortProducts
          sortBy={sortBy}
          setQueryParams={setQueryParams}
          data-testid={dataTestId}
        />
      </section>

      {/* --- Brand Filter --- */}
      <section className="flex flex-col gap-3">
        <h3 className="label flex items-center gap-2">
          <span className="w-4 h-px bg-gray-300" />
          Brand
        </h3>
        <select
          value={brand}
          onChange={(e) => setQueryParams("brand", e.target.value)}
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

      {/* --- Price Range --- */}
      <section className="flex flex-col gap-4">
        <h3 className="label flex items-center gap-2">
          <span className="w-4 h-px bg-gray-300" />
          Price Range (₹)
        </h3>
        <div className="space-y-3 bg-gray-50/50 rounded-[var(--radius-md)] p-4 border border-gray-100">
          {/* Slider track visual */}
          <div className="relative h-2 rounded-full bg-gray-200">
            <div
              className="absolute inset-y-0 rounded-full bg-[var(--color-brand)]"
              style={{
                left: minPrice ? `${Math.min(Number(minPrice) / 200, 100)}%` : "0%",
                right: maxPrice ? `${100 - Math.min(Number(maxPrice) / 200, 100)}%` : "0%",
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400">
                ₹
              </span>
              <input
                type="range"
                min={0}
                max={20000}
                step={500}
                value={minPrice || 0}
                onChange={(e) => {
                  const val = e.target.value
                  const numVal = Number(val)
                  const maxNum = Number(maxPrice) || 20000
                  if (numVal <= maxNum) {
                    setQueryParams("minPrice", numVal === 0 ? "" : val)
                  }
                }}
                className="input-range"
                data-testid="min-price-slider"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400">
                ₹
              </span>
              <input
                type="range"
                min={0}
                max={20000}
                step={500}
                value={maxPrice || 20000}
                onChange={(e) => {
                  const val = e.target.value
                  const numVal = Number(val)
                  const minNum = Number(minPrice) || 0
                  if (numVal >= minNum) {
                    setQueryParams("maxPrice", numVal >= 20000 ? "" : val)
                  }
                }}
                className="input-range"
                data-testid="max-price-slider"
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] font-medium">
            <span className="font-semibold text-gray-700">{minPrice ? `₹${Number(minPrice).toLocaleString()}` : "₹0"}</span>
            <span className="text-gray-300">—</span>
            <span className="font-semibold text-gray-700">{maxPrice ? `₹${Number(maxPrice).toLocaleString()}` : "₹20,000+"}</span>
          </div>
        </div>
      </section>

      {/* --- Active Vehicle Fitment --- */}
      {(make || model) && (
        <section className="rounded-[var(--radius-md)] border border-[var(--color-brand)]/20 bg-[var(--color-brand-surface)] p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-[var(--color-brand)] rounded-full" />
            <h3 className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-brand)]">
              Compatible Vehicle
            </h3>
          </div>
          <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">
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
            className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand)] hover:text-[var(--color-brand-dark)] transition-colors inline-flex items-center gap-1"
            data-testid="clear-vehicle-fitment"
          >
            <X className="w-3 h-3" />
            Clear Vehicle
          </button>
        </section>
      )}

      {/* --- Options Picker --- */}
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
