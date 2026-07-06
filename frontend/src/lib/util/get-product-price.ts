import { HttpTypes } from "@medusajs/types"
import { getPercentageDiff } from "./get-percentage-diff"
import { convertToLocale } from "./money"

type VariantWithPrice = HttpTypes.StoreProductVariant & {
  calculated_price?: {
    calculated_amount: number
    original_amount: number
    currency_code: string
    calculated_price: {
      price_list_type: string
    }
  } | null
  prices?: {
    id?: string
    amount: number
    currency_code: string
    price_list_id?: string | null
  }[]
}

function resolveAmount(variant: VariantWithPrice): { amount: number; currency: string } | null {
  if (variant?.calculated_price?.calculated_amount && variant.calculated_price.calculated_amount > 0) {
    return {
      amount: variant.calculated_price.calculated_amount,
      currency: variant.calculated_price.currency_code,
    }
  }

  const prices = variant?.prices
  if (Array.isArray(prices) && prices.length > 0) {
    const price = prices[0]
    if (price && typeof price.amount === "number" && price.amount > 0) {
      return {
        amount: price.amount,
        currency: (price.currency_code || "inr").toLowerCase(),
      }
    }
  }

  return null
}

export const getPricesForVariant = (variant: VariantWithPrice) => {
  const resolved = resolveAmount(variant)
  if (!resolved) {
    return null
  }

  const { amount, currency } = resolved
  const originalAmount = variant?.calculated_price?.original_amount || amount

  return {
    calculated_price_number: amount,
    calculated_price: convertToLocale({
      amount,
      currency_code: currency,
    }),
    original_price_number: originalAmount,
    original_price: convertToLocale({
      amount: originalAmount,
      currency_code: currency,
    }),
    currency_code: currency,
    price_type: variant?.calculated_price?.calculated_price?.price_list_type || "default",
    percentage_diff: getPercentageDiff(originalAmount, amount),
  }
}

export function getProductPrice({
  product,
  variantId,
}: {
  product: HttpTypes.StoreProduct
  variantId?: string
}) {
  if (!product || !product.id) {
    throw new Error("No product provided")
  }

  const cheapestPrice = () => {
    if (!product || !product.variants?.length) {
      return null
    }

    const cheapestVariant = (product.variants as VariantWithPrice[])
      .filter((v) => !!resolveAmount(v))
      .sort((a, b) => {
        const aAmount = resolveAmount(a)?.amount ?? 0
        const bAmount = resolveAmount(b)?.amount ?? 0
        return aAmount - bAmount
      })[0]

    return getPricesForVariant(cheapestVariant)
  }

  const variantPrice = () => {
    if (!product || !variantId) {
      return null
    }

    const variant = product.variants?.find(
      (v) => v.id === variantId || v.sku === variantId
    ) as VariantWithPrice | undefined

    if (!variant) {
      return null
    }

    return getPricesForVariant(variant)
  }

  return {
    product,
    cheapestPrice: cheapestPrice(),
    variantPrice: variantPrice(),
  }
}
