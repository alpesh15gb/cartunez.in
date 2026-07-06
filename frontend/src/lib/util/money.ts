import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

const ZERO_DECIMAL_CURRENCIES = [
  "bif", "clp", "djf", "gnf", "isk", "jpy", "kmf", "krw",
  "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
]

export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = "en-US",
}: ConvertToLocaleParams) => {
  if (!currency_code || isEmpty(currency_code)) {
    return amount.toString()
  }

  const code = currency_code.toLowerCase()

  // Medusa stores amounts in the smallest currency unit (paise for INR, cents for USD).
  // Intl.NumberFormat expects the base unit, so divide by 100 for decimal currencies.
  const divisor = ZERO_DECIMAL_CURRENCIES.includes(code) ? 1 : 100
  const formattedAmount = amount / divisor

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency_code.toUpperCase(),
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(formattedAmount)
}
