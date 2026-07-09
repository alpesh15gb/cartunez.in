"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"
import { ShoppingBag, Trash2 } from "lucide-react"

const CartDropdown = ({
  cart: cartState,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>(
    undefined
  )
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const totalItems =
    cartState?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  const subtotal = cartState?.subtotal ?? 0
  const itemRef = useRef<number>(totalItems || 0)

  const timedOpen = () => {
    open()
    const timer = setTimeout(close, 5000)
    setActiveTimer(timer)
  }

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }
    open()
  }

  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  useEffect(() => {
    if (itemRef.current !== totalItems && !pathname?.includes("/cart")) {
      timedOpen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems, itemRef.current])

  return (
    <div
      className="h-full z-50 flex items-center"
      onMouseEnter={openAndCancel}
      onMouseLeave={close}
    >
      <Popover className="relative h-full flex items-center">
        <PopoverButton className="h-full flex items-center group">
          <LocalizedClientLink
            className="relative flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 group-hover:scale-105"
            href="/cart"
            data-testid="nav-cart-link"
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[17px] h-[17px] px-[4px] rounded-full bg-brand text-[9px] font-bold text-white leading-none shadow-[0_2px_6px_rgba(201,28,28,0.3)]">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </LocalizedClientLink>
        </PopoverButton>
        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-2 scale-95"
          enterTo="opacity-100 translate-y-0 scale-100"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0 scale-100"
          leaveTo="opacity-0 translate-y-2 scale-95"
        >
          <PopoverPanel
            static
            className="hidden small:block absolute top-[calc(100%+6px)] right-0 bg-white border border-gray-100 shadow-elevation-4 rounded-lg w-[420px] text-gray-900 overflow-hidden"
            data-testid="nav-cart-dropdown"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Shopping Cart</h3>
              {totalItems > 0 && (
                <span className="text-[11px] font-medium text-gray-400">
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </span>
              )}
            </div>
            {cartState && cartState.items?.length ? (
              <>
                {/* Items */}
                <div className="overflow-y-scroll max-h-[380px] px-5 py-4 grid grid-cols-1 gap-y-5 no-scrollbar">
                  {cartState.items
                    .sort((a, b) => {
                      return (a.created_at ?? "") > (b.created_at ?? "")
                        ? -1
                        : 1
                    })
                    .map((item) => (
                      <div
                        className="grid grid-cols-[100px_1fr] gap-x-4"
                        key={item.id}
                        data-testid="cart-item"
                      >
                        <LocalizedClientLink
                          href={`/products/${item.id}`}
                          className="w-[100px] overflow-hidden rounded-md"
                        >
                          <Thumbnail
                            thumbnail={item.thumbnail}
                            images={item.variant?.product?.images}
                            size="square"
                          />
                        </LocalizedClientLink>
                        <div className="flex flex-col justify-between flex-1 min-w-0">
                          <div className="flex flex-col flex-1 gap-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-col min-w-0 flex-1">
                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                  <LocalizedClientLink
                                    href={`/products/${item.id}`}
                                    data-testid="product-link"
                                  >
                                    {item.title}
                                  </LocalizedClientLink>
                                </h3>
                                <div className="mt-0.5">
                                  <LineItemOptions
                                    variant={item.variant}
                                    data-testid="cart-item-variant"
                                    data-value={item.variant}
                                  />
                                </div>
                                <span
                                  className="text-xs text-gray-400 mt-1"
                                  data-testid="cart-item-quantity"
                                  data-value={item.quantity}
                                >
                                  Qty: {item.quantity}
                                </span>
                              </div>
                              <div className="flex-shrink-0">
                                <LineItemPrice
                                  item={item}
                                  style="tight"
                                  currencyCode={cartState.currency_code}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <DeleteButton
                              id={item.id}
                              className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors duration-200 flex items-center gap-1"
                              data-testid="cart-item-remove-button"
                            >
                              <Trash2 size={12} />
                              Remove
                            </DeleteButton>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">
                      Subtotal
                    </span>
                    <span
                      className="text-sm font-semibold text-gray-900"
                      data-testid="cart-subtotal"
                      data-value={subtotal}
                    >
                      {convertToLocale({
                        amount: subtotal,
                        currency_code: cartState.currency_code,
                      })}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400">Excluding taxes & shipping</p>
                  <LocalizedClientLink href="/cart" passHref>
                    <Button
                      className="w-full !rounded-md !py-2.5 !text-sm !font-semibold"
                      size="large"
                      data-testid="go-to-cart-button"
                    >
                      View Cart & Checkout
                    </Button>
                  </LocalizedClientLink>
                </div>
              </>
            ) : (
              <div>
                <div className="flex py-16 flex-col gap-y-4 items-center justify-center px-5">
                  <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">
                    <ShoppingBag size={20} strokeWidth={1.5} />
                  </div>
                  <span className="text-sm text-gray-500 font-medium">
                    Your cart is empty
                  </span>
                  <p className="text-xs text-gray-400 text-center max-w-[220px]">
                    Add some premium automotive accessories to get started.
                  </p>
                  <div className="pt-2">
                    <LocalizedClientLink href="/store">
                      <>
                        <span className="sr-only">Go to all products page</span>
                        <Button onClick={close} className="!rounded-md !text-sm">
                          Explore Products
                        </Button>
                      </>
                    </LocalizedClientLink>
                  </div>
                </div>
              </div>
            )}
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CartDropdown
