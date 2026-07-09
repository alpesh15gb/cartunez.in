"use client"

import { EllipseMiniSolid } from "@medusajs/icons"
import { RadioGroup, clx } from "@modules/common/components/ui"

export type SortOptions = "price_asc" | "price_desc" | "created_at"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: string) => void
  "data-testid"?: string
}

const sortOptions = [
  {
    value: "created_at" as const,
    label: "Latest Arrivals",
  },
  {
    value: "price_asc" as const,
    label: "Price: Low ? High",
  },
  {
    value: "price_desc" as const,
    label: "Price: High ? Low",
  },
]

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  const handleChange = (value: string) => {
    setQueryParams("sortBy", value as SortOptions)
  }

  return (
    <div className="flex flex-col gap-3">
      <RadioGroup data-testid={dataTestId}>
        {sortOptions.map((i) => (
          <div
            key={i.value}
            className="flex gap-x-3 items-center cursor-pointer group py-1.5"
            onClick={() => handleChange(i.value)}
          >
            <div
              className={clx(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                i.value === sortBy
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)]"
                  : "border-gray-300 bg-transparent group-hover:border-gray-400"
              )}
            >
              {i.value === sortBy && (
                <EllipseMiniSolid className="text-white" style={{ width: 7, height: 7 }} />
              )}
            </div>
            <RadioGroup.Item
              checked={i.value === sortBy}
              onChange={() => handleChange(i.value)}
              className="hidden"
              id={i.value}
              value={i.value}
            />
            <label
              htmlFor={i.value}
              className={clx(
                "text-xs font-medium cursor-pointer transition-colors duration-200",
                i.value === sortBy
                  ? "text-gray-900 font-semibold"
                  : "text-gray-500 group-hover:text-gray-700"
              )}
              data-testid="radio-label"
              data-active={i.value === sortBy}
            >
              {i.label}
            </label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

export default SortProducts