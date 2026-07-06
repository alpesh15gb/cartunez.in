import { EllipseMiniSolid } from "@medusajs/icons"
import { RadioGroup, clx } from "@modules/common/components/ui"

type FilterRadioGroupProps = {
  title: string
  items: { value: string; label: string }[]
  value: string
  handleChange: (value: string) => void
  "data-testid"?: string
}

const FilterRadioGroup = ({
  title,
  items,
  value,
  handleChange,
  "data-testid": dataTestId,
}: FilterRadioGroupProps) => {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{title}</span>
      <RadioGroup data-testid={dataTestId}>
        {items?.map((i) => (
          <div
            key={i.value}
            className="flex gap-x-2 items-center cursor-pointer"
            onClick={() => handleChange(i.value)}
          >
            <div className={clx(
              "w-3 h-3 rounded-full border flex items-center justify-center transition-colors duration-200",
              i.value === value
                ? "border-brand bg-brand"
                : "border-gray-300 bg-transparent hover:border-gray-400"
            )}>
              {i.value === value && <EllipseMiniSolid className="text-white" style={{ width: 6, height: 6 }} />}
            </div>
            <RadioGroup.Item
              checked={i.value === value}
              onChange={() => handleChange(i.value)}
              className="hidden"
              id={i.value}
              value={i.value}
            />
            <label
              htmlFor={i.value}
              className={clx(
                "text-xs font-medium cursor-pointer transition-colors duration-200",
                i.value === value ? "text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-700"
              )}
              data-testid="radio-label"
              data-active={i.value === value}
            >
              {i.label}
            </label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

export default FilterRadioGroup
