import { Label } from "@modules/common/components/ui"
import React, { useEffect, useImperativeHandle, useState } from "react"

import Eye from "@modules/common/icons/eye"
import EyeOff from "@modules/common/icons/eye-off"

type InputProps = Omit<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  "placeholder"
> & {
  label: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  name: string
  topLabel?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type, name, label, errors, touched, required, topLabel, id, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [inputType, setInputType] = useState(type)

    useEffect(() => {
      if (type === "password" && showPassword) {
        setInputType("text")
      }

      if (type === "password" && !showPassword) {
        setInputType("password")
      }
    }, [type, showPassword])

    useImperativeHandle(ref, () => inputRef.current!)
    const inputId = id || name
    const error = touched?.[name] ? errors?.[name] : undefined
    const errorId = `${inputId}-error`

    return (
      <div className="flex w-full flex-col">
        {topLabel && (
          <p className="mb-2 text-sm font-medium text-gray-700">{topLabel}</p>
        )}
        <Label htmlFor={inputId} className="mb-2 text-sm font-medium text-gray-800">
          {label}{required && <span className="ml-1 text-rose-600" aria-hidden="true">*</span>}
        </Label>
        <div className="relative flex w-full">
          <input
            id={inputId}
            type={inputType}
            name={name}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className="field-control pr-12"
            {...props}
            ref={inputRef}
          />
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="icon-button absolute right-0 top-0 text-ui-fg-subtle hover:text-ui-fg-base"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
          )}
        </div>
        {Boolean(error) && <p id={errorId} role="alert" className="mt-2 text-sm text-rose-700">{String(error)}</p>}
      </div>
    )
  }
)

Input.displayName = "Input"

export default Input
