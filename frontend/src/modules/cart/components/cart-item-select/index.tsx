"use client"

import {
  SelectHTMLAttributes,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import { ChevronDown } from "lucide-react"

type NativeSelectProps = {
  placeholder?: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">

const CartItemSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ placeholder = "Select...", className, children, ...props }, ref) => {
    const innerRef = useRef<HTMLSelectElement>(null)
    const [isPlaceholder, setIsPlaceholder] = useState(false)

    useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
      ref,
      () => innerRef.current
    )

    useEffect(() => {
      if (innerRef.current && innerRef.current.value === "") {
        setIsPlaceholder(true)
      } else {
        setIsPlaceholder(false)
      }
    }, [innerRef.current?.value])

    return (
      <div className="relative">
        <select
          ref={innerRef}
          {...props}
          className={`appearance-none bg-white border border-gray-200 rounded-[var(--radius-sm)] px-3 py-2.5 pr-8 text-sm text-gray-900 transition-colors duration-150 focus:border-gray-400 focus:ring-1 focus:ring-gray-200 outline-none w-full ${className || ""} ${isPlaceholder ? "text-gray-400" : ""}`}
        >
          <option disabled value="">
            {placeholder}
          </option>
          {children}
        </select>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-gray-400">
          <ChevronDown size={14} />
        </span>
      </div>
    )
  }
)

CartItemSelect.displayName = "CartItemSelect"

export default CartItemSelect