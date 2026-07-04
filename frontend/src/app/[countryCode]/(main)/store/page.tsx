import { Metadata } from "next"

import { parseOptionValueIds } from "@lib/util/product-option-filters"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Store",
  description: "Explore all of our products.",
}

type StorePageSearchParams = Record<string, string | string[] | undefined> & {
  sortBy?: SortOptions
  page?: string
  optionValueIds?: string | string[]
}

type Params = {
  searchParams: Promise<StorePageSearchParams>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { sortBy, page, minPrice, maxPrice, brand, make, model, year } = searchParams
  const optionValueIds = parseOptionValueIds(searchParams)

  const minPriceNum = typeof minPrice === "string" ? parseFloat(minPrice) : undefined
  const maxPriceNum = typeof maxPrice === "string" ? parseFloat(maxPrice) : undefined

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      optionValueIds={optionValueIds}
      minPrice={minPriceNum}
      maxPrice={maxPriceNum}
      brand={typeof brand === "string" ? brand : undefined}
      make={typeof make === "string" ? make : undefined}
      model={typeof model === "string" ? model : undefined}
      year={typeof year === "string" ? year : undefined}
    />
  )
}
