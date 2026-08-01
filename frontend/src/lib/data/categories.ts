import { commerceClient } from "@lib/config"
import type * as HttpTypes from "@lib/commerce/medusa-v1/types"
import { getCacheOptions } from "./cookies"

export const listCategories = async (query?: Record<string, unknown>) => {
  const next = {
    ...(await getCacheOptions("categories")),
  }

  const limit = query?.limit || 100
  const { fields: _fields, ...nativeQuery } = query || {}

  return commerceClient
    .fetch<{ product_categories: HttpTypes.StoreProductCategory[] }>(
      "/store/product-categories",
      {
        query: {
          expand:
            // parent_category.parent_category is not a valid relation in this
            // Medusa v1 schema and makes the endpoint return 500
            "category_children,products,parent_category",
          limit,
          ...nativeQuery,
        },
        next,
        cache: "force-cache",
      }
    )
    .then(({ product_categories }) => product_categories)
}

export const getCategoryByHandle = async (categoryHandle: string[]) => {
  const handle = `${categoryHandle.join("/")}`

  const next = {
    ...(await getCacheOptions("categories")),
  }

  return commerceClient
    .fetch<HttpTypes.StoreProductCategoryListResponse>(
      `/store/product-categories`,
      {
        query: {
          expand: "category_children,products",
          handle,
        },
        next,
        cache: "force-cache",
      }
    )
    .then(({ product_categories }) => product_categories[0])
}
