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
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500">Select {title}</span>
        {current && (
          <span className="text-[10px] font-medium text-gray-400">Selected: <span className="text-gray-700 font-semibold">{current}</span></span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2" data-testid={dataTestId}>
        {filteredOptions.map((v) => {
          return (
            <button
              type="button"
              onClick={() => updateOption(option.id, v)}
              key={v}
              className={clx(
                "relative min-h-[44px] rounded-[var(--radius-md)] px-3 py-2 text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-brand)]/15 disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden",
                {
                  "bg-[var(--color-brand)] text-white shadow-md border border-[var(--color-brand)]": v === current,
                  "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900": v !== current,
                }
              )}
              disabled={disabled}
              data-testid="option-button"
            >
              {v === current && (
                <span className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
              )}
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect