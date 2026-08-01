import type * as HttpTypes from "@lib/commerce/medusa-v1/types"
import { getPercentageDiff } from "./get-percentage-diff"
import { convertToLocale } from "./money"

type VariantWithPrice = HttpTypes.StoreProductVariant & {
  prices?: {
    id?: string
    amount: number
    currency_code: string
    price_list_id?: string | null
  }[]
}

function resolveAmount(variant: VariantWithPrice): { amount: number; currency: string } | null {
  if (typeof variant.calculated_price === "number" && variant.calculated_price > 0) {
    const currency = variant.prices?.find((price) => price.amount === variant.calculated_price)?.currency_code
    if (!currency) return null
    return {
      amount: variant.calculated_price,
      currency,
    }
  }

  // Medusa v1 does not return `calculated_price`; fall back to the first listed price
  const price = variant.prices && variant.prices[0]
  if (price && typeof price.amount === "number" && price.currency_code) {
    return {
      amount: price.amount,
      currency: price.currency_code,
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
  const originalAmount = variant.original_price || amount

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
    price_type: originalAmount > amount ? "sale" : "default",
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
