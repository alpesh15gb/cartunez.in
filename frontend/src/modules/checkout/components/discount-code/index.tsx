"use client"

import { Input } from "@modules/common/components/ui"
import React from "react"

import { applyPromotions } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "../error-message"
import { SubmitButton } from "../submit-button"
import { Tag, Plus, X } from "lucide-react"

type DiscountCodeProps = {
  cart: HttpTypes.StoreCart
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")

  const { promotions = [] } = cart
  const removePromotionCode = async (code: string) => {
    const validPromotions = promotions.filter(
      (promotion) => promotion.code !== code
    )

    await applyPromotions(
      validPromotions.filter((p) => p.code !== undefined).map((p) => p.code!)
    )
  }

  const addPromotionCode = async (formData: FormData) => {
    setErrorMessage("")

    const code = formData.get("code")
    if (!code) {
      return
    }
    const input = document.getElementById("promotion-input") as HTMLInputElement
    const codes = promotions
      .filter((p) => p.code !== undefined)
      .map((p) => p.code!)
    codes.push(code.toString())

    try {
      await applyPromotions(codes)
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e))
    }

    if (input) {
      input.value = ""
    }
  }

  return (
    <div className="w-full">
      <div className="text-sm">
        {!isOpen && promotions.length === 0 && (
          <button
            onClick={() => setIsOpen(true)}
            type="button"
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-brand)] hover:text-[var(--color-brand)]/80 transition-colors"
            data-testid="add-discount-button"
          >
            <Plus size={14} />
            Add promo code
          </button>
        )}

        {isOpen && (
          <form action={(a) => addPromotionCode(a)} className="w-full">
            <div className="flex w-full gap-2">
              <div className="relative flex-1">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <Input
                  className="pl-9 h-10 text-sm rounded-[var(--radius-sm)] border-gray-200 focus:border-gray-400"
                  id="promotion-input"
                  name="code"
                  type="text"
                  placeholder="Enter coupon code"
                  autoFocus={false}
                  data-testid="discount-input"
                />
              </div>
              <SubmitButton
                variant="secondary"
                className="h-10 px-4 rounded-[var(--radius-sm)] text-sm font-semibold"
                data-testid="discount-apply-button"
              >
                Apply
              </SubmitButton>
            </div>

            <ErrorMessage
              error={errorMessage}
              data-testid="discount-error-message"
            />

            {promotions.length === 0 && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors mt-2"
              >
                Cancel
              </button>
            )}
          </form>
        )}

        {promotions.length > 0 && (
          <div className="w-full flex items-center mt-1">
            <div className="flex flex-col w-full">
              {promotions.map((promotion) => {
                return (
                  <div
                    key={promotion.id}
                    className="flex items-center justify-between w-full max-w-full py-2 border-b border-gray-100 last:border-b-0"
                    data-testid="discount-row"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Tag size={12} className="text-green-500 shrink-0" />
                      <div className="flex items-baseline gap-1 text-sm">
                        <span className="truncate font-medium text-green-700" data-testid="discount-code">
                          {promotion.code}
                        </span>
                        <span className="text-gray-400 shrink-0">
                          {promotion.application_method?.value !== undefined && (
                            <>
                              ({promotion.application_method.type === "percentage"
                                ? `${promotion.application_method.value}%`
                                : convertToLocale({
                                    amount: +promotion.application_method.value,
                                    currency_code: promotion.application_method.currency_code,
                                  })}
                              )
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    {!promotion.is_automatic && (
                      <button
                        className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-rose-50 transition-colors group"
                        onClick={() => {
                          if (!promotion.code) return
                          removePromotionCode(promotion.code)
                        }}
                        data-testid="remove-discount-button"
                      >
                        <X size={14} className="text-gray-300 group-hover:text-rose-500 transition-colors" />
                        <span className="sr-only">Remove discount code from order</span>
                      </button>
                    )}
                  </div>
                )
              })}
              <button
                onClick={() => setIsOpen(true)}
                type="button"
                className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors mt-2"
              >
                <Plus size={12} />
                Add another code
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DiscountCode
