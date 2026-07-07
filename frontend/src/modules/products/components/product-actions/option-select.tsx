import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)

  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-label text-gray-500">Select {title}</span>
      <div className="grid grid-cols-2 gap-2" data-testid={dataTestId}>
        {filteredOptions.map((v) => {
          return (
            <button
              type="button"
              onClick={() => updateOption(option.id, v)}
              key={v}
              className={clx(
                "min-h-11 rounded-lg border px-3 py-2 text-xs font-bold text-gray-700 transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-50",
                {
                  "border-brand bg-brand text-white shadow-sm": v === current,
                  "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50":
                    v !== current,
                }
              )}
              disabled={disabled}
              data-testid="option-button"
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
