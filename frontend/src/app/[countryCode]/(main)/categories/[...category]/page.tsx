import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle } from "@lib/data/categories"
import { getBaseURL } from "@lib/util/env"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { parseOptionValueIds } from "@lib/util/product-option-filters"
export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<
    Record<string, string | string[] | undefined> & {
      sortBy?: SortOptions
      page?: string
      optionValueIds?: string | string[]
    }
  >
}


export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category)

    const title = productCategory.name

    const description = productCategory.description ?? `${title} category.`

    return {
      title: `${title} | Cartunez`,
      description,
      alternates: {
        canonical: `${getBaseURL()}/categories/${params.category.join("/")}`,
      },
    }
  } catch {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page, minPrice, maxPrice, brand, make, model, year } = searchParams
  const optionValueIds = parseOptionValueIds(searchParams)

  const minPriceNum = typeof minPrice === "string" ? parseFloat(minPrice) : undefined
  const maxPriceNum = typeof maxPrice === "string" ? parseFloat(maxPrice) : undefined

  const productCategory = await getCategoryByHandle(params.category)

  if (!productCategory) {
    notFound()
  }

  return (
    <CategoryTemplate
      category={productCategory}
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