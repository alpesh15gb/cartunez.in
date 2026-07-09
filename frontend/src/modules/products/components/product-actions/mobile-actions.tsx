import { Dialog, Transition } from "@headlessui/react"
import { Button, clx } from "@modules/common/components/ui"
import React, { Fragment, useMemo } from "react"

import useToggleState from "@lib/hooks/use-toggle-state"
import { ChevronDown, X } from "lucide-react"

import { getProductPrice } from "@lib/util/get-product-price"
import OptionSelect from "./option-select"
import { HttpTypes } from "@medusajs/types"
import { isSimpleProduct } from "@lib/util/product"

type MobileActionsProps = {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  options: Record<string, string | undefined>
  updateOptions: (title: string, value: string) => void
  inStock?: boolean
  handleAddToCart: () => void
  isAdding?: boolean
  show: boolean
  optionsDisabled: boolean
}

const MobileActions: React.FC<MobileActionsProps> = ({
  product,
  variant,
  options,
  updateOptions,
  inStock,
  handleAddToCart,
  isAdding,
  show,
  optionsDisabled,
}) => {
  const { state, open, close } = useToggleState()

  const price = getProductPrice({
    product: product,
    variantId: variant?.id,
  })

  const selectedPrice = useMemo(() => {
    if (!price) {
      return null
    }
    const { variantPrice, cheapestPrice } = price

    return variantPrice || cheapestPrice || null
  }, [price])

  const isSimple = isSimpleProduct(product)

  return (
    <>
      <div
        className={clx("lg:hidden inset-x-0 bottom-0 fixed z-50", {
          "pointer-events-none": !show,
        })}
      >
        <Transition
          as={Fragment}
          show={show}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0 translate-y-4"
          enterTo="opacity-100 translate-y-0"
          leave="ease-in duration-300"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-4"
        >
          <div
            className="bg-white/95 backdrop-blur-lg flex flex-col gap-y-3 justify-center items-center p-4 h-full w-full border-t border-gray-200 shadow-[0_-8px_30px_rgba(15,23,42,0.06)]"
            data-testid="mobile-actions"
          >
            <div className="flex items-center gap-x-3">
              <span className="text-sm font-bold text-gray-900" data-testid="mobile-title">{product.title}</span>
              <span className="text-gray-300">|</span>
              {selectedPrice ? (
                <div className="flex items-end gap-x-2">
                  {selectedPrice.price_type === "sale" && (
                    <p>
                      <span className="line-through text-[11px] text-gray-400">
                        {selectedPrice.original_price}
                      </span>
                    </p>
                  )}
                  <span
                    className={clx(
                      "text-sm font-bold",
                      selectedPrice.price_type === "sale"
                        ? "text-[var(--color-brand)]"
                        : "text-gray-900"
                    )}
                  >
                    {selectedPrice.calculated_price}
                  </span>
                </div>
              ) : (
                <div></div>
              )}
            </div>
            <div className={clx("grid grid-cols-2 w-full gap-x-3", {
              "!grid-cols-1": isSimple
            })}>
              {!isSimple && (
                <Button
                  onClick={open}
                  variant="secondary"
                  className="w-full h-11 rounded-[var(--radius-sm)] text-[11px]"
                  data-testid="mobile-actions-button"
                >
                  <div className="flex items-center justify-between w-full gap-2">
                    <span className="truncate text-[10px]">
                      {variant
                        ? Object.values(options).join(" / ")
                        : "Select Options"}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                  </div>
                </Button>
              )}
              <Button
                onClick={handleAddToCart}
                disabled={!inStock || !variant}
                className="w-full h-11 rounded-[var(--radius-sm)] text-[11px]"
                isLoading={isAdding}
                data-testid="mobile-cart-button"
              >
                {!variant
                  ? "Select variant"
                  : !inStock
                  ? "Out of stock"
                  : "Add to cart"}
              </Button>
            </div>
          </div>
        </Transition>
      </div>
      <Transition appear show={state} as={Fragment}>
        <Dialog as="div" className="relative z-[75]" onClose={close}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed bottom-0 inset-x-0">
            <div className="flex min-h-full h-full items-end justify-center text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-8"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-8"
              >
                <Dialog.Panel
                  className="w-full transform overflow-hidden text-left flex flex-col gap-y-4 bg-white rounded-t-[var(--radius-xl)] shadow-xl"
                  data-testid="mobile-actions-modal"
                >
                  <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-900">Select Options</span>
                    <button
                      onClick={close}
                      className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors duration-200"
                      data-testid="close-modal-button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="px-6 pb-8 max-h-[60vh] overflow-y-auto">
                    {(product.variants?.length ?? 0) > 1 && (
                      <div className="flex flex-col gap-y-6">
                        {(product.options || []).map((option) => {
                          return (
                            <div key={option.id}>
                              <OptionSelect
                                option={option}
                                current={options[option.id]}
                                updateOption={updateOptions}
                                title={option.title ?? ""}
                                disabled={optionsDisabled}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default MobileActions