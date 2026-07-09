"use client"

import * as Accordion from "@radix-ui/react-accordion"
import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import clsx from "clsx"

type OptionsPickerProps = {
  selectedValueIds: string[]
  setOptionValueIds: (valueIds: string[]) => void
}

const OptionsPicker = ({
  selectedValueIds,
  setOptionValueIds,
}: OptionsPickerProps) => {
  const [options, setOptions] = useState<HttpTypes.StoreProductOption[]>([])
  const [openItems, setOpenItems] = useState<string[]>([])

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await sdk.client.fetch<{
          product_options?: HttpTypes.StoreProductOption[]
        }>("/store/product-options", {
          method: "GET",
          query: {
            is_exclusive: false,
            fields: "*values",
          },
        })

        if (response?.product_options) {
          setOptions(response.product_options)
        }
      } catch (error) {
        console.error("Failed to fetch product options", error)
      }
    }

    fetchOptions()
  }, [])

  useEffect(() => {
    if (options.length) {
      setOpenItems(options.map((option) => option.id))
    }
  }, [options])

  if (!options.length) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between px-1">
        <span className="label flex items-center gap-2">
          <span className="w-4 h-px bg-gray-300" />
          Options
        </span>
      </div>
      <Accordion.Root
        type="multiple"
        value={openItems}
        onValueChange={(values) => setOpenItems(values as string[])}
        className="flex flex-col gap-y-2"
      >
        {options.map((option) => {
          const values =
            option.values
              ?.map((value) => ({
                id: value.id,
                label: value.value,
              }))
              .filter(
                (value): value is { id: string; label: string } =>
                  !!value.id && !!value.label
              ) || []

          if (!values.length) {
            return null
          }

          const toggleValue = (valueId: string) => {
            const isSelected = selectedValueIds.includes(valueId)
            const nextSelections = isSelected
              ? selectedValueIds.filter((id) => id !== valueId)
              : [...selectedValueIds, valueId]

            setOptionValueIds(Array.from(new Set(nextSelections)))
          }

          const isOpen = openItems.includes(option.id)
          const selectedCount = values.filter((value) =>
            selectedValueIds.includes(value.id)
          ).length

          return (
            <Accordion.Item
              key={option.id}
              value={option.id}
              className="overflow-hidden rounded-[var(--radius-md)] border border-gray-200 bg-white shadow-sm transition-all duration-200 data-[state=open]:border-[var(--color-brand)]/15"
            >
              <Accordion.Header>
                <Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50/50 transition-colors duration-150">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      {option.title || "Option"}
                    </span>
                    {selectedCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--color-brand)]/10 text-[9px] font-bold text-[var(--color-brand)]">
                        {selectedCount}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={clsx(
                      "w-4 h-4 text-gray-400 transition-transform duration-200",
                      { "rotate-180": isOpen }
                    )}
                  />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="pb-4 pt-1 px-4">
                <div className="flex flex-wrap gap-2 pt-2">
                  {values.map((value) => {
                    const isSelected = selectedValueIds.includes(value.id)

                    return (
                      <button
                        key={value.id}
                        onClick={() => toggleValue(value.id)}
                        className={clsx(
                          "inline-flex items-center h-9 px-3.5 rounded-[var(--radius-sm)] text-[10px] font-bold uppercase tracking-wider transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-brand)]/15",
                          {
                            "bg-[var(--color-brand)] text-white shadow-sm border border-[var(--color-brand)]":
                              isSelected,
                            "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900 hover:bg-gray-50":
                              !isSelected,
                          }
                        )}
                        aria-pressed={isSelected}
                      >
                        {value.label}
                      </button>
                    )
                  })}
                </div>
              </Accordion.Content>
            </Accordion.Item>
          )
        })}
      </Accordion.Root>
    </div>
  )
}

export default OptionsPicker