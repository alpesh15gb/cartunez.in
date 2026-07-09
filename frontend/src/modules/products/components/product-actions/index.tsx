"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"
import { ShoppingCart, Zap, CheckCircle, XCircle } from "lucide-react"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const params = useParams()
  const countryCode = (params?.countryCode ?? '') as string

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariant, isValidVariant])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })
    } catch (e) {
      console.error("Add to cart failed:", e)
    } finally {
      setIsAdding(false)
    }
  }

  const handleBuyNow = async () => {
    if (!selectedVariant?.id) return
    setIsAdding(true)
    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })
      router.push(`/${countryCode}/cart`)
    } catch (e) {
      console.error("Buy now failed:", e)
    } finally {
      setIsAdding(false)
    }
  }

  const getButtonLabel = () => {
    if (!selectedVariant && !Object.keys(options).length) return "Select variant"
    if (!isValidVariant) return "Select options"
    if (!inStock) return "Out of stock"
    return "Add to cart"
  }

  return (
    <>
      <div className="flex flex-col gap-y-6" ref={actionsRef}>
        {/* ── Option/Variant Selectors ── */}
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-5">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        {/* ── Premium Price Display ── */}
        <ProductPrice product={product} variant={selectedVariant} />

        {/* ── Stock Indicator ── */}
        <div
          className={`flex items-center justify-between rounded-xl border px-5 py-3.5 text-xs font-bold ${
            inStock
              ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-50/60 text-emerald-800"
              : "border-rose-200 bg-gradient-to-r from-rose-50 to-rose-50/60 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
              inStock ? "bg-emerald-100" : "bg-rose-100"
            }`}>
              {inStock ? (
                <CheckCircle size={14} className="text-emerald-600" />
              ) : (
                <XCircle size={14} className="text-rose-600" />
              )}
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {inStock ? "Ready to dispatch" : "Currently unavailable"}
            </span>
          </div>
          <span
            className={`flex h-2.5 w-2.5 rounded-full ${
              inStock
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                : "bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.5)]"
            }`}
            aria-hidden="true"
          />
        </div>

        {/* ── Add to Cart Button ── */}
        <Button
          onClick={handleAddToCart}
          disabled={
            !inStock ||
            !selectedVariant ||
            !!disabled ||
            isAdding ||
            !isValidVariant
          }
          variant="primary"
          className="group relative h-14 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-brand to-brand/90 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-brand/25 transition-all duration-300 hover:shadow-xl hover:shadow-brand/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {isAdding ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>Adding...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3">
              <ShoppingCart size={18} strokeWidth={2} className="transition-transform duration-300 group-hover:scale-110" />
              <span>{getButtonLabel()}</span>
            </span>
          )}
        </Button>

        {/* ── Buy Now Button ── */}
        <Button
          onClick={handleBuyNow}
          disabled={
            !inStock ||
            !selectedVariant ||
            !!disabled ||
            isAdding ||
            !isValidVariant
          }
          variant="secondary"
          className="group relative h-13 w-full overflow-hidden rounded-2xl border-2 border-gray-900 bg-transparent text-xs font-bold uppercase tracking-wider text-gray-900 transition-all duration-300 hover:bg-gray-900 hover:text-white disabled:opacity-50"
        >
          <span className="flex items-center justify-center gap-2.5">
            <Zap size={16} strokeWidth={2.5} className="transition-transform duration-300 group-hover:scale-110" />
            <span>Buy Now</span>
          </span>
        </Button>

        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}